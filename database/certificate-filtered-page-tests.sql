-- Staging only; synthetic rows are transaction-local. Run against a dedicated staging database.
begin;
create temporary table filtered_fixture as select issuer_id,student_id,sanad_id,riwayah_code from public.certificates where sanad_id is not null limit 1;
grant select on filtered_fixture to authenticated;
insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft)
select f.issuer_id,f.student_id,f.sanad_id,f.riwayah_code,'2093-01-01',jsonb_build_object('editor',jsonb_build_object('shahadaNumber',n)) from filtered_fixture f cross join generate_series(1,10001) n;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where active and role='admin' and auth_user_id is not null limit 1),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$ declare f record; readings jsonb; issuers jsonb; filters jsonb; a jsonb;begin
 select * into strict f from filtered_fixture;
 select jsonb_object_agg(s.id,jsonb_build_object('label','رِوَايَةُ حَفْصٍ عن عاصم','qari','asim','rawi','حفص')) into readings from public.sanads s where s.issuer_id=f.issuer_id;
 issuers:=jsonb_build_object(f.issuer_id::text,jsonb_build_object('key','guest:'||f.issuer_id::text,'name','الشَّيْخ إبراهيم'));
 filters:=jsonb_build_object('query','حَفْص ابراهيم','issuer','guest:'||f.issuer_id::text,'qari','asim','rawi','asim|حفص','year','2093','status','draft','sort','name');
 a:=public.certificate_filtered_page(array[f.issuer_id],readings,issuers,filters,'certificates',0);
 if (a->>'totalCertificates')::int<>10001 or jsonb_array_length(a->'ids')<>15 or (a->>'pages')::int<>667 then raise exception 'Unexpected filtered page';end if;
 a:=public.certificate_filtered_page(array[f.issuer_id],readings,issuers,filters,'certificates',1000000);
 if (a->>'page')::int<>666 or jsonb_array_length(a->'ids')<>11 then raise exception 'Last page incorrect';end if;
 a:=public.certificate_filtered_page(array[f.issuer_id],readings,issuers,filters||'{"query":"nonexistent"}'::jsonb,'certificates',0);
 if (a->>'totalCertificates')::int<>0 then raise exception 'Search false match';end if;
 a:=public.certificate_filtered_page(array[f.issuer_id],readings,issuers,filters,'students',0);
 if a->>'fallback'<>'true' then raise exception 'Oversized group protection failed';end if;
 if private.certificate_search_key('ﻣُﺤَﻤَّﺪ أَحْمَد ۱۲۳ ٤٥٦')<>'محمد احمد 123 456' then raise exception 'Normalization mismatch';end if;
 a:=public.certificate_filtered_page(array[f.issuer_id],'{}'::jsonb,issuers,filters,'certificates',0);
 if a->>'fallback'<>'true' then raise exception 'Missing metadata fallback failed';end if;
end $$;
reset role;
delete from public.certificates where completion_date='2093-01-01';
insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft)
select f.issuer_id,f.student_id,f.sanad_id,f.riwayah_code,'2093-01-01',jsonb_build_object('editor',jsonb_build_object('shahadaNumber',n)) from filtered_fixture f cross join generate_series(1,30) n;
set local role authenticated;
do $$ declare f record; readings jsonb; issuers jsonb; filters jsonb; a jsonb;begin
 select * into strict f from filtered_fixture;
 select jsonb_object_agg(s.id,jsonb_build_object('label','رِوَايَةُ حَفْصٍ عن عاصم','qari','asim','rawi','حفص')) into readings from public.sanads s where s.issuer_id=f.issuer_id;
 issuers:=jsonb_build_object(f.issuer_id::text,jsonb_build_object('key','guest:'||f.issuer_id::text,'name','الشَّيْخ إبراهيم'));
 filters:='{"query":"","issuer":"all","qari":"all","rawi":"all","year":"2093","status":"draft","sort":"added"}'::jsonb;
 a:=public.certificate_filtered_page(array[f.issuer_id],readings,issuers,filters,'students',0);
 if (a->>'totalCertificates')::int<>30 or jsonb_array_length(a->'groups')<>1 or jsonb_array_length(a->'groups'->0)<>30 then raise exception 'Student group failed';end if;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where active and role='student' and auth_user_id is not null limit 1),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$ declare f record; a jsonb;begin
 select * into strict f from filtered_fixture;
 a:=public.certificate_filtered_page(array[f.issuer_id],jsonb_build_object(f.sanad_id::text,jsonb_build_object('label','fake','qari','asim','rawi','حفص')),jsonb_build_object(f.issuer_id::text,jsonb_build_object('key','all','name','fake')),'{"query":"","issuer":"all","qari":"all","rawi":"all","year":"2093","status":"draft","sort":"added"}'::jsonb,'certificates',0);
 if coalesce((a->>'totalCertificates')::int,-1)<>0 then raise exception 'Student unauthorized access';end if;
end $$;
reset role;
select 'PASS: combined filters, 10001 rows, Arabic normalization, grouped students, oversized group fallback, missing metadata fallback, unauthorized access' as result;
rollback;
