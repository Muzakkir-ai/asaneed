-- All fixtures and changes roll back. Run as the database owner in a test session.
begin;
insert into auth.users(id,email) values
 ('10000000-0000-0000-0000-000000000001','admin-test@example.invalid'),
 ('10000000-0000-0000-0000-000000000002','shaykh-test@example.invalid'),
 ('10000000-0000-0000-0000-000000000003','other-test@example.invalid'),
 ('10000000-0000-0000-0000-000000000004','inactive-test@example.invalid'),
 ('10000000-0000-0000-0000-000000000005','student-test@example.invalid');
insert into public.accounts(id,auth_user_id,display_name,role,active) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Test admin','admin',true),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Test shaykh','shaykh',true),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003','Other shaykh','shaykh',true),
 ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004','Inactive','admin',false),
 ('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000005','Student','student',true);
insert into public.issuers(id,display_name,issuer_code) values ('30000000-0000-0000-0000-000000000001','Other issuer','99');
insert into public.issuer_accounts values ('64dd31bc-7105-4732-8646-148f27fe7fca','20000000-0000-0000-0000-000000000002'),('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003');
insert into public.students(id,display_name) values ('40000000-0000-0000-0000-000000000001','مُحَمَّد مُذَكِّر');
insert into public.qiraat values ('test-asim','عاصم',null);
insert into public.riwayat values ('98','test-asim','Test riwayah');
insert into public.certificates(id,issuer_id,student_id,riwayah_code,completion_date,recipient_account_id) values
 ('50000000-0000-0000-0000-000000000001','64dd31bc-7105-4732-8646-148f27fe7fca','40000000-0000-0000-0000-000000000001','98','2026-10-01','20000000-0000-0000-0000-000000000005'),
 ('50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','98','2026-10-01',null);
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $$ begin
 if (select count(*) from public.certificates) <> 1 then raise exception 'Issuer isolation failed'; end if;
 if (select count(*) from public.students) <> 1 then raise exception 'Shared students missing'; end if;
 if public.normalize_arabic('مُحَمَّد مُذَكِّر') <> 'محمد مذكر' then raise exception 'Arabic normalization failed'; end if;
 begin
 perform public.finalize_certificate('50000000-0000-0000-0000-000000000002','{"test":true}');
 raise exception 'Cross issuer finalization allowed';
 exception when insufficient_privilege then null; end;
 if public.finalize_certificate('50000000-0000-0000-0000-000000000001','{"test":true}') <> '0126-9801' then raise exception 'Wrong registration format'; end if;
 if (select count(*) from public.certificate_snapshots) <> 1 then raise exception 'Snapshot missing'; end if;
 update public.certificates set draft='{"changed":true}' where id='50000000-0000-0000-0000-000000000001';
 if found then raise exception 'Final certificate writable'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
do $$ begin
 if (select count(*) from public.certificates) <> 1 then raise exception 'Other issuer isolation failed'; end if;
 if (select count(*) from public.students) <> 1 then raise exception 'Students not shared'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000004',true);
do $$ begin
 if (select count(*) from public.certificates) <> 0 or (select count(*) from public.students) <> 0 then raise exception 'Inactive account access'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000005',true);
do $$ begin
 if (select count(*) from public.certificates) <> 1 then raise exception 'Student certificate visibility failed'; end if;
 if (select count(*) from public.students) <> 0 then raise exception 'Student directory exposed'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
 if (select count(*) from public.certificates) <> 2 then raise exception 'Admin visibility failed'; end if;
 begin
 delete from public.students where id='40000000-0000-0000-0000-000000000001';
 raise exception 'Referenced student deleted';
 exception when foreign_key_violation then null; end;
end $$;
reset role;
do $$ begin
 if has_table_privilege('anon','public.certificates','SELECT') then raise exception 'Public certificates exposed'; end if;
 if has_table_privilege('authenticated','private.legacy_records','SELECT') then raise exception 'Staging exposed'; end if;
 begin
 update public.certificate_snapshots set content='{}' where certificate_id='50000000-0000-0000-0000-000000000001';
 raise exception 'Snapshot mutation was accepted';
 exception when raise_exception then
 if sqlerrm <> 'Certificate snapshots are immutable' then raise; end if;
 end;
 begin
 update public.certificates set draft='{}' where id='50000000-0000-0000-0000-000000000001';
 raise exception 'Final certificate mutation was accepted';
 exception when raise_exception then
 if sqlerrm <> 'Finalized certificates are immutable' then raise; end if;
 end;
end $$;
set local role anon;
do $$ declare response jsonb; begin
 response := public.verify_ijazah('0126-9801');
 if response->>'status' <> 'verified' then raise exception 'Finalized ijazah lookup failed'; end if;
 if response->'certificate' ? 'certificate_id' or response->'certificate' ? 'draft' then raise exception 'Private fields exposed'; end if;
 if response->'certificate'->>'student_name' <> 'مُحَمَّد مُذَكِّر' then raise exception 'Wrong student returned'; end if;
 if public.verify_ijazah('9926-9801')->>'status' <> 'not_found' then raise exception 'Draft appeared in public lookup'; end if;
 begin
 perform public.verify_ijazah('%');
 raise exception 'Wildcard lookup allowed';
 exception when invalid_parameter_value then null; end;
 begin
 perform count(*) from public.certificates;
 raise exception 'Anonymous certificate enumeration allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: issuer isolation, shared students, inactive accounts, student access, finalization, snapshot protection, deletion guard, Arabic search, public exact lookup, draft exclusion, anonymous table denial' as result;
rollback;
