begin;
create temporary table builder_test_ids(k text primary key,id uuid);
insert into builder_test_ids values('owner',(select id from public.accounts where auth_user_id='393ac60e-11fb-418b-910f-ee2d4d807fbd')),('other',(select id from public.accounts where auth_user_id='8d2bac82-eb35-42c0-b725-c9c8ee0fc3a9')),('p',gen_random_uuid()),('hidden',gen_random_uuid()),('book',gen_random_uuid());
grant select on builder_test_ids to authenticated;
insert into public.builder_people(id,owner_id,name,search_key) values((select id from builder_test_ids where k='p'),(select id from builder_test_ids where k='owner'),'اسم اختبار','test-owned'),((select id from builder_test_ids where k='hidden'),(select id from builder_test_ids where k='other'),'اسم خاص','test-hidden');
insert into public.builder_books(id,owner_id,title,author_id) values((select id from builder_test_ids where k='book'),(select id from builder_test_ids where k='owner'),'كتاب اختبار',(select id from builder_test_ids where k='p'));
update public.accounts set role='shaykh' where id=(select id from builder_test_ids where k='owner');
select set_config('request.jwt.claims','{"sub":"393ac60e-11fb-418b-910f-ee2d4d807fbd","role":"authenticated"}',true);
set local role authenticated;
do $$ declare parent uuid;route uuid; record jsonb;begin
 if exists(select 1 from public.builder_people where id=(select id from builder_test_ids where k='hidden')) then raise exception 'Private narrator exposed';end if;
 record:=jsonb_build_object('book_id',(select id from builder_test_ids where k='book'),'kind','book','title','إسناد أول','branches',jsonb_build_array(jsonb_build_array(jsonb_build_object('person_id',(select id from builder_test_ids where k='p')))));
 parent:=public.save_builder_chain(record);
 record:=record||jsonb_build_object('kind','route','confirmed',true,'book_chain_id',parent,'title','طريق أول','qari_id','nafi','rawi','قالون','branches',jsonb_build_array(jsonb_build_array(jsonb_build_object('person_id',(select id from builder_test_ids where k='p'),'route_source',true)),jsonb_build_array(jsonb_build_object('person_id',(select id from builder_test_ids where k='p'),'route_source',true))));
 route:=public.save_builder_chain(record);
perform set_config('builder.test.route',route::text,true);
if public.attach_builder_route(route,jsonb_build_object('ownerId','393ac60e-11fb-418b-910f-ee2d4d807fbd','builderRouteId',route,'tariqNumber',(select route_code from public.builder_chains where id=route),'qariId','nafi','rawi','قالون','personalChain',repeat('عن راو محفوظ، ',20),'chainMode','complete','junction','jazari'),null) is null then raise exception 'Personal attachment failed';end if;

 if (select count(*) from public.builder_nodes where chain_id=route)<>2 then raise exception 'Branches not retained';end if;
 begin perform public.save_builder_chain(record||jsonb_build_object('id',route,'revision',99));raise exception 'Stale update accepted';exception when raise_exception then if sqlerrm='Stale update accepted' then raise;end if;end;
 begin perform public.save_builder_chain(record||jsonb_build_object('id',route,'revision',1,'branches',jsonb_build_array(jsonb_build_array(jsonb_build_object('person_id',(select id from builder_test_ids where k='hidden'))))));raise exception 'Private node accepted';exception when raise_exception then if sqlerrm='Private node accepted' then raise;end if;end;
 if (select count(*) from public.builder_nodes where chain_id=route)<>2 then raise exception 'Failed replacement was not atomic';end if;
end $$;
-- Explicitly distinct same-name people keep independent IDs and aliases.
do $$ declare duplicate uuid:=gen_random_uuid(); saved uuid;begin
 insert into public.builder_people(id,owner_id,name,display_name,search_key)
 values(duplicate,(select id from builder_test_ids where k='owner'),'اسم اختبار','أبو الاختبار','test-owned #'||duplicate::text);
 saved:=public.save_builder_chain(jsonb_build_object('book_id',(select id from builder_test_ids where k='book'),'kind','book','title','اختبار هوية مستقلة','branches',jsonb_build_array(jsonb_build_array(jsonb_build_object('person_id',duplicate)))));
 if (select person_id from public.builder_nodes where chain_id=saved limit 1)<>duplicate then raise exception 'Selected identity replaced by matching name';end if;
 if (select display_name from public.builder_people where id=duplicate)<>'أبو الاختبار' then raise exception 'Alias not preserved';end if;
 if not exists(select 1 from public.builder_people where id=(select id from builder_test_ids where k='p')) then raise exception 'Original person changed';end if;
end $$;
reset role;
update public.accounts set role='student' where id=(select id from builder_test_ids where k='owner');
set local role authenticated;
do $$begin if exists(select 1 from public.builder_books) or exists(select 1 from public.builder_nodes) then raise exception 'Student accessed builder';end if;end $$;
reset role;
set local role anon;
do $$begin begin perform count(*) from public.builder_books;raise exception 'Anonymous access accepted';exception when insufficient_privilege then null;end;end $$;
reset role;
update public.accounts set role='admin' where id=(select id from builder_test_ids where k='owner');
set local role authenticated;
do $$ declare route uuid:=current_setting('builder.test.route')::uuid;extra uuid:='d5044cff-5782-4117-9ec4-109c2da93050';holding jsonb;first_id uuid;begin
 holding:=jsonb_build_object('ownerId','guest:'||extra,'builderRouteId',route,'tariqNumber',(select route_code from public.builder_chains where id=route),'qariId','nafi','rawi','قالون','personalChain',repeat('عن راو محفوظ، ',20),'chainMode','complete','junction','jazari');
 first_id:=public.attach_builder_route(route,holding,extra);
 if first_id<>public.attach_builder_route(route,holding,extra) then raise exception 'Duplicate attachment';end if;
 if (select count(*) from public.workspace_records where kind='additionalShaykhReadingSanads' and payload->>'builderRouteId'=route::text)<>1 then raise exception 'Extra attachment incomplete';end if;
end $$;
reset role;
do $$begin if not private.full_application_backup() ?& array['builder_people','builder_books','builder_chains','builder_nodes'] then raise exception 'Incomplete full backup';end if;end $$;
rollback;
