begin;
insert into auth.users(id,email,email_confirmed_at) values
('cce0ba40-0000-4000-8000-000000000001','studio-admin@example.invalid',now()),
('cce0ba40-0000-4000-8000-000000000002','studio-shaykh@example.invalid',now()),
('cce0ba40-0000-4000-8000-000000000003','studio-student@example.invalid',now());
update public.accounts set role='admin',active=true where auth_user_id='cce0ba40-0000-4000-8000-000000000001';
update public.accounts set role='shaykh',active=true where auth_user_id='cce0ba40-0000-4000-8000-000000000002';
update public.accounts set active=true where auth_user_id='cce0ba40-0000-4000-8000-000000000003';
insert into public.workspace_records(kind,id,payload) values
('ijazahHoldings','cce0ba40-0000-4000-8000-000000000004','{"ownerId":"cce0ba40-0000-4000-8000-000000000002","name":"Owned fixture"}'),
('ijazahHoldings','cce0ba40-0000-4000-8000-000000000005','{"ownerId":"someone-else","name":"Private fixture"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','cce0ba40-0000-4000-8000-000000000002',true);
do $$ begin
 if (select count(*) from public.workspace_records where id in ('cce0ba40-0000-4000-8000-000000000004','cce0ba40-0000-4000-8000-000000000005'))<>1 then raise exception 'Workspace owner isolation failed'; end if;
 begin insert into public.workspace_records(kind,payload) values('ijazahHoldings','{"ownerId":"someone-else"}'); raise exception 'Owner spoof accepted'; exception when insufficient_privilege then null; end;
 begin insert into public.workspace_records(kind,payload) values('sanadSections','{"ownerId":"","sectionType":"introduction"}'); raise exception 'Shared edit accepted'; exception when insufficient_privilege then null; end;
 begin perform public.full_application_backup(); raise exception 'Backup access leaked'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','cce0ba40-0000-4000-8000-000000000003',true);
do $$ begin
 if exists(select 1 from public.workspace_records where kind<>'assetSources') then raise exception 'Student workspace data exposed'; end if;
end $$;
select set_config('request.jwt.claim.sub','cce0ba40-0000-4000-8000-000000000001',true);
do $$ declare data jsonb; begin
 data:=public.full_application_backup();
 if not data ? 'registration_counters' or not data ? 'legacy_records' then raise exception 'Backup incomplete'; end if;
 perform public.restore_application_backup(data,false);
 perform public.restore_application_backup(data,true);
end $$;
reset role;
do $$ begin
 if has_table_privilege('anon','public.workspace_records','SELECT') then raise exception 'Anonymous workspace access'; end if;
 if has_function_privilege('anon','public.full_application_backup()','EXECUTE') then raise exception 'Anonymous backup access'; end if;
end $$;
rollback;
select 'PASS: workspace owner isolation, scope spoof denial, shared-edit protection, student privacy, full backup/restore roundtrip and anonymous denial' as result;
