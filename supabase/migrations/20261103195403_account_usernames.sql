insert into private.application_backups(purpose,snapshot) select 'Before account username support 2026-11-03',jsonb_build_object('accounts',(select jsonb_agg(to_jsonb(a)) from public.accounts a));
alter table public.accounts add column username text unique check(username is null or username ~ '^[a-z][a-z0-9_]{2,29}$');
create table private.server_login_keys(purpose text primary key,key_hash text not null,created_at timestamptz not null default now());
alter table private.server_login_keys enable row level security;
revoke all on private.server_login_keys from public,anon,authenticated;
create function private.set_account_username(new_username text) returns text
language plpgsql security definer set search_path='' as $$
declare a public.accounts; value text;
begin
 select * into a from public.accounts where auth_user_id=auth.uid() and active;
 if not found then raise exception 'Active account required' using errcode='42501';end if;
 value:=lower(btrim(new_username));
 if value is null or value !~ '^[a-z][a-z0-9_]{2,29}$' then raise exception 'Use 3-30 English letters, numbers or underscores, starting with a letter';end if;
 if value in ('admin','administrator','system','support') and a.role<>'admin' then raise exception 'This username is reserved';end if;
 update public.accounts set username=value where id=a.id;
 return value;
exception when unique_violation then raise exception 'Username is already in use' using errcode='23505';
end $$;
revoke all on function private.set_account_username(text) from public,anon;
grant execute on function private.set_account_username(text) to authenticated;
create function public.set_account_username(new_username text) returns text language sql security invoker set search_path='' as $$select private.set_account_username(new_username);$$;
revoke all on function public.set_account_username(text) from public,anon;
grant execute on function public.set_account_username(text) to authenticated;
create function public.get_account_username() returns text language sql stable security invoker set search_path='' as $$select coalesce(username,'') from public.accounts where auth_user_id=auth.uid() and active;$$;
revoke all on function public.get_account_username() from public,anon;
grant execute on function public.get_account_username() to authenticated;
-- Only the application server may resolve aliases to private auth email addresses.
-- No password validation/session issuance is performed here; native Supabase Auth still handles it.
create function private.resolve_account_username(login_username text,lookup_key text) returns text
language plpgsql stable security definer set search_path='' as $$
declare result text;
begin
 if lookup_key is null or length(lookup_key)<48 or not exists(select 1 from private.server_login_keys where purpose='username-login' and key_hash=encode(extensions.digest(lookup_key,'sha256'),'hex')) then raise exception 'Application server required' using errcode='42501';end if;
 if login_username is null or login_username !~ '^[a-z][a-z0-9_]{2,29}$' then return null;end if;
 select u.email into result from public.accounts a join auth.users u on u.id=a.auth_user_id where a.username=login_username and a.active;
 return result;
end $$;
revoke all on function private.resolve_account_username(text,text) from public;
grant execute on function private.resolve_account_username(text,text) to anon,authenticated;
create function public.resolve_account_username(login_username text,lookup_key text) returns text language sql stable security invoker set search_path='' as $$select private.resolve_account_username(login_username,lookup_key);$$;
revoke all on function public.resolve_account_username(text,text) from public;
grant execute on function public.resolve_account_username(text,text) to anon,authenticated;
