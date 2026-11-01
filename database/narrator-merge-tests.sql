-- Rollback-only fixture: never merges real library people.
begin;
select set_config('request.jwt.claim.sub',(select auth_user_id::text from public.accounts where role='admin' and active limit 1),true);
set local role authenticated;
do $$ declare owner uuid; src uuid; dst uuid; book uuid; chain uuid; preview jsonb;
begin
 select id into owner from public.accounts where auth_user_id=auth.uid();
 insert into public.builder_people(owner_id,name,search_key) values(owner,'اختبار مكرر',gen_random_uuid()::text) returning id into src;
 insert into public.builder_people(owner_id,name,search_key) values(owner,'اختبار صحيح',gen_random_uuid()::text) returning id into dst;
 insert into public.builder_books(owner_id,title,author_id) values(owner,'كتاب اختبار الدمج',src) returning id into book;
 insert into public.builder_chains(owner_id,book_id,kind,title) values(owner,book,'book','إسناد اختبار الدمج') returning id into chain;
 insert into public.builder_nodes(chain_id,branch,position,person_id,route_source,source_level) values(chain,0,0,src,true,'upper'),(chain,0,1,dst,false,null);
 preview=public.merge_builder_people(src,dst);
 if (preview->>'nodes')::int<>1 or (preview->>'books')::int<>1 then raise exception 'Preview failed';end if;
 begin perform public.merge_builder_people(src,dst,'stale');raise exception 'Stale check failed';exception when others then if sqlerrm<>'تغيرت البيانات؛ أعد معاينة الدمج' then raise;end if;end;
 perform public.merge_builder_people(src,dst,preview->>'token');
 if exists(select 1 from public.builder_nodes where person_id=src)
 or not exists(select 1 from public.builder_nodes where chain_id=chain and position=0 and person_id=dst and route_source and source_level='upper')
 or not exists(select 1 from public.builder_nodes where chain_id=chain and position=1 and person_id=dst)
 or not exists(select 1 from public.builder_people where id=src and archived)
 or not exists(select 1 from public.builder_books where id=book and author_id=dst)
 or not exists(select 1 from public.builder_chains where id=chain and revision=2)
 or not exists(select 1 from public.builder_person_merges where snapshot->'source'->>'id'=src::text)
 then raise exception 'Merge verification failed';end if;
end $$;
reset role;
do $$ begin if has_function_privilege('anon','public.merge_builder_people(uuid,uuid,text)','execute') then raise exception 'Anonymous access';end if;end $$;
rollback;
