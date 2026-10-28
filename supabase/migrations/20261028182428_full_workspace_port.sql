begin;
create table public.workspace_records(kind text not null,id uuid not null default gen_random_uuid(),payload jsonb not null default '{}',created_at timestamptz not null default now(),primary key(kind,id),check(kind in ('sanadSections','ijazahHoldings','sanadPrintStyles','preparedIjazahs','certificateSnapshots','sanadSectionVersions','shaykhPrintProfiles','riwayahPrintColors','assetSources','mutoonHoldings','mutoonTextTemplates','additionalShaykhExtensions','additionalShaykhReadingSanads','asaneed')));
alter table public.workspace_records enable row level security;
revoke all on public.workspace_records from public,anon,authenticated;
grant select,insert,update,delete on public.workspace_records to authenticated;
create function private.workspace_owner(k text,p jsonb) returns text language plpgsql stable security definer set search_path='' as $$
declare owner text;
begin
 if k in ('additionalShaykhExtensions','additionalShaykhReadingSanads') then return 'guest:'||coalesce(p->>'shaykhId',''); end if;
 if k='sanadSectionVersions' then select payload->>'ownerId' into owner from public.workspace_records where kind='sanadSections' and id::text=p->>'sectionId'; return coalesce(owner,''); end if;
 return coalesce(p->>'ownerId',p->>'shaykh','');
end; $$;
create function private.workspace_access(k text,p jsonb,writing boolean) returns boolean language plpgsql stable security definer set search_path='' as $$
declare owner text;
begin
 if private.is_admin() then return true; end if;
 if k='certificateSnapshots' then
  return exists(select 1 from public.certificates c where c.id::text=p->>'certificateId' and ((not writing and exists(select 1 from public.accounts a where a.auth_user_id=auth.uid() and a.active and a.id=c.recipient_account_id)) or (private.can_manage_issuer(c.issuer_id) and (not writing or c.status='draft'))));
 end if;
 if not private.is_staff() then return false; end if;
 owner:=private.workspace_owner(k,p);
 if k in ('riwayahPrintColors','assetSources') then return not writing; end if;
 if owner='' then return not writing and k in ('sanadSections','sanadSectionVersions','mutoonTextTemplates'); end if;
 if k='sanadSections' and writing and p->>'sectionType'<>'personal' then return false; end if;
 if owner=auth.uid()::text then return true; end if;
 if owner ~ '^guest:[0-9a-f-]{36}$' then return private.can_manage_issuer(substring(owner,7)::uuid); end if;
 return false;
end; $$;
revoke all on function private.workspace_owner(text,jsonb) from public,anon,authenticated;
revoke all on function private.workspace_access(text,jsonb,boolean) from public,anon;
grant execute on function private.workspace_access(text,jsonb,boolean) to authenticated;
create policy workspace_read on public.workspace_records for select to authenticated using(private.workspace_access(kind,payload,false));
create policy workspace_insert on public.workspace_records for insert to authenticated with check(private.workspace_access(kind,payload,true));
create policy workspace_update on public.workspace_records for update to authenticated using(private.workspace_access(kind,payload,true)) with check(private.workspace_access(kind,payload,true));
create policy workspace_delete on public.workspace_records for delete to authenticated using(private.workspace_access(kind,payload,true));
-- Additional issuer profiles remain independent from login accounts.
grant insert,update on public.issuers to authenticated;
create policy issuers_insert on public.issuers for insert to authenticated with check((select private.is_admin()));
create policy issuers_update on public.issuers for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create function private.reserve_certificate_number(target uuid) returns text language plpgsql security definer set search_path='' as $$
declare c public.certificates%rowtype; code text; yr integer; seq integer; result text;
begin
 select * into c from public.certificates where id=target for update;
 if not found or not private.can_manage_issuer(c.issuer_id) then raise exception 'Issuer access required' using errcode='42501'; end if;
 if c.status='finalized' then return c.registration_number; end if;
 yr:=extract(year from c.completion_date)::integer;
 if yr<1900 or yr>2199 then raise exception 'Unsupported year'; end if;
 select issuer_code into code from public.issuers where id=c.issuer_id;
 if c.registration_number is not null and left(c.registration_number,4)=code||right(yr::text,2) and substring(c.registration_number,6,2)=c.riwayah_code then return c.registration_number; end if;
 insert into private.registration_counters(issuer_id,completion_year,riwayah_code,last_number) values(c.issuer_id,yr,c.riwayah_code,1)
 on conflict(issuer_id,completion_year,riwayah_code) do update set last_number=private.registration_counters.last_number+1 where private.registration_counters.last_number<99 returning last_number into seq;
 if seq is null then raise exception 'Registration sequence exhausted'; end if;
 result:=code||right(yr::text,2)||'-'||c.riwayah_code||lpad(seq::text,2,'0');
 update public.certificates set registration_number=result where id=target;
 return result;
end; $$;
revoke all on function private.reserve_certificate_number(uuid) from public,anon;
grant execute on function private.reserve_certificate_number(uuid) to authenticated;
create function public.reserve_certificate_number(certificate_id uuid) returns text language sql security invoker set search_path='' as $$ select private.reserve_certificate_number(certificate_id); $$;
revoke all on function public.reserve_certificate_number(uuid) from public,anon;
grant execute on function public.reserve_certificate_number(uuid) to authenticated;
create function private.edit_account_profile(target uuid,new_name text,new_role text,new_active boolean) returns void language plpgsql security definer set search_path='' as $$
declare a public.accounts%rowtype;
begin
 select * into a from public.accounts where id=target for update;
 if not found or auth.uid() is null then raise exception 'Account unavailable' using errcode='42501'; end if;
 if length(trim(new_name)) not between 1 and 200 then raise exception 'Invalid name'; end if;
 if private.is_admin() then
  if new_role not in ('admin','shaykh','student') then raise exception 'Invalid role'; end if;
  if a.auth_user_id=auth.uid() and (new_role<>'admin' or not new_active) then raise exception 'Cannot remove your own administrator access'; end if;
  if new_active and not exists(select 1 from auth.users where id=a.auth_user_id and email_confirmed_at is not null) then raise exception 'Verified identity required'; end if;
 else
  if a.auth_user_id<>auth.uid() or not a.active or new_role<>a.role or new_active<>a.active then raise exception 'Administrator required' using errcode='42501'; end if;
 end if;
 update public.accounts set display_name=trim(new_name),role=new_role,active=new_active where id=target;
end; $$;
revoke all on function private.edit_account_profile(uuid,text,text,boolean) from public,anon;
grant execute on function private.edit_account_profile(uuid,text,text,boolean) to authenticated;
create function public.edit_account_profile(target uuid,new_name text,new_role text,new_active boolean) returns void language sql security invoker set search_path='' as $$ select private.edit_account_profile(target,new_name,new_role,new_active); $$;
revoke all on function public.edit_account_profile(uuid,text,text,boolean) from public,anon;
grant execute on function public.edit_account_profile(uuid,text,text,boolean) to authenticated;
create function private.create_issuer_profile(new_name text,profile jsonb,personal boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare target uuid; code text; actor uuid;
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 select id into actor from public.accounts where auth_user_id=auth.uid() and active;
 perform pg_advisory_xact_lock(71741001);
 if personal then select issuer_id into target from public.issuer_accounts where account_id=actor limit 1; if target is not null then return target; end if; end if;
 if length(trim(new_name)) not between 1 and 220 then raise exception 'Invalid issuer name'; end if;
 select lpad(n::text,2,'0') into code from generate_series(1,99)n where not exists(select 1 from public.issuers where issuer_code=lpad(n::text,2,'0')) order by n limit 1;
 if code is null then raise exception 'Issuer codes exhausted'; end if;
 insert into public.issuers(display_name,issuer_code,print_profile) values(trim(new_name),code,coalesce(profile,'{}')) returning id into target;
 if personal then insert into public.issuer_accounts values(target,actor); end if;
 return target;
end; $$;
revoke all on function private.create_issuer_profile(text,jsonb,boolean) from public,anon;
grant execute on function private.create_issuer_profile(text,jsonb,boolean) to authenticated;
create function public.create_issuer_profile(new_name text,profile jsonb,personal boolean default false) returns uuid language sql security invoker set search_path='' as $$ select private.create_issuer_profile(new_name,profile,personal); $$;
revoke all on function public.create_issuer_profile(text,jsonb,boolean) from public,anon;
grant execute on function public.create_issuer_profile(text,jsonb,boolean) to authenticated;
commit;