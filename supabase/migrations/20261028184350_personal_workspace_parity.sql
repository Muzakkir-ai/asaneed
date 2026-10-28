begin;
create or replace function private.workspace_access(k text,p jsonb,writing boolean) returns boolean language plpgsql stable security definer set search_path='' as $$
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
 if k='sanadSections' and writing and p->>'sectionType' not in ('personal','wording') then return false; end if;
 if owner=auth.uid()::text then return true; end if;
 if owner ~ '^guest:[0-9a-f-]{36}$' then return private.can_manage_issuer(substring(owner,7)::uuid); end if;
 return false;
end; $$;

create or replace function private.create_issuer_profile(new_name text,profile jsonb,personal boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare target uuid; code text; actor uuid;
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 select id into actor from public.accounts where auth_user_id=auth.uid() and active;
 perform pg_advisory_xact_lock(71741001);
 if personal then select issuer_id into target from public.issuer_accounts where account_id=actor limit 1; if target is not null then return target; end if; end if;
 if length(trim(new_name)) not between 1 and 220 then raise exception 'Invalid issuer name'; end if;
 select lpad(n::text,2,'0') into code from generate_series(1,99)n where not exists(select 1 from public.issuers where issuer_code=lpad(n::text,2,'0')) order by n limit 1;
 if code is null then raise exception 'Issuer codes exhausted'; end if;
 insert into public.issuers(display_name,issuer_code,print_profile) values(trim(new_name),code,coalesce(profile,'{}')||case when personal then jsonb_build_object('personalAccount',actor) else '{}'::jsonb end) returning id into target;
 if personal then insert into public.issuer_accounts values(target,actor); end if;
 return target;
end; $$;

commit;
