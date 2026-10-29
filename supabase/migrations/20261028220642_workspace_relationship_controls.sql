begin;
create or replace function private.create_issuer_profile(new_name text, profile jsonb, personal boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare target uuid; code text; actor uuid;
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 select id into actor from public.accounts where auth_user_id=auth.uid() and active;
 perform pg_advisory_xact_lock(71741001);
 if personal then
  select i.id into target from public.issuer_accounts ia join public.issuers i on i.id=ia.issuer_id
  where ia.account_id=actor and i.print_profile->>'personalAccount'=actor::text limit 1;
  if target is not null then return target; end if;
 end if;
 if length(trim(new_name)) not between 1 and 220 then raise exception 'Invalid issuer name'; end if;
 select lpad(n::text,2,'0') into code from generate_series(1,99)n where not exists(select 1 from public.issuers where issuer_code=lpad(n::text,2,'0')) order by n limit 1;
 if code is null then raise exception 'Issuer codes exhausted'; end if;
 insert into public.issuers(display_name,issuer_code,print_profile) values(trim(new_name),code,coalesce(profile,'{}')||case when personal then jsonb_build_object('personalAccount',actor) else '{}'::jsonb end) returning id into target;
 insert into public.issuer_accounts values(target,actor);
 return target;
end; $$;
-- Keep assignment changes explicit and audited by the database account check.
create function private.set_issuer_assignment(target uuid, issuer uuid, enabled boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 if not exists(select 1 from public.accounts where id=target) or not exists(select 1 from public.issuers where id=issuer) then raise exception 'Account or issuer unavailable'; end if;
 if enabled then insert into public.issuer_accounts values(issuer,target) on conflict do nothing;
 else delete from public.issuer_accounts where issuer_id=issuer and account_id=target; end if;
end; $$;
revoke all on function private.set_issuer_assignment(uuid,uuid,boolean) from public,anon;
grant execute on function private.set_issuer_assignment(uuid,uuid,boolean) to authenticated;
create function public.set_issuer_assignment(target uuid,issuer uuid,enabled boolean) returns void language sql security invoker set search_path='' as $$select private.set_issuer_assignment(target,issuer,enabled);$$;
revoke all on function public.set_issuer_assignment(uuid,uuid,boolean) from public,anon;
grant execute on function public.set_issuer_assignment(uuid,uuid,boolean) to authenticated;
commit;
