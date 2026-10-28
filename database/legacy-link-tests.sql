begin;
insert into auth.users(id,email,email_confirmed_at) values('cce0ba50-0000-4000-8000-000000000001','link-admin@example.invalid',now()),('cce0ba50-0000-4000-8000-000000000002','link-person@example.invalid',now());
update public.accounts set role='admin',active=true where auth_user_id='cce0ba50-0000-4000-8000-000000000001';
select set_config('test.account',(select id::text from public.accounts where auth_user_id='cce0ba50-0000-4000-8000-000000000002'),true);
insert into private.legacy_records(source_table,source_id,payload) values('Legacy User Directory','test-legacy-person','{"Name":"Legacy named fixture","Email":"link-person@example.invalid","Original User ID":"test-old-owner"}');
insert into public.workspace_records(kind,id,payload) values('ijazahHoldings','cce0ba50-0000-4000-8000-000000000003','{"ownerId":"test-old-owner","name":"Old personal holding"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','cce0ba50-0000-4000-8000-000000000001',true);
do $$ begin
 if not exists(select 1 from jsonb_array_elements(public.legacy_identity_choices())x where x->>'id'='test-old-owner' and x->>'name'='Legacy named fixture') then raise exception 'Named choices missing'; end if;
 begin perform public.save_account_profile(current_setting('test.account')::uuid,'Should roll back','shaykh',true,'missing-legacy-id'); raise exception 'Invalid legacy identity accepted'; exception when raise_exception then if sqlerrm<>'Choose a named legacy person' then raise; end if; end;
 if exists(select 1 from public.accounts where id=current_setting('test.account')::uuid and role<>'student') then raise exception 'Failed link partially changed role'; end if;
 perform public.save_account_profile(current_setting('test.account')::uuid,'Linked fixture','shaykh',true,'test-old-owner');
 if not exists(select 1 from public.workspace_records where id='cce0ba50-0000-4000-8000-000000000003' and payload->>'ownerId'='cce0ba50-0000-4000-8000-000000000002') then raise exception 'Legacy records not linked'; end if;
end $$;
select set_config('request.jwt.claim.sub','cce0ba50-0000-4000-8000-000000000002',true);
do $$ begin
 if jsonb_array_length(public.list_application_accounts())<>1 then raise exception 'Other login emails exposed'; end if;
 begin perform public.legacy_identity_choices(); raise exception 'Legacy directory exposed'; exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: named legacy choices, atomic account/link saves, linked personal records and restricted account emails' as result;
