begin;
alter policy certificates_read on public.certificates using (private.can_manage_issuer(issuer_id) or (status='finalized' and exists(select 1 from public.accounts a where a.id=certificates.recipient_account_id and a.auth_user_id=(select auth.uid()) and a.active)));
CREATE OR REPLACE FUNCTION private.workspace_access(k text, p jsonb, writing boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare owner text;
begin
 if private.is_admin() then return true; end if;
 if k='certificateSnapshots' then
  return exists(select 1 from public.certificates c where c.id::text=p->>'certificateId' and ((not writing and c.status='finalized' and exists(select 1 from public.accounts a where a.auth_user_id=auth.uid() and a.active and a.id=c.recipient_account_id)) or (private.can_manage_issuer(c.issuer_id) and (not writing or c.status='draft'))));
 end if;
 if not private.is_staff() then return false; end if;
 owner:=private.workspace_owner(k,p);
 if k in ('riwayahPrintColors','assetSources') then return not writing; end if;
 if owner='' then return not writing and k in ('sanadSections','sanadSectionVersions','mutoonTextTemplates'); end if;
 if k='sanadSections' and writing and p->>'sectionType' not in ('personal','wording') then return false; end if;
 if owner=auth.uid()::text then return true; end if;
 if owner ~ '^guest:[0-9a-f-]{36}$' then return private.can_manage_issuer(substring(owner,7)::uuid); end if;
 return false;
end; $function$;
commit;
