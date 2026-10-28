begin;
insert into auth.users(id,email,email_confirmed_at) values
('cce0ba20-0000-4000-8000-000000000001','management-admin@example.invalid',now()),
('cce0ba20-0000-4000-8000-000000000002','management-pending@example.invalid',now()),
('cce0ba20-0000-4000-8000-000000000003','management-unverified@example.invalid',null);
update public.accounts set role='admin',active=true where auth_user_id='cce0ba20-0000-4000-8000-000000000001';
select set_config('test.pending',(select id::text from public.accounts where auth_user_id='cce0ba20-0000-4000-8000-000000000002'),true);
select set_config('test.unverified',(select id::text from public.accounts where auth_user_id='cce0ba20-0000-4000-8000-000000000003'),true);
select set_config('test.issuer',(select id::text from public.issuers order by issuer_code limit 1),true);
set local role authenticated;
select set_config('request.jwt.claim.sub','cce0ba20-0000-4000-8000-000000000002',true);
do $$ begin
 begin perform public.approve_account(current_setting('test.pending')::uuid,'student'); raise exception 'Non-admin approval allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','cce0ba20-0000-4000-8000-000000000001',true);
do $$ begin
 begin perform public.approve_account(current_setting('test.pending')::uuid,'admin'); raise exception 'Admin escalation allowed'; exception when raise_exception then if sqlerrm<>'Invalid role' then raise; end if; end;
 begin perform public.approve_account(current_setting('test.unverified')::uuid,'student'); raise exception 'Unverified approval allowed'; exception when raise_exception then if sqlerrm<>'Verified identity required' then raise; end if; end;
end $$;
select public.approve_account(current_setting('test.pending')::uuid,'shaykh',current_setting('test.issuer')::uuid);
do $$ begin
 if not exists(select 1 from public.accounts where id=current_setting('test.pending')::uuid and role='shaykh' and active) then raise exception 'Approval failed'; end if;
 if not exists(select 1 from public.issuer_accounts where account_id=current_setting('test.pending')::uuid and issuer_id=current_setting('test.issuer')::uuid) then raise exception 'Issuer assignment failed'; end if;
end $$;
rollback;
