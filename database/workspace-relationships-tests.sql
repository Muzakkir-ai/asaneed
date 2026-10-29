begin;
insert into auth.users(id,email,email_confirmed_at) values
('cce0ba60-0000-4000-8000-000000000001','relationship-admin@example.invalid',now()),
('cce0ba60-0000-4000-8000-000000000002','relationship-shaykh@example.invalid',now());
update public.accounts set role='admin',active=true where auth_user_id='cce0ba60-0000-4000-8000-000000000001';
update public.accounts set role='shaykh',active=true where auth_user_id='cce0ba60-0000-4000-8000-000000000002';
select set_config('test.target',(select id::text from public.accounts where auth_user_id='cce0ba60-0000-4000-8000-000000000002'),true);
set local role authenticated;
select set_config('request.jwt.claim.sub','cce0ba60-0000-4000-8000-000000000001',true);
select set_config('test.issuer',public.create_issuer_profile('Relationship fixture','{}',false)::text,true);
do $$declare personal uuid; begin
 if not exists(select 1 from public.issuer_accounts ia join public.accounts a on a.id=ia.account_id where a.auth_user_id=auth.uid() and ia.issuer_id=current_setting('test.issuer')::uuid) then raise exception 'New issuer was not assigned'; end if;
 personal:=public.create_issuer_profile('Personal fixture','{}',true);
 if personal=current_setting('test.issuer')::uuid then raise exception 'Personal issuer reused an unrelated assigned profile'; end if;
 if public.create_issuer_profile('Repeated personal fixture','{}',true)<>personal then raise exception 'Duplicate personal profile'; end if;
 perform public.set_issuer_assignment(current_setting('test.target')::uuid,current_setting('test.issuer')::uuid,true);
end $$;
select set_config('request.jwt.claim.sub','cce0ba60-0000-4000-8000-000000000002',true);
do $$ begin
 if not exists(select 1 from public.issuers where id=current_setting('test.issuer')::uuid) then raise exception 'Assigned shaykh cannot read issuer'; end if;
 begin perform public.set_issuer_assignment(current_setting('test.target')::uuid,current_setting('test.issuer')::uuid,false);raise exception 'Non-admin changed assignments';exception when insufficient_privilege then null;end;
 begin perform public.full_application_backup();raise exception 'Private backup exposed';exception when insufficient_privilege then null;end;
end $$;
rollback;
select 'PASS: issuer assignments, distinct/idempotent personal profiles, assigned access and non-admin permission boundaries' as result;
