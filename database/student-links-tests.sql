begin;
insert into auth.users(id,email) values
('cc000003-0000-4000-8000-000000000001','links-admin@example.invalid'),
('cc000003-0000-4000-8000-000000000002','links-student@example.invalid'),
('cc000003-0000-4000-8000-000000000003','links-other@example.invalid');
update public.accounts set active=true,role=case when auth_user_id='cc000003-0000-4000-8000-000000000001' then 'admin' else 'student' end where auth_user_id::text like 'cc000003-%';
select set_config('test.link_account',(select id::text from public.accounts where auth_user_id='cc000003-0000-4000-8000-000000000002'),true);
insert into public.students(id,display_name) values('cc000003-0000-4000-8000-000000000010','طالب اختبار ربط');
insert into public.certificates(id,issuer_id,student_id,riwayah_code,completion_date,registration_number) values('cc000003-0000-4000-8000-000000000020','64dd31bc-7105-4732-8646-148f27fe7fca','cc000003-0000-4000-8000-000000000010','01','2099-01-01','9901-0199');
insert into public.certificate_snapshots(certificate_id,content) values('cc000003-0000-4000-8000-000000000020','{"chain":"unchanged snapshot","heading":"fixture"}');
update public.certificates set status='finalized' where id='cc000003-0000-4000-8000-000000000020';
set local role authenticated;
select set_config('request.jwt.claim.sub','cc000003-0000-4000-8000-000000000001',true);
select public.set_student_account('cc000003-0000-4000-8000-000000000010',current_setting('test.link_account')::uuid);
do $$ begin
 if not (public.full_application_backup() ? 'student_accounts') then raise exception 'Links absent from complete backup'; end if;
end $$;
select set_config('request.jwt.claim.sub','cc000003-0000-4000-8000-000000000002',true);
do $$ begin
 if not exists(select 1 from public.certificates where id='cc000003-0000-4000-8000-000000000020') then raise exception 'Linked student cannot read published certificate'; end if;
 if not exists(select 1 from public.certificate_snapshots where certificate_id='cc000003-0000-4000-8000-000000000020') then raise exception 'Linked snapshot unavailable'; end if;
 begin perform public.set_student_account('cc000003-0000-4000-8000-000000000010',null); raise exception 'Non-admin changed link'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','cc000003-0000-4000-8000-000000000003',true);
do $$ begin
 if exists(select 1 from public.student_accounts where student_id='cc000003-0000-4000-8000-000000000010') then raise exception 'Another account saw private link'; end if;
 if exists(select 1 from public.students where id='cc000003-0000-4000-8000-000000000010') then raise exception 'Another student saw linked identity'; end if;
 if exists(select 1 from public.certificates where id='cc000003-0000-4000-8000-000000000020') then raise exception 'Another account saw certificate'; end if;
end $$;
reset role;
do $$ begin
 if (select content->>'chain' from public.certificate_snapshots where certificate_id='cc000003-0000-4000-8000-000000000020')<>'unchanged snapshot' then raise exception 'Snapshot changed'; end if;
 if has_table_privilege('anon','public.student_accounts','select') then raise exception 'Anonymous link enumeration'; end if;
end $$;
rollback;
select 'PASS: admin linking, linked recipient access, unrelated account isolation, non-admin mutation denial, unchanged finalized snapshots and complete backup' as result;
