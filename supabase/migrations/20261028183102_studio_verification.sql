begin;
create or replace function private.finalize_certificate(target uuid, snapshot jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare c public.certificates%rowtype; code text; yr integer; seq integer; result text; token text;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
 select * into c from public.certificates where id = target for update;
 if not found or not private.can_manage_issuer(c.issuer_id) then
 raise exception 'Issuer access required' using errcode = '42501'; end if;
 if c.status <> 'draft' then raise exception 'Certificate already finalized'; end if;
 if jsonb_typeof(snapshot) <> 'object' or snapshot is null or snapshot = '{}'::jsonb then raise exception 'Snapshot required'; end if;
 if c.sanad_id is not null and not exists(select 1 from public.sanads s where s.id=c.sanad_id and s.issuer_id=c.issuer_id) then
 raise exception 'Sanad issuer mismatch'; end if;
 yr := extract(year from c.completion_date)::integer;
 if yr < 1900 or yr > 2199 then raise exception 'Unsupported completion year'; end if;
 select issuer_code into code from public.issuers where id=c.issuer_id;
 if c.registration_number is not null then
 if c.registration_number !~ '^[0-9]{4}-[0-9]{4}$' or left(c.registration_number,4) <> code||right(yr::text,2) or substring(c.registration_number,6,2)<>c.riwayah_code or right(c.registration_number,2)='00' then raise exception 'Reserved registration mismatch'; end if;
 result := c.registration_number;
 insert into private.registration_counters(issuer_id,completion_year,riwayah_code,last_number) values(c.issuer_id,yr,c.riwayah_code,right(result,2)::smallint)
 on conflict(issuer_id,completion_year,riwayah_code) do update set last_number=greatest(private.registration_counters.last_number,excluded.last_number);
 else
 insert into private.registration_counters(issuer_id,completion_year,riwayah_code,last_number)
 values(c.issuer_id,yr,c.riwayah_code,1)
 on conflict (issuer_id,completion_year,riwayah_code) do update
 set last_number = private.registration_counters.last_number + 1
 where private.registration_counters.last_number < 99 returning last_number into seq;
 if seq is null then raise exception 'Registration sequence exhausted'; end if;
 result := code || right(yr::text,2) || '-' || c.riwayah_code || lpad(seq::text,2,'0');
 end if;
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 if snapshot ? 'formatting' then snapshot:=jsonb_set(snapshot,'{formatting}',to_jsonb(((snapshot->>'formatting')::jsonb||jsonb_build_object('verificationToken',token,'registrationNumber',result))::text)); end if;
 snapshot:=jsonb_set(snapshot,'{issuedAt}',to_jsonb(now()::text));
 insert into public.certificate_snapshots(certificate_id,content) values(c.id,snapshot);
 update public.certificates set status='finalized',registration_number=result,
 verification_token=token where id=c.id;
 return result;
end;
$$;

create function private.verify_certificate_token(token text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if token is null or token !~ '^[0-9a-f-]{32,64}$' then return jsonb_build_object('verified',false,'certificate',null); end if;
 select jsonb_build_object('certificateNumber',0,'registrationNumber',v.registration_number,'studentName',v.student_name,'issuerName',v.issuer_name,'reading',v.riwayah_name||' عن '||v.qiraah_name,'completionDate',v.completion_date,'publishedAt',s.created_at) into result
 from public.certificates c join private.ijazah_verification_index v on v.certificate_id=c.id join public.certificate_snapshots s on s.certificate_id=c.id where c.verification_token=token and c.status='finalized' and v.published;
 return jsonb_build_object('verified',result is not null,'certificate',result);
end; $$;
revoke all on function private.verify_certificate_token(text) from public;
grant execute on function private.verify_certificate_token(text) to anon,authenticated;
create function public.verify_certificate_token(token text) returns jsonb language sql stable security invoker set search_path='' as $$ select private.verify_certificate_token(token); $$;
revoke all on function public.verify_certificate_token(text) from public;
grant execute on function public.verify_certificate_token(text) to anon,authenticated;
create function private.full_application_backup() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 return jsonb_build_object(
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
end; $$;
revoke all on function private.full_application_backup() from public,anon;
grant execute on function private.full_application_backup() to authenticated;
create function public.full_application_backup() returns jsonb language sql stable security invoker set search_path='' as $$ select private.full_application_backup(); $$;
revoke all on function public.full_application_backup() from public,anon;
grant execute on function public.full_application_backup() to authenticated;
create function private.restore_application_backup(data jsonb,overwrite boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
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
 return jsonb_build_object('success',true,'restoredCertificates',coalesce(array_length(mutable,1),0));
end; $$;
revoke all on function private.restore_application_backup(jsonb,boolean) from public,anon;
grant execute on function private.restore_application_backup(jsonb,boolean) to authenticated;
create function public.restore_application_backup(data jsonb,overwrite boolean default false) returns jsonb language sql security invoker set search_path='' as $$ select private.restore_application_backup(data,overwrite); $$;
revoke all on function public.restore_application_backup(jsonb,boolean) from public,anon;
grant execute on function public.restore_application_backup(jsonb,boolean) to authenticated;
create policy assets_active_read on public.workspace_records for select to authenticated using(kind='assetSources' and exists(select 1 from public.accounts a where a.auth_user_id=auth.uid() and a.active));
commit;