begin;
create function private.approve_account(target_account uuid,target_role text,target_issuer uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare target public.accounts%rowtype;
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 select * into target from public.accounts where id=target_account for update;
 if not found or target.active or target.role='admin' then raise exception 'Pending account required'; end if;
 if target_role is null or target_role not in ('student','shaykh') then raise exception 'Invalid role'; end if;
 if not exists(select 1 from auth.users where id=target.auth_user_id and email_confirmed_at is not null) then raise exception 'Verified identity required'; end if;
 if target_role='shaykh' then
  if target_issuer is null or not exists(select 1 from public.issuers where id=target_issuer) then raise exception 'Issuer required'; end if;
  insert into public.issuer_accounts(issuer_id,account_id) values(target_issuer,target_account);
 elsif target_issuer is not null then raise exception 'Student cannot manage an issuer'; end if;
 update public.accounts set role=target_role,active=true where id=target_account;
end;
$$;
revoke all on function private.approve_account(uuid,text,uuid) from public,anon,authenticated;
grant execute on function private.approve_account(uuid,text,uuid) to authenticated;
create function public.approve_account(target_account uuid,target_role text,target_issuer uuid default null)
returns void language sql security invoker set search_path='' as $$ select private.approve_account(target_account,target_role,target_issuer); $$;
revoke all on function public.approve_account(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.approve_account(uuid,text,uuid) to authenticated;
commit;
