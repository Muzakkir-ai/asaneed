-- Staging only. All synthetic rows are rolled back.
begin;
create temporary table page_fixture as select issuer_id,student_id,sanad_id,riwayah_code from public.certificates limit 1;
grant select on page_fixture to authenticated;
insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft)
select f.issuer_id,f.student_id,f.sanad_id,f.riwayah_code,'2095-01-01','{}'::jsonb from page_fixture f cross join generate_series(1,10001);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where active and role='admin' and auth_user_id is not null limit 1),'role','authenticated')::text,true) is not null as authorized;
set local role authenticated;
do $$
declare ids uuid[]; a jsonb; b jsonb; empty_result jsonb;
begin
 select array_agg(issuer_id) into ids from page_fixture;
 a:=public.certificate_list_page(ids,2095,'draft','completion-desc',0);
 b:=public.certificate_list_page(ids,2095,'draft','completion-desc',1000000);
 if (a->>'totalCertificates')::integer<>10001 or (a->>'pages')::integer<>667 or jsonb_array_length(a->'ids')<>15 or (b->>'page')::integer<>666 or jsonb_array_length(b->'ids')<>11 then raise exception 'Large dataset page boundaries incorrect: % %',a,b;end if;
 if exists(select 1 from jsonb_array_elements_text(a->'ids') x join jsonb_array_elements_text(b->'ids') y on x.value=y.value) then raise exception 'Duplicate page membership';end if;
 empty_result:=public.certificate_list_page(ids,2095,'final','added',12);
 if (empty_result->>'totalCertificates')::integer<>0 or (empty_result->>'page')::integer<>0 or jsonb_array_length(empty_result->'ids')<>0 then raise exception 'Empty page not clamped';end if;
 if not (a->'years' ? '2095') then raise exception 'Year filter choices missing';end if;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where active and role='student' and auth_user_id is not null limit 1),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$ declare ids uuid[]; a jsonb;begin
 select array_agg(issuer_id) into ids from page_fixture;
 a:=public.certificate_list_page(ids,2095,'draft','added',0);
 if (a->>'totalCertificates')::integer<>0 or jsonb_array_length(a->'ids')<>0 or jsonb_array_length(a->'years')<>0 then raise exception 'Unauthorized data exposed';end if;
end $$;
reset role;
select 'PASS: 10001 database rows, 15 per page, last page clamped, status/year filters, no student data leakage' as result;
rollback;
