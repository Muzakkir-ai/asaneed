begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where role='admin' and active and auth_user_id is not null order by id limit 1),'role','authenticated')::text,true);
-- No writes survive this fixture. Use unused future completion years.
insert into private.annual_issuer_counters(issuer_id,year,last_number) select issuer_id,2098,99 from public.certificates order by created_at,id limit 1;
set local role authenticated;
do $$ declare sample public.certificates; a public.certificates; b public.certificates; n text; again text;begin
 select * into strict sample from public.certificates order by created_at,id limit 1;
 insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft) values(sample.issuer_id,sample.student_id,sample.sanad_id,sample.riwayah_code,'2098-12-01',sample.draft) returning * into a;
 n=public.reserve_certificate_number(a.id);
 if substring(n from 6 for length(n)-7)<>'100' then raise exception '100 boundary failed';end if;
 if public.reserve_certificate_number(a.id)<>n then raise exception 'Not idempotent';end if;
 update public.certificates set completion_date='2099-01-01' where id=a.id;
 n=public.reserve_certificate_number(a.id);
 if left(n,2)<>'99' or substring(n from 6 for length(n)-7)<>'01' then raise exception 'New year did not reset to 01';end if;
 insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft) values(sample.issuer_id,sample.student_id,sample.sanad_id,case when sample.riwayah_code='01' then '02' else '01' end,'2099-02-01',sample.draft) returning * into b;
 n=public.reserve_certificate_number(b.id);
 if substring(n from 6 for length(n)-7)<>'02' then raise exception 'Riwayah incorrectly reset issuer sequence';end if;
 delete from public.certificates where id=b.id;
 update public.certificates set completion_date='2098-01-01' where id=a.id;
 n=public.reserve_certificate_number(a.id);
 if substring(n from 6 for length(n)-7)<>'101' then raise exception 'Prior year counter not preserved';end if;
 update public.certificates set completion_date='2099-03-01' where id=a.id;
 n=public.reserve_certificate_number(a.id);
 if substring(n from 6 for length(n)-7)<>'03' then raise exception 'Deleted number was reused';end if;
end $$;
reset role;
do $$ begin
 if exists(select 1 from (select a.serial,row_number() over(partition by c.issuer_id,extract(year from c.completion_date) order by c.created_at,c.id) expected from public.certificates c join private.annual_certificate_allocations a on a.certificate_id=c.id where c.status='draft' and extract(year from c.completion_date)<2098) x where serial<>expected) then raise exception 'Oldest-first existing draft mapping failed';end if;
end $$;
rollback;
