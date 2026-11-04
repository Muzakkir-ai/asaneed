begin;
create table private.account_deletions (
 account_id uuid primary key references public.accounts(id) on delete restrict,
 deleted_by uuid not null references public.accounts(id) on delete restrict,
 deleted_at timestamptz not null default now()
);
alter table private.account_deletions enable row level security;
revoke all on private.account_deletions from public,anon,authenticated;
create function private.account_deletion_ids() returns uuid[] language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 return coalesce((select array_agg(account_id) from private.account_deletions),'{}'::uuid[]);
end; $$;
create function public.account_deletion_ids() returns uuid[] language sql stable security invoker set search_path='' as $$ select private.account_deletion_ids(); $$;
create function private.set_account_deleted(target_account uuid,deleted boolean) returns void language plpgsql security definer set search_path='' as $$
declare target public.accounts%rowtype; actor uuid;
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 select id into actor from public.accounts where auth_user_id=(select auth.uid()) and active and role='admin';
 select * into target from public.accounts where id=target_account for update;
 if not found then raise exception 'Account unavailable'; end if;
 if target.id=actor or target.role='admin' then raise exception 'Administrator accounts cannot be deleted'; end if;
 if deleted then
  update public.accounts set active=false where id=target.id;
  insert into private.account_deletions(account_id,deleted_by) values(target.id,actor) on conflict(account_id) do nothing;
 else
  delete from private.account_deletions where account_id=target.id;
  -- Restoration does not reactivate access without a separate administrator decision.
  update public.accounts set active=false where id=target.id;
 end if;
end; $$;
create function public.set_account_deleted(target_account uuid,deleted boolean) returns void language sql security invoker set search_path='' as $$ select private.set_account_deleted(target_account,deleted); $$;
create function private.keep_deleted_account_inactive() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (new.active or new.role='admin') and exists(select 1 from private.account_deletions where account_id=new.id) then raise exception 'Restore the deleted account first' using errcode='42501'; end if;
 return new;
end; $$;
create trigger keep_deleted_account_inactive before update on public.accounts for each row execute function private.keep_deleted_account_inactive();
revoke all on function private.account_deletion_ids(),public.account_deletion_ids(),private.set_account_deleted(uuid,boolean),public.set_account_deleted(uuid,boolean),private.keep_deleted_account_inactive() from public,anon;
grant execute on function private.account_deletion_ids(),public.account_deletion_ids(),private.set_account_deleted(uuid,boolean),public.set_account_deleted(uuid,boolean) to authenticated;
commit;
