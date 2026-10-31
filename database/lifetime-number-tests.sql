begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where role='admin' and active and auth_user_id is not null order by id limit 1),'role','authenticated')::text,true);
-- Deliberately advance one counter in this rollback-only test to exercise 99 -> 100.
update private.issuer_certificate_counters set last_number=99 where issuer_id=(select issuer_id from public.certificates order by created_at,id limit 1);
set local role authenticated;
do $$
declare sample public.certificates; a public.certificates; b public.certificates; n text; again text; token text; verified jsonb;begin
 select * into strict sample from public.certificates order by created_at,id limit 1;
 a:=sample;a.id:=gen_random_uuid();a.status:='draft';a.registration_number:=null;a.verification_token:=null;a.legacy_id:=null;a.completion_date:='2026-12-01';a.created_at:=now();
 insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft) values(a.issuer_id,a.student_id,a.sanad_id,a.riwayah_code,a.completion_date,a.draft) returning * into a;
 n:=public.reserve_certificate_number(a.id);
 if substring(n from 6 for length(n)-7)<>'100' or right(n,2)<>a.riwayah_code then raise exception '100 boundary failed';end if;
 if public.reserve_certificate_number(a.id)<>n then raise exception 'Reservation is not idempotent';end if;
 update public.certificates set completion_date='2027-01-01' where id=a.id;
 again:=public.reserve_certificate_number(a.id);
 if left(again,2)<>'27' or substring(again,6)<>substring(n,6) then raise exception 'Serial changed across years';end if;
 delete from public.certificates where id=a.id;
 b:=a;b.id:=gen_random_uuid();b.riwayah_code:=case when a.riwayah_code='01' then '02' else '01' end;
 insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft) values(b.issuer_id,b.student_id,b.sanad_id,b.riwayah_code,b.completion_date,b.draft) returning * into b;
 n:=public.reserve_certificate_number(b.id);
 if substring(n from 6 for length(n)-7)<>'101' or right(n,2)<>b.riwayah_code then raise exception 'Deleted serial reused or riwayah counter split';end if;
 if public.finalize_certificate(b.id,jsonb_build_object('chain','Rollback-only test','formatting','{}'))<>n then raise exception 'Finalization changed reserved number';end if;
 select verification_token into token from public.certificates where id=b.id;
 if length(token)<32 then raise exception 'Missing verification token';end if;
 verified:=public.verify_ijazah(n);
 if verified->>'status'<>'verified' then raise exception 'Long number lookup failed';end if;
 begin update public.certificates set completion_date='2028-01-01' where id=b.id; if (select completion_date from public.certificates where id=b.id)='2028-01-01' then raise exception 'Finalized record mutable';end if;exception when raise_exception then if sqlerrm='Finalized record mutable' then raise;end if;end;
end $$;
rollback;
