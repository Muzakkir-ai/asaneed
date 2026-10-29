begin;
create or replace function private.reserve_certificate_number(target uuid) returns text language plpgsql security definer set search_path='' as $$
declare c public.certificates%rowtype; code text; yr integer; seq integer; result text;
begin
 select * into c from public.certificates where id=target for update;
 if not found or not private.can_manage_issuer(c.issuer_id) then raise exception 'Issuer access required' using errcode='42501'; end if;
 if c.status='finalized' then return c.registration_number; end if;
 yr:=extract(year from c.completion_date)::integer;
 if yr<1900 or yr>2199 then raise exception 'Unsupported year'; end if;
 select issuer_code into code from public.issuers where id=c.issuer_id;
 if c.registration_number is not null and left(c.registration_number,4)=right(yr::text,2)||code and substring(c.registration_number,6,2)=c.riwayah_code then return c.registration_number; end if;
 insert into private.registration_counters(issuer_id,completion_year,riwayah_code,last_number) values(c.issuer_id,yr,c.riwayah_code,1)
 on conflict(issuer_id,completion_year,riwayah_code) do update set last_number=private.registration_counters.last_number+1 where private.registration_counters.last_number<99 returning last_number into seq;
 if seq is null then raise exception 'Registration sequence exhausted'; end if;
 result:=right(yr::text,2)||code||'-'||c.riwayah_code||lpad(seq::text,2,'0');
 update public.certificates set registration_number=result where id=target;
 return result;
end; $$;
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
 if c.registration_number !~ '^[0-9]{4}-[0-9]{4}$' or left(c.registration_number,4) <> right(yr::text,2)||code or substring(c.registration_number,6,2)<>c.riwayah_code or right(c.registration_number,2)='00' then raise exception 'Reserved registration mismatch'; end if;
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
 result := right(yr::text,2) || code || '-' || c.riwayah_code || lpad(seq::text,2,'0');
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


create or replace function private.save_personal_issuer_profile(profile jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.accounts%rowtype; target uuid; prior public.workspace_records%rowtype; fields jsonb; saved jsonb; display text;
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 select * into actor from public.accounts where auth_user_id=auth.uid() and active;
 if actor.id is null then raise exception 'Active account required' using errcode='42501'; end if;
 if jsonb_typeof(profile)<>'object' or length(profile::text)>10000 then raise exception 'Invalid profile'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor.id::text,71741002));
 select coalesce(jsonb_object_agg(key,value),'{}') into fields from jsonb_each(profile) where key=any(array['printedName','scientificQualification','showScientificQualification','teachingRole','madrasaName','madrasaPlace','centerStampText','footerLineStyles','showTeachingRole','showMadrasaName','showMadrasaPlace']);
 select * into prior from public.workspace_records where kind='shaykhPrintProfiles' and payload->>'ownerId'=actor.auth_user_id::text order by created_at,id limit 1;
 saved:=coalesce(prior.payload,'{}')||fields||jsonb_build_object('ownerId',actor.auth_user_id::text);
 display:=coalesce(nullif(trim(saved->>'printedName'),''),actor.display_name);
 target:=private.create_issuer_profile(display,saved,true);
 update public.issuers set display_name=display,print_profile=print_profile||saved||jsonb_build_object('personalAccount',actor.id::text) where id=target;
 if prior.id is null then insert into public.workspace_records(kind,payload) values('shaykhPrintProfiles',saved);
 else update public.workspace_records set payload=saved where kind='shaykhPrintProfiles' and id=prior.id; end if;
 return target;
end; $$;
revoke all on function private.save_personal_issuer_profile(jsonb) from public,anon;
grant execute on function private.save_personal_issuer_profile(jsonb) to authenticated;
create or replace function public.save_personal_issuer_profile(profile jsonb) returns uuid language sql security invoker set search_path='' as $$ select private.save_personal_issuer_profile(profile); $$;
revoke all on function public.save_personal_issuer_profile(jsonb) from public,anon;
grant execute on function public.save_personal_issuer_profile(jsonb) to authenticated;

-- Preserve suffix, issuer, completion date and sequence; update draft numbers only.
lock table public.certificates in share row exclusive mode;
create temporary table draft_number_changes on commit drop as
 select c.id,c.registration_number as old_number,right(extract(year from c.completion_date)::integer::text,2)||i.issuer_code||substring(c.registration_number,5) as new_number
 from public.certificates c join public.issuers i on i.id=c.issuer_id where c.status='draft' and c.registration_number is not null;
do $$ begin
 if exists(select 1 from draft_number_changes m join public.certificates c on c.id=m.id join public.issuers i on i.id=c.issuer_id where m.old_number !~ '^[0-9]{4}-[0-9]{4}$' or left(m.old_number,4)<>i.issuer_code||right(extract(year from c.completion_date)::integer::text,2) or substring(m.old_number,6,2)<>c.riwayah_code or right(m.old_number,2)='00') then raise exception 'Unexpected draft number; review before migration'; end if;
 if exists(select new_number from draft_number_changes group by new_number having count(*)>1) or exists(select 1 from draft_number_changes m join public.certificates c on c.registration_number=m.new_number and c.status='finalized') then raise exception 'Number collision; migration stopped'; end if;
end; $$;
update private.application_backups set snapshot=snapshot||jsonb_build_object('draft_number_changes',(select jsonb_agg(to_jsonb(m)) from draft_number_changes m)) where id='08154759-42a5-40ca-af1f-f1a6a20f2c59';
update public.certificates c set registration_number=null from draft_number_changes m where c.id=m.id;
update public.certificates c set registration_number=m.new_number from draft_number_changes m where c.id=m.id;
update private.ijazah_verification_index v set registration_number=m.new_number from draft_number_changes m where v.certificate_id=m.id and not v.published;
-- Existing administrator names receive distinct personal profiles, never another issuer's certificates.
do $$ declare a record; begin
 for a in select auth_user_id from public.accounts where role='admin' and active loop
 perform set_config('request.jwt.claim.sub',a.auth_user_id::text,true);
 perform private.save_personal_issuer_profile('{}');
 end loop;
end; $$;

commit;
