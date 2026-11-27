-- Staging only; synthetic rows roll back.
begin;
create temporary table page_sort_fixture as select issuer_id,student_id,sanad_id,riwayah_code from public.certificates limit 1;
grant select on page_sort_fixture to authenticated;
-- Explicit UUIDs make the equal-key ordering reproducible.
insert into public.certificates(id,issuer_id,student_id,sanad_id,riwayah_code,completion_date,registration_number,draft)
select x.id,f.issuer_id,f.student_id,f.sanad_id,f.riwayah_code,'2094-01-01',x.reg,jsonb_build_object('editor',jsonb_build_object('shahadaNumber',x.n)) from page_sort_fixture f cross join (values
('a9400000-0000-4000-8000-000000000001'::uuid,'9499-9901',3),
('a9400000-0000-4000-8000-000000000002'::uuid,'9499-10001',2),
('a9400000-0000-4000-8000-000000000003'::uuid,null,1)) x(id,reg,n);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where active and role='admin' and auth_user_id is not null limit 1),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$ declare issuers uuid[]; a jsonb;begin
 select array_agg(issuer_id) into issuers from page_sort_fixture;
 a:=public.certificate_list_page(issuers,2094,'draft','completion-desc',0);
 if a->'ids'<> '["a9400000-0000-4000-8000-000000000002","a9400000-0000-4000-8000-000000000001","a9400000-0000-4000-8000-000000000003"]'::jsonb then raise exception 'Numeric registration sorting failed';end if;
 a:=public.certificate_list_page(issuers,2094,'draft','added',0);
 if a->'ids'<> '["a9400000-0000-4000-8000-000000000001","a9400000-0000-4000-8000-000000000002","a9400000-0000-4000-8000-000000000003"]'::jsonb then raise exception 'Display ordinal sorting failed';end if;
 a:=public.certificate_list_page(issuers,2094,'draft','completion',0);
 if a->'ids'<> '["a9400000-0000-4000-8000-000000000003","a9400000-0000-4000-8000-000000000001","a9400000-0000-4000-8000-000000000002"]'::jsonb then raise exception 'Ascending registration sorting failed';end if;
end $$;
reset role;
select 'PASS: numeric registration sorting including variable-length serials, null registration and display ordinals' as result;
rollback;
