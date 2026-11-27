-- Staging only; transaction-local synthetic draft and finalization.
begin;
create temporary table permission_fixture as
select c.issuer_id,c.student_id,c.sanad_id,c.riwayah_code,
 (select id from public.accounts where role='student' and active limit 1) as recipient,
 (select auth_user_id from public.accounts where role='student' and active limit 1) as recipient_uid,
 (select auth_user_id from public.accounts where role='shaykh' and active and id in (select account_id from public.issuer_accounts where issuer_id=c.issuer_id) limit 1) as owner_uid,
 (select auth_user_id from public.accounts where role='shaykh' and active and id not in (select account_id from public.issuer_accounts where issuer_id=c.issuer_id) limit 1) as other_uid
from public.certificates c where exists(select 1 from public.issuer_accounts ia join public.accounts a on a.id=ia.account_id where ia.issuer_id=c.issuer_id and a.role='shaykh' and a.active) limit 1;
grant select on permission_fixture to authenticated;
do $$begin if not exists(select 1 from permission_fixture where owner_uid is not null and other_uid is not null and recipient_uid is not null) then raise exception 'Missing role fixtures';end if;end $$;
insert into public.certificates(id,issuer_id,student_id,sanad_id,riwayah_code,completion_date,recipient_account_id,draft) select 'ab120000-0000-4000-8000-000000000002',issuer_id,student_id,sanad_id,riwayah_code,'2090-01-01',recipient,'{"editor":{"shahadaNumber":1}}'::jsonb from permission_fixture;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select other_uid from permission_fixture),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$begin
 if exists(select 1 from public.certificates where id='ab120000-0000-4000-8000-000000000002') then raise exception 'Cross-issuer draft exposed';end if;
 update public.certificates set completion_date='2090-02-01' where id='ab120000-0000-4000-8000-000000000002';
 if found then raise exception 'Cross-issuer draft writable';end if;
 begin perform public.finalize_certificate('ab120000-0000-4000-8000-000000000002','{"test":true}');raise exception 'Unauthorized finalization';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select owner_uid from permission_fixture),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$begin
 if not exists(select 1 from public.certificates where id='ab120000-0000-4000-8000-000000000002') then raise exception 'Issuer lost draft access';end if;
 perform public.finalize_certificate('ab120000-0000-4000-8000-000000000002','{"chain":"synthetic fixture"}');
 if not exists(select 1 from public.certificate_snapshots where certificate_id='ab120000-0000-4000-8000-000000000002') then raise exception 'Missing finalized snapshot';end if;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select recipient_uid from permission_fixture),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$begin
 if not exists(select 1 from public.certificates where id='ab120000-0000-4000-8000-000000000002' and status='finalized') then raise exception 'Published recipient access broken';end if;
 if not exists(select 1 from public.certificate_snapshots where certificate_id='ab120000-0000-4000-8000-000000000002') then raise exception 'Recipient snapshot access broken';end if;
end $$;
reset role;
select 'PASS: issuer and finalized recipient access, cross-issuer read/write/finalize denial' as result;
rollback;
