begin;
create function private.builder_access(owner uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.accounts a where a.auth_user_id=(select auth.uid()) and a.active and a.role in ('admin','shaykh') and (a.id=owner or a.role='admin'));
$$;
grant execute on function private.builder_access(uuid) to authenticated;
create table public.builder_people(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.accounts(id),name text not null check(length(name) between 2 and 250),search_key text not null,display_name text not null default '',archived boolean not null default false,unique(owner_id,search_key));
create table public.builder_books(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.accounts(id),title text not null check(length(title) between 2 and 250),author_id uuid not null references public.builder_people(id),archived boolean not null default false);
create sequence public.builder_route_number start 1000 maxvalue 9999;
revoke all on sequence public.builder_route_number from public,anon;
grant usage on sequence public.builder_route_number to authenticated;
create table public.builder_chains(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.accounts(id),book_id uuid not null references public.builder_books(id),book_chain_id uuid references public.builder_chains(id),route_code text not null default lpad(nextval('public.builder_route_number')::text,4,'0') unique,kind text not null check(kind in ('book','route')),title text not null check(length(title) between 2 and 250),qari_id text not null default '',rawi text not null default '',continuation text not null default '',confirmed boolean not null default false,archived boolean not null default false,revision integer not null default 1,check((kind='book' and book_chain_id is null) or(kind='route' and book_chain_id is not null)));
create table public.builder_nodes(chain_id uuid not null references public.builder_chains(id) on delete cascade,branch integer not null check(branch between 0 and 99),position integer not null check(position between 0 and 499),person_id uuid not null references public.builder_people(id),route_source boolean not null default false,primary key(chain_id,branch,position));
create index builder_people_owner_idx on public.builder_people(owner_id);
create index builder_books_owner_idx on public.builder_books(owner_id);
create index builder_books_author_idx on public.builder_books(author_id);
create index builder_chains_owner_idx on public.builder_chains(owner_id);
create index builder_chains_book_idx on public.builder_chains(book_id);
create index builder_chains_parent_idx on public.builder_chains(book_chain_id);
create index builder_nodes_person_idx on public.builder_nodes(person_id);
do $$ declare t text;begin
 foreach t in array array['builder_people','builder_books','builder_chains'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select,insert,update on public.%I to authenticated',t);
 execute format('create policy builder_read on public.%I for select to authenticated using(private.builder_access(owner_id))',t);
 execute format('create policy builder_insert on public.%I for insert to authenticated with check(private.builder_access(owner_id))',t);
 execute format('create policy builder_update on public.%I for update to authenticated using(private.builder_access(owner_id)) with check(private.builder_access(owner_id))',t);
 end loop;
end $$;
alter table public.builder_nodes enable row level security;
revoke all on public.builder_nodes from public,anon,authenticated;
grant select,insert,delete on public.builder_nodes to authenticated;
create policy builder_nodes_read on public.builder_nodes for select to authenticated using(exists(select 1 from public.builder_chains c where c.id=chain_id and private.builder_access(c.owner_id)));
create policy builder_nodes_insert on public.builder_nodes for insert to authenticated with check(exists(select 1 from public.builder_chains c where c.id=chain_id and private.builder_access(c.owner_id)) and exists(select 1 from public.builder_people p where p.id=person_id and private.builder_access(p.owner_id)));
create policy builder_nodes_delete on public.builder_nodes for delete to authenticated using(exists(select 1 from public.builder_chains c where c.id=chain_id and private.builder_access(c.owner_id)));
create function private.validate_builder_links() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_table_name='builder_books' then
 if not exists(select 1 from public.builder_people where id=new.author_id and not archived) then raise exception 'Author unavailable';end if;
 elsif tg_table_name='builder_chains' then
 if not exists(select 1 from public.builder_books where id=new.book_id and not archived) then raise exception 'Book unavailable';end if;
 if new.kind='route' and not exists(select 1 from public.builder_chains where id=new.book_chain_id and kind='book' and book_id=new.book_id and not archived) then raise exception 'Book chain unavailable';end if;
 end if;
 return new;
end; $$;
create trigger builder_book_links before insert or update on public.builder_books for each row execute function private.validate_builder_links();
create trigger builder_chain_links before insert or update on public.builder_chains for each row execute function private.validate_builder_links();
-- Atomic chain replacement, optimistic concurrency, and parent validation under RLS.
create function public.save_builder_chain(record jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare target uuid; actor uuid; existing public.builder_chains; node jsonb; branch jsonb; b integer:=0;p integer; parent public.builder_chains; book public.builder_books;
begin
 select id into actor from public.accounts where auth_user_id=(select auth.uid()) and active and role in ('admin','shaykh');
 if actor is null then raise exception 'Staff access required';end if;
 select * into book from public.builder_books where id=(record->>'book_id')::uuid and not archived;
 if book.id is null then raise exception 'Book unavailable';end if;
 if record->>'kind'='route' then
 select * into parent from public.builder_chains where id=(record->>'book_chain_id')::uuid and kind='book' and book_id=book.id and not archived;
 if parent.id is null then raise exception 'Book chain unavailable';end if;
 end if;
 if record->>'id' is not null then
 select * into existing from public.builder_chains where id=(record->>'id')::uuid for update;
 if existing.id is null or existing.kind<>record->>'kind' then raise exception 'Chain unavailable';end if;
 if existing.revision is distinct from (record->>'revision')::integer then raise exception 'This chain changed; reload before saving';end if;
 target:=existing.id;
 update public.builder_chains set title=record->>'title',book_id=book.id,book_chain_id=parent.id,qari_id=coalesce(record->>'qari_id',''),rawi=coalesce(record->>'rawi',''),continuation=coalesce(record->>'continuation',''),confirmed=coalesce((record->>'confirmed')::boolean,false),revision=revision+1 where id=target;
 delete from public.builder_nodes where chain_id=target;
 else
 insert into public.builder_chains(owner_id,book_id,book_chain_id,kind,title,qari_id,rawi,continuation,confirmed) values(actor,book.id,parent.id,record->>'kind',record->>'title',coalesce(record->>'qari_id',''),coalesce(record->>'rawi',''),coalesce(record->>'continuation',''),coalesce((record->>'confirmed')::boolean,false)) returning id into target;
 end if;
 if jsonb_array_length(record->'branches') not between 1 and 100 then raise exception 'Add a chain branch';end if;
 for branch in select value from jsonb_array_elements(record->'branches') loop
 p:=0;
 for node in select value from jsonb_array_elements(branch) loop
 if not exists(select 1 from public.builder_people where id=(node->>'person_id')::uuid and not archived) then raise exception 'Narrator unavailable';end if;
 insert into public.builder_nodes(chain_id,branch,position,person_id,route_source) values(target,b,p,(node->>'person_id')::uuid,coalesce((node->>'route_source')::boolean,false));p:=p+1;
 end loop;b:=b+1;
 end loop;
 return target;
end $$;
revoke all on function public.save_builder_chain(jsonb) from public,anon;
grant execute on function public.save_builder_chain(jsonb) to authenticated;
-- Full backups include the complete structured library. Restore parents before children.
do $extend$ declare source text;begin
 source:=pg_get_functiondef('private.full_application_backup()'::regprocedure);
 execute replace(source,'return jsonb_build_object(', 'return jsonb_build_object(''builder_people'',coalesce((select jsonb_agg(to_jsonb(t)) from public.builder_people t),''[]''),''builder_books'',coalesce((select jsonb_agg(to_jsonb(t)) from public.builder_books t),''[]''),''builder_chains'',coalesce((select jsonb_agg(to_jsonb(t)) from public.builder_chains t),''[]''),''builder_nodes'',coalesce((select jsonb_agg(to_jsonb(t)) from public.builder_nodes t),''[]''),');
 source:=pg_get_functiondef('private.restore_application_backup(jsonb,boolean)'::regprocedure);
 execute replace(source,'return jsonb_build_object(''success''', 'if data ? ''builder_people'' then insert into public.builder_people select * from jsonb_populate_recordset(null::public.builder_people,data->''builder_people'') on conflict(id) do nothing; insert into public.builder_books select * from jsonb_populate_recordset(null::public.builder_books,data->''builder_books'') on conflict(id) do nothing; insert into public.builder_chains select * from jsonb_populate_recordset(null::public.builder_chains,data->''builder_chains'') where kind=''book'' on conflict(id) do nothing; insert into public.builder_chains select * from jsonb_populate_recordset(null::public.builder_chains,data->''builder_chains'') where kind=''route'' on conflict(id) do nothing; insert into public.builder_nodes select * from jsonb_populate_recordset(null::public.builder_nodes,data->''builder_nodes'') on conflict do nothing; end if; return jsonb_build_object(''success''');
end $extend$;
commit;
