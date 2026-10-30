-- Additive metadata only: existing source flags and historical copies are preserved.
alter table public.builder_chains
 add column upper_route_name text not null default '' check(length(upper_route_name)<=250),
 add column branch_route_name text not null default '' check(length(branch_route_name)<=250),
 add column reading_scope text not null default 'unspecified' check(reading_scope in ('unspecified','sughra','kubra'));
alter table public.builder_nodes
 add column source_level text check(source_level in ('upper','branch')),
 add constraint builder_source_level_requires_role check(source_level is null or route_source);
-- Existing RLS and grants remain in force. Same invoker function, revision lock and ownership checks.
create or replace function public.save_builder_chain(record jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare target uuid; actor uuid; existing public.builder_chains; node jsonb; branch jsonb; b integer:=0;p integer; parent public.builder_chains; book public.builder_books;previous_nodes jsonb;
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
 update public.builder_chains set title=record->>'title',book_id=book.id,book_chain_id=parent.id,qari_id=coalesce(record->>'qari_id',''),rawi=coalesce(record->>'rawi',''),continuation=coalesce(record->>'continuation',''),confirmed=coalesce((record->>'confirmed')::boolean,false),upper_route_name=coalesce(record->>'upper_route_name',existing.upper_route_name),branch_route_name=coalesce(record->>'branch_route_name',existing.branch_route_name),reading_scope=coalesce(record->>'reading_scope',existing.reading_scope),revision=revision+1 where id=target;
 select jsonb_agg(to_jsonb(n)) into previous_nodes from public.builder_nodes n where chain_id=target;
 delete from public.builder_nodes where chain_id=target;
 else
 insert into public.builder_chains(owner_id,book_id,book_chain_id,kind,title,qari_id,rawi,continuation,confirmed,upper_route_name,branch_route_name,reading_scope) values(actor,book.id,parent.id,record->>'kind',record->>'title',coalesce(record->>'qari_id',''),coalesce(record->>'rawi',''),coalesce(record->>'continuation',''),coalesce((record->>'confirmed')::boolean,false),coalesce(record->>'upper_route_name',''),coalesce(record->>'branch_route_name',''),coalesce(record->>'reading_scope','unspecified')) returning id into target;
 end if;
 if jsonb_array_length(record->'branches') not between 1 and 100 then raise exception 'Add a chain branch';end if;
 for branch in select value from jsonb_array_elements(record->'branches') loop
 p:=0;
 for node in select value from jsonb_array_elements(branch) loop
 if not exists(select 1 from public.builder_people where id=(node->>'person_id')::uuid and not archived) then raise exception 'Narrator unavailable';end if;
 insert into public.builder_nodes(chain_id,branch,position,person_id,route_source,source_level) values(target,b,p,(node->>'person_id')::uuid,coalesce((node->>'route_source')::boolean,false),case when coalesce((node->>'route_source')::boolean,false) then case when node ? 'source_level' then nullif(node->>'source_level','') else (select j->>'source_level' from jsonb_array_elements(coalesce(previous_nodes,'[]'::jsonb)) j where (j->>'branch')::integer=b and (j->>'position')::integer=p and j->>'person_id'=node->>'person_id') end else null end);p:=p+1;
 end loop;b:=b+1;
 end loop;
 return target;
end $$;
revoke all on function public.save_builder_chain(jsonb) from public,anon;
grant execute on function public.save_builder_chain(jsonb) to authenticated;
