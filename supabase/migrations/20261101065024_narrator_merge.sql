begin;
create table public.builder_person_merges (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 actor_id uuid not null references public.accounts(id), snapshot jsonb not null
);
alter table public.builder_person_merges enable row level security;
revoke all on public.builder_person_merges from public,anon,authenticated;
grant select,insert on public.builder_person_merges to authenticated;
create policy merge_audit_read on public.builder_person_merges for select to authenticated using(exists(select 1 from public.accounts a where a.auth_user_id=(select auth.uid()) and a.active and a.role='admin'));
create policy merge_audit_insert on public.builder_person_merges for insert to authenticated with check(exists(select 1 from public.accounts a where a.id=actor_id and a.auth_user_id=(select auth.uid()) and a.active and a.role='admin'));
grant update on public.builder_nodes to authenticated;
create policy builder_nodes_update on public.builder_nodes for update to authenticated using(exists(select 1 from public.builder_chains c where c.id=chain_id and private.builder_access(c.owner_id))) with check(exists(select 1 from public.builder_chains c where c.id=chain_id and private.builder_access(c.owner_id)) and exists(select 1 from public.builder_people p where p.id=person_id and not p.archived and private.builder_access(p.owner_id)));
create function public.merge_builder_people(source_id uuid,target_id uuid,expected_token text default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare actor uuid; src public.builder_people; dst public.builder_people; snap jsonb; token text; affected uuid[]; answer jsonb;
begin
 select id into actor from public.accounts where auth_user_id=(select auth.uid()) and active and role='admin';
 if actor is null then raise exception 'Administrator required'; end if;
 if source_id=target_id then raise exception 'اختر سجلين مختلفين';end if;
 -- Serialize with chain/person edits, so the reviewed impact cannot change during a merge.
 lock table public.builder_people,public.builder_books,public.builder_chains,public.builder_nodes in share row exclusive mode;
 select * into src from public.builder_people where id=source_id and not archived;
 select * into dst from public.builder_people where id=target_id and not archived;
 if src.id is null or dst.id is null then raise exception 'الراوي غير متاح؛ أعد تحميل المكتبة';end if;
 select coalesce(array_agg(distinct c.id),'{}'::uuid[]) into affected from public.builder_chains c where exists(select 1 from public.builder_nodes n where n.chain_id=c.id and n.person_id=source_id) or exists(select 1 from public.builder_books b where b.id=c.book_id and b.author_id=source_id);
 if exists(select 1 from public.builder_chains c join public.builder_books b on b.id=c.book_id where c.id=any(affected) and b.archived) then raise exception 'توجد مراجع في كتاب مؤرشف؛ استعد الكتاب قبل الدمج';end if;
 snap=jsonb_build_object('source',to_jsonb(src),'target',to_jsonb(dst),'nodes',coalesce((select jsonb_agg(to_jsonb(n) order by n.chain_id,n.branch,n.position) from public.builder_nodes n where n.person_id in(source_id,target_id)),'[]'::jsonb),'books',coalesce((select jsonb_agg(to_jsonb(b) order by b.id) from public.builder_books b where b.author_id in(source_id,target_id)),'[]'::jsonb),'chains',coalesce((select jsonb_agg(to_jsonb(c) order by c.id) from public.builder_chains c where c.id=any(affected)),'[]'::jsonb));
 token=md5(snap::text);
 answer=jsonb_build_object('token',token,'sourceName',src.name,'targetName',dst.name,'chains',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'title',c.title) order by c.id) from public.builder_chains c where c.id=any(affected)),'[]'::jsonb),'nodes',(select count(*) from public.builder_nodes where person_id=source_id),'books',(select count(*) from public.builder_books where author_id=source_id));
 if expected_token is null then return answer;end if;
 if token<>expected_token then raise exception 'تغيرت البيانات؛ أعد معاينة الدمج';end if;
 insert into public.builder_person_merges(actor_id,snapshot) values(actor,snap);
 update public.builder_nodes set person_id=target_id where person_id=source_id;
 update public.builder_books set author_id=target_id where author_id=source_id;
 update public.builder_chains set revision=revision+1 where id=any(affected);
 update public.builder_people set archived=true where id=source_id;
 return answer||jsonb_build_object('merged',true);
end; $$;
revoke all on function public.merge_builder_people(uuid,uuid,text) from public,anon;
grant execute on function public.merge_builder_people(uuid,uuid,text) to authenticated;
-- Keep the reversible merge audit with complete application backups.
do $$ declare source text;begin
 select pg_get_functiondef('private.full_application_backup()'::regprocedure) into source;
 execute replace(source,'return jsonb_build_object(', 'return jsonb_build_object(''builder_person_merges'',coalesce((select jsonb_agg(to_jsonb(t)) from public.builder_person_merges t),''[]''),');
end $$;
commit;
