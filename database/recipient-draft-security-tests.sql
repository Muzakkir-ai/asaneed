-- Staging only: rollback all fixture rows.
begin;
create temporary table security_fixture as select c.issuer_id,c.student_id,c.sanad_id,c.riwayah_code,a.id as recipient,a.auth_user_id as recipient_uid from public.certificates c cross join public.accounts a where a.role='student' and a.active and a.auth_user_id is not null limit 1;
grant select on security_fixture to authenticated;
insert into public.certificates(id,issuer_id,student_id,sanad_id,riwayah_code,completion_date,recipient_account_id,draft) select 'ab120000-0000-4000-8000-000000000001',issuer_id,student_id,sanad_id,riwayah_code,'2091-01-01',recipient,'{"editor":{"shahadaNumber":1}}'::jsonb from security_fixture;
insert into public.workspace_records(kind,payload) values('certificateSnapshots',jsonb_build_object('certificateId','ab120000-0000-4000-8000-000000000001','chain','synthetic security fixture'));
select set_config('request.jwt.claims',jsonb_build_object('sub',(select recipient_uid from security_fixture),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$begin
 if exists(select 1 from public.certificates where id='ab120000-0000-4000-8000-000000000001') then raise exception 'Draft exposed';end if;
 if exists(select 1 from public.workspace_records where kind='certificateSnapshots' and payload->>'certificateId'='ab120000-0000-4000-8000-000000000001') then raise exception 'Draft workspace snapshot exposed';end if;
 if has_table_privilege(current_user,'private.application_backups','SELECT') then raise exception 'Backups exposed';end if;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where role='admin' and active limit 1),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$begin
 if not exists(select 1 from public.certificates where id='ab120000-0000-4000-8000-000000000001') then raise exception 'Admin draft access broken';end if;
end $$;
reset role;
select 'PASS: recipient draft and legacy snapshot denied; admin draft access preserved; backup table private' as result;
rollback;
