begin;
-- Issuers may add a narrator to their own registry; shared edits remain admin-only.
alter policy unified_admin_insert on public.builder_people with check (
 (select private.is_admin()) or exists (
  select 1 from public.accounts a where a.id=owner_id and a.auth_user_id=(select auth.uid()) and a.active and a.role='shaykh'
 )
);
-- Retain the atomic attachment and all route/owner/continuation validation.
-- Personal sanads are distinct by reviewed prefix + short name. Additional-shaykh attachment is unchanged.
do $patch$
declare source text; needle text; replacement text;
begin
 source:=pg_get_functiondef('public.attach_builder_route(uuid,jsonb,uuid)'::regprocedure);
 needle:=$old$payload->>'builderRouteId'=route.id::text;$old$;
 replacement:=$new$payload->>'builderRouteId'=route.id::text
 and (extra is not null or (
  coalesce(payload#>>'{unifiedSanad,prefix}',payload->>'personalChain','')=coalesce(holding#>>'{unifiedSanad,prefix}',holding->>'personalChain','')
  and coalesce(payload->>'shortName','')=coalesce(holding->>'shortName','')
 ));$new$;
 if position(needle in source)=0 then raise exception 'Unexpected attachment function; review before applying';end if;
 insert into private.application_backups(purpose,snapshot) values('before personal sanad variants',jsonb_build_object('attach_builder_route',source));
 execute replace(source,needle,replacement);
end $patch$;
commit;
