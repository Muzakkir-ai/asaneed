begin;
do $$ declare actor uuid; target uuid; begin
 select a.auth_user_id into actor from public.issuers i join public.accounts a on a.id::text=i.print_profile->>'personalAccount' where i.issuer_code='03' and a.active and a.role='admin';
 if actor is null then raise exception 'Muzakkir main admin account missing';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 if exists(select 1 from public.issuers i where not private.can_manage_issuer(i.id)) then raise exception 'Main admin cannot manage all issuers';end if;
 select id into target from public.accounts where auth_user_id<>actor and active order by id limit 1;
 perform public.admin_set_account_username(target,'admin_managed_alias_test');
 if not exists(select 1 from public.accounts where id=target and username='admin_managed_alias_test') then raise exception 'Admin username update failed';end if;
 perform public.admin_set_account_username(target,'');
 if exists(select 1 from public.accounts where id=target and username is not null) then raise exception 'Admin clear failed';end if;
 select auth_user_id into actor from public.accounts where active and role='shaykh' limit 1;
 if actor is not null then
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 begin perform public.admin_set_account_username(target,'unauthorized_change');raise exception 'Non-admin write allowed';exception when insufficient_privilege then null;end;
 end if;
 if has_function_privilege('anon','public.admin_set_account_username(uuid,text)','EXECUTE') then raise exception 'Anonymous grant present';end if;
end $$;
rollback;
