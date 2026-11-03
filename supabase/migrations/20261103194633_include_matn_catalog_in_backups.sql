CREATE OR REPLACE FUNCTION private.full_application_backup()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 return jsonb_build_object('certificate_subjects',coalesce((select jsonb_agg(to_jsonb(t)) from public.certificate_subjects t),'[]'),'annual_issuer_counters',coalesce((select jsonb_agg(to_jsonb(t)) from private.annual_issuer_counters t),'[]'),'annual_certificate_allocations',coalesce((select jsonb_agg(to_jsonb(t)) from private.annual_certificate_allocations t),'[]'),'builder_person_merges',coalesce((select jsonb_agg(to_jsonb(t)) from public.builder_person_merges t),'[]'),'issuer_certificate_counters',coalesce((select jsonb_agg(to_jsonb(t)) from private.issuer_certificate_counters t),'[]'),'certificate_number_allocations',coalesce((select jsonb_agg(to_jsonb(t)) from private.certificate_number_allocations t),'[]'),'builder_people',coalesce((select jsonb_agg(to_jsonb(t)) from public.builder_people t),'[]'),'builder_books',coalesce((select jsonb_agg(to_jsonb(t)) from public.builder_books t),'[]'),'builder_chains',coalesce((select jsonb_agg(to_jsonb(t)) from public.builder_chains t),'[]'),'builder_nodes',coalesce((select jsonb_agg(to_jsonb(t)) from public.builder_nodes t),'[]'),'student_accounts',coalesce((select jsonb_agg(to_jsonb(t)) from public.student_accounts t),'[]'),
 'accounts',coalesce((select jsonb_agg(to_jsonb(t)) from public.accounts t),'[]'),
 'issuers',coalesce((select jsonb_agg(to_jsonb(t)) from public.issuers t),'[]'),
 'issuer_accounts',coalesce((select jsonb_agg(to_jsonb(t)) from public.issuer_accounts t),'[]'),
 'students',coalesce((select jsonb_agg(to_jsonb(t)) from public.students t),'[]'),
 'qiraat',coalesce((select jsonb_agg(to_jsonb(t)) from public.qiraat t),'[]'),
 'riwayat',coalesce((select jsonb_agg(to_jsonb(t)) from public.riwayat t),'[]'),
 'sanads',coalesce((select jsonb_agg(to_jsonb(t)) from public.sanads t),'[]'),
 'certificates',coalesce((select jsonb_agg(to_jsonb(t)) from public.certificates t),'[]'),
 'certificate_snapshots',coalesce((select jsonb_agg(to_jsonb(t)) from public.certificate_snapshots t),'[]'),
 'workspace_records',coalesce((select jsonb_agg(to_jsonb(t)) from public.workspace_records t),'[]'),
 'registration_counters',coalesce((select jsonb_agg(to_jsonb(t)) from private.registration_counters t),'[]'),
 'legacy_records',coalesce((select jsonb_agg(to_jsonb(t)) from private.legacy_records t),'[]'),
 'verification_index',coalesce((select jsonb_agg(to_jsonb(t)) from private.ijazah_verification_index t),'[]'));
end; $function$
;
CREATE OR REPLACE FUNCTION private.restore_application_backup(data jsonb, overwrite boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare mutable uuid[]; n integer;
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 if jsonb_typeof(data)<>'object' or not data ? 'certificates' or not data ? 'workspace_records' then raise exception 'Complete database backup required'; end if;
 -- Never overwrite a finalized certificate or its snapshot, even from an administrator upload.
 if exists(select 1 from jsonb_populate_recordset(null::public.certificates,data->'certificates') b join public.certificates c on c.id=b.id where c.status='finalized' and to_jsonb(c)<>to_jsonb(b)) then raise exception 'Backup conflicts with immutable certificates'; end if;
 if exists(select 1 from jsonb_populate_recordset(null::public.certificate_snapshots,data->'certificate_snapshots') b join public.certificate_snapshots s on s.certificate_id=b.certificate_id where to_jsonb(s)<>to_jsonb(b)) then raise exception 'Backup conflicts with immutable snapshots'; end if;
 if exists(select 1 from jsonb_populate_recordset(null::public.accounts,data->'accounts') b join public.accounts a on a.id=b.id where b.auth_user_id is distinct from a.auth_user_id) then raise exception 'Authentication identities cannot be reassigned'; end if;
 select array_agg(b.id) into mutable from jsonb_populate_recordset(null::public.certificates,data->'certificates') b left join public.certificates c on c.id=b.id where c.id is null or (overwrite and c.status='draft');
 insert into public.accounts select * from jsonb_populate_recordset(null::public.accounts,data->'accounts') on conflict(id) do nothing;
 if overwrite then update public.accounts a set display_name=b.display_name,role=b.role,active=b.active from jsonb_populate_recordset(null::public.accounts,data->'accounts') b where a.id=b.id and a.auth_user_id is distinct from auth.uid(); end if;
 insert into public.issuers select * from jsonb_populate_recordset(null::public.issuers,data->'issuers') on conflict(id) do update set display_name=case when overwrite then excluded.display_name else public.issuers.display_name end,print_profile=case when overwrite then excluded.print_profile else public.issuers.print_profile end;
 insert into public.issuer_accounts select * from jsonb_populate_recordset(null::public.issuer_accounts,data->'issuer_accounts') on conflict do nothing;
 insert into public.students(id,display_name,legacy_id,created_at) select id,display_name,legacy_id,created_at from jsonb_populate_recordset(null::public.students,data->'students') on conflict(id) do update set display_name=case when overwrite then excluded.display_name else public.students.display_name end;
 insert into public.qiraat select * from jsonb_populate_recordset(null::public.qiraat,data->'qiraat') on conflict(id) do nothing;
 insert into public.riwayat select * from jsonb_populate_recordset(null::public.riwayat,data->'riwayat') on conflict(code) do nothing;
 if data ? 'certificate_subjects' then
 if exists(select 1 from jsonb_populate_recordset(null::public.certificate_subjects,data->'certificate_subjects') b join public.certificate_subjects c on c.code=b.code where c.kind<>b.kind or c.name_key<>b.name_key) then raise exception 'Certificate subject code conflict';end if;
 insert into public.certificate_subjects select * from jsonb_populate_recordset(null::public.certificate_subjects,data->'certificate_subjects') on conflict(code) do nothing;
 else
 insert into public.certificate_subjects(code,kind,display_name,name_key) select code,'riwayah',display_name,code from public.riwayat on conflict(code) do nothing;
 end if;
 insert into public.sanads select * from jsonb_populate_recordset(null::public.sanads,data->'sanads') on conflict(id) do update set title=case when overwrite then excluded.title else public.sanads.title end,body=case when overwrite then excluded.body else public.sanads.body end;
 insert into public.certificates(id,issuer_id,student_id,sanad_id,riwayah_code,completion_date,status,registration_number,verification_token,recipient_account_id,draft,legacy_id,created_at)
 select id,issuer_id,student_id,sanad_id,riwayah_code,completion_date,'draft',registration_number,verification_token,recipient_account_id,draft,legacy_id,created_at from jsonb_populate_recordset(null::public.certificates,data->'certificates')
 on conflict(id) do update set student_id=excluded.student_id,sanad_id=excluded.sanad_id,riwayah_code=excluded.riwayah_code,completion_date=excluded.completion_date,registration_number=excluded.registration_number,verification_token=excluded.verification_token,recipient_account_id=excluded.recipient_account_id,draft=excluded.draft where overwrite and public.certificates.status='draft' and public.certificates.issuer_id=excluded.issuer_id;
 insert into public.certificate_snapshots select * from jsonb_populate_recordset(null::public.certificate_snapshots,data->'certificate_snapshots') on conflict(certificate_id) do nothing;
 update public.certificates c set status='finalized' from jsonb_populate_recordset(null::public.certificates,data->'certificates') b where c.id=b.id and c.id=any(mutable) and b.status='finalized';
 insert into public.workspace_records select * from jsonb_populate_recordset(null::public.workspace_records,data->'workspace_records') on conflict(kind,id) do update set payload=case when overwrite then excluded.payload else public.workspace_records.payload end;
 insert into private.registration_counters select * from jsonb_populate_recordset(null::private.registration_counters,data->'registration_counters') on conflict(issuer_id,completion_year,riwayah_code) do update set last_number=greatest(private.registration_counters.last_number,excluded.last_number);
 insert into private.legacy_records select * from jsonb_populate_recordset(null::private.legacy_records,data->'legacy_records') on conflict(source_table,source_id) do nothing;
 insert into private.ijazah_verification_index select * from jsonb_populate_recordset(null::private.ijazah_verification_index,data->'verification_index') on conflict(registration_number) do update set student_name=excluded.student_name,issuer_name=excluded.issuer_name,qiraah_name=excluded.qiraah_name,riwayah_name=excluded.riwayah_name,completion_date=excluded.completion_date,published=excluded.published where private.ijazah_verification_index.certificate_id=any(mutable);
 if data ? 'student_accounts' then insert into public.student_accounts select * from jsonb_populate_recordset(null::public.student_accounts,data->'student_accounts') on conflict(student_id) do update set account_id=case when overwrite then excluded.account_id else public.student_accounts.account_id end; end if; if data ? 'builder_people' then data:=jsonb_set(data,'{builder_chains}',coalesce((select jsonb_agg('{"upper_route_name":"","branch_route_name":"","reading_scope":"unspecified"}'::jsonb||entry) from jsonb_array_elements(coalesce(data->'builder_chains','[]'::jsonb)) entry),'[]'::jsonb)); insert into public.builder_people select * from jsonb_populate_recordset(null::public.builder_people,data->'builder_people') on conflict(id) do nothing; insert into public.builder_books select * from jsonb_populate_recordset(null::public.builder_books,data->'builder_books') on conflict(id) do nothing; insert into public.builder_chains select * from jsonb_populate_recordset(null::public.builder_chains,data->'builder_chains') where kind='book' on conflict(id) do nothing; insert into public.builder_chains select * from jsonb_populate_recordset(null::public.builder_chains,data->'builder_chains') where kind='route' on conflict(id) do nothing; insert into public.builder_nodes select * from jsonb_populate_recordset(null::public.builder_nodes,data->'builder_nodes') on conflict do nothing; end if; perform setval('public.builder_route_number',greatest((select coalesce(max(route_code::integer),1000) from public.builder_chains), (select last_value from public.builder_route_number)),true); if data ? 'issuer_certificate_counters' then insert into private.issuer_certificate_counters select * from jsonb_populate_recordset(null::private.issuer_certificate_counters,data->'issuer_certificate_counters') on conflict(issuer_id) do update set last_number=greatest(private.issuer_certificate_counters.last_number,excluded.last_number); end if; if data ? 'certificate_number_allocations' then insert into private.certificate_number_allocations select * from jsonb_populate_recordset(null::private.certificate_number_allocations,data->'certificate_number_allocations') on conflict do nothing; end if; insert into private.issuer_certificate_counters select issuer_id,max(serial) from private.certificate_number_allocations group by issuer_id on conflict(issuer_id) do update set last_number=greatest(private.issuer_certificate_counters.last_number,excluded.last_number); if data ? 'annual_issuer_counters' then insert into private.annual_issuer_counters select * from jsonb_populate_recordset(null::private.annual_issuer_counters,data->'annual_issuer_counters') on conflict(issuer_id,year) do update set last_number=greatest(private.annual_issuer_counters.last_number,excluded.last_number); end if; if data ? 'annual_certificate_allocations' then insert into private.annual_certificate_allocations select * from jsonb_populate_recordset(null::private.annual_certificate_allocations,data->'annual_certificate_allocations') on conflict do nothing; end if; insert into private.annual_certificate_allocations select c.id,c.issuer_id,extract(year from c.completion_date)::int,substring(split_part(c.registration_number,'-',2) from 1 for length(split_part(c.registration_number,'-',2))-2)::bigint from public.certificates c where c.registration_number ~ '^[0-9]{4}-[0-9]{4,21}$' on conflict do nothing; insert into private.annual_issuer_counters select issuer_id,year,max(serial) from private.annual_certificate_allocations group by issuer_id,year on conflict(issuer_id,year) do update set last_number=greatest(private.annual_issuer_counters.last_number,excluded.last_number); return jsonb_build_object('success',true,'restoredCertificates',coalesce(array_length(mutable,1),0));
end; $function$
;
