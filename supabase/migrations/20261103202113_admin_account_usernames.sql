create function private.admin_set_account_username(target_account uuid,new_username text) returns text
language plpgsql security definer set search_path='' as $$
declare a public.accounts; value text;
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Administrator required' using errcode='42501';end if;
 select * into a from public.accounts where id=target_account for update;
 if not found then raise exception 'Account unavailable';end if;
 value:=lower(btrim(new_username));
 if value='' then update public.accounts set username=null where id=a.id;return '';end if;
 if value is null or value !~ '^[a-z][a-z0-9_]{2,29}$' then raise exception 'Invalid username';end if;
 if value in ('admin','administrator','system','support') and a.role<>'admin' then raise exception 'Username reserved for administrators';end if;
 update public.accounts set username=value where id=a.id;return value;
exception when unique_violation then raise exception 'Username is already in use' using errcode='23505';
end $$;
revoke all on function private.admin_set_account_username(uuid,text) from public,anon;
grant execute on function private.admin_set_account_username(uuid,text) to authenticated;
create function public.admin_set_account_username(target_account uuid,new_username text) returns text
language sql security invoker set search_path='' as $$select private.admin_set_account_username(target_account,new_username);$$;
revoke all on function public.admin_set_account_username(uuid,text) from public,anon;
grant execute on function public.admin_set_account_username(uuid,text) to authenticated;
