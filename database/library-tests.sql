begin;
insert into auth.users(id,email,email_confirmed_at) values
('cce0ba30-0000-4000-8000-000000000001','library-admin@example.invalid',now()),
('cce0ba30-0000-4000-8000-000000000002','library-student@example.invalid',now());
update public.accounts set role='admin',active=true where auth_user_id='cce0ba30-0000-4000-8000-000000000001';
update public.accounts set active=true where auth_user_id='cce0ba30-0000-4000-8000-000000000002';
insert into public.issuers(id,display_name,issuer_code) values('cce0ba30-0000-4000-8000-000000000003','Reserved number test','96');
insert into public.students(id,display_name) values('cce0ba30-0000-4000-8000-000000000004','Test only');
insert into public.certificates(id,issuer_id,student_id,riwayah_code,completion_date,registration_number) values('cce0ba30-0000-4000-8000-000000000005','cce0ba30-0000-4000-8000-000000000003','cce0ba30-0000-4000-8000-000000000004','10','2026-01-01','2696-1007');
set local role authenticated;
select set_config('request.jwt.claim.sub','cce0ba30-0000-4000-8000-000000000002',true);
do $$ begin
 begin perform public.read_legacy_library(); raise exception 'Student library access allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','cce0ba30-0000-4000-8000-000000000001',true);
do $$ begin
 if jsonb_typeof(public.read_legacy_library()->'records')<>'array' then raise exception 'Library response invalid'; end if;
 if public.finalize_certificate('cce0ba30-0000-4000-8000-000000000005','{"fixture":true,"formatting":"{}"}')<>'2696-1007' then raise exception 'Reserved registration changed'; end if;
end $$;
reset role;
do $$ declare token text; frozen text; begin
 select verification_token into token from public.certificates where id='cce0ba30-0000-4000-8000-000000000005';
 select (content->>'formatting')::jsonb->>'verificationToken' into frozen from public.certificate_snapshots where certificate_id='cce0ba30-0000-4000-8000-000000000005';
 if token is distinct from frozen then raise exception 'QR token mismatch'; end if;
 if not (public.verify_certificate_token(token)->>'verified')::boolean then raise exception 'Public QR lookup failed'; end if;
end; $$;
do $$ begin
 if (select last_number from private.registration_counters where issuer_id='cce0ba30-0000-4000-8000-000000000003' and completion_year=2026 and riwayah_code='10')<>7 then raise exception 'Counter not preserved'; end if;
 if has_function_privilege('anon','public.read_legacy_library(text,integer)','EXECUTE') then raise exception 'Anonymous library access'; end if;
end $$;
rollback;
