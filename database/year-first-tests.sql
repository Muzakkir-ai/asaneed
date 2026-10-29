begin;
insert into auth.users(id,email,email_confirmed_at) values('cce0ba99-0000-4000-8000-000000000001','numbering-fixture@example.invalid',now());
update public.accounts set active=true where auth_user_id='cce0ba99-0000-4000-8000-000000000001';
insert into public.issuers(id,display_name,issuer_code) values('cce0ba99-0000-4000-8000-000000000002','Numbering fixture','96');
insert into public.students(id,display_name) values('cce0ba99-0000-4000-8000-000000000003','Numbering fixture');
insert into public.certificates(id,issuer_id,student_id,riwayah_code,completion_date) values
('cce0ba99-0000-4000-8000-000000000004','cce0ba99-0000-4000-8000-000000000002','cce0ba99-0000-4000-8000-000000000003','10','2026-01-01'),
('cce0ba99-0000-4000-8000-000000000005','cce0ba99-0000-4000-8000-000000000002','cce0ba99-0000-4000-8000-000000000003','10','2026-01-02'),
('cce0ba99-0000-4000-8000-000000000006','cce0ba99-0000-4000-8000-000000000002','cce0ba99-0000-4000-8000-000000000003','10','2027-01-01');
set local role authenticated;
select set_config('request.jwt.claim.sub','cce0ba99-0000-4000-8000-000000000001',true);
do $$ begin
 begin perform public.save_personal_issuer_profile('{"printedName":"Must reject"}');raise exception 'Non-admin personal issuer creation allowed';exception when insufficient_privilege then null;end;
 begin perform public.reserve_certificate_number('cce0ba99-0000-4000-8000-000000000004');raise exception 'Non-admin unassigned certificate allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','393ac60e-11fb-418b-910f-ee2d4d807fbd',true);
do $$ declare first_id uuid; begin
 first_id:=public.save_personal_issuer_profile('{"printedName":"Personal fixture","personalAccount":"forged"}');
 if first_id<>public.save_personal_issuer_profile('{}') then raise exception 'Duplicate personal issuer';end if;
 if public.reserve_certificate_number('cce0ba99-0000-4000-8000-000000000004')<>'2696-1001' then raise exception 'Year-first numbering failed'; end if;
 if public.reserve_certificate_number('cce0ba99-0000-4000-8000-000000000004')<>'2696-1001' then raise exception 'Reservation not idempotent'; end if;
 if public.reserve_certificate_number('cce0ba99-0000-4000-8000-000000000005')<>'2696-1002' then raise exception 'Sequence failed'; end if;
 if public.reserve_certificate_number('cce0ba99-0000-4000-8000-000000000006')<>'2796-1001' then raise exception 'Annual restart failed'; end if;
 if public.finalize_certificate('cce0ba99-0000-4000-8000-000000000004','{"fixture":true,"formatting":"{}"}')<>'2696-1001' then raise exception 'Finalization mismatch'; end if;
end $$;
reset role;
do $$ begin
 if (select print_profile->>'personalAccount' from public.issuers where display_name='Personal fixture')<>(select id::text from public.accounts where auth_user_id='393ac60e-11fb-418b-910f-ee2d4d807fbd') then raise exception 'Personal account spoofed';end if;
 if (select (content->>'formatting')::jsonb->>'registrationNumber' from public.certificate_snapshots where certificate_id='cce0ba99-0000-4000-8000-000000000004')<>'2696-1001' then raise exception 'Snapshot mismatch';end if;
end $$;
rollback;
select 'PASS: personal profile idempotence/isolation, admin gate, year-first numbering, reservations, annual restart and finalized snapshot' as result;
