\set ON_ERROR_STOP on
do $$ begin
 begin delete from public.students where id='20000000-0000-4000-8000-000000000001';raise exception 'Certificate-linked student deleted';exception when foreign_key_violation then null;end;
 begin delete from public.students where id='20000000-0000-4000-8000-000000000003';raise exception 'Account-linked student deleted';exception when foreign_key_violation then null;end;
 delete from public.students where id='20000000-0000-4000-8000-000000000004';
 if (select count(*) from public.student_accounts)<>1 or (select count(*) from public.certificates)<>4 then raise exception 'Original links changed';end if;
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000001',false);
do $$ declare result jsonb; begin
 result:=public.certificate_filtered_page(array['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002']::uuid[],'{"50000000-0000-4000-8000-000000000001":{"label":"حفص","qari":"asim","rawi":"حفص"}}','{"10000000-0000-4000-8000-000000000001":{"key":"first","name":"Fixture"},"10000000-0000-4000-8000-000000000002":{"key":"second","name":"Other"}}','{"status":"all","sort":"added","issuer":"all","qari":"all","rawi":"all","year":"all","query":"احمد"}','students',0);
 if result->>'totalCertificates'<>'3' or jsonb_array_length(result->'groups')<>2 or not exists(select 1 from jsonb_array_elements(result->'groups') g where jsonb_array_length(g)=2 and g ? '30000000-0000-4000-8000-000000000001' and g ? '30000000-0000-4000-8000-000000000003') or result->'ids' ? '30000000-0000-4000-8000-000000000004' then raise exception 'Unexpected ID grouping or access boundary: %',result;end if;
end $$;
reset role;
select 'PASS: separate same-name student IDs, repeated-ID grouping, invoker RLS, certificate and account FK deletion protection' as result;
