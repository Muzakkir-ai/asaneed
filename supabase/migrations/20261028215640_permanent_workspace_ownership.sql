begin;
-- Audit-only aliases. Operational ownership uses accounts/auth UUIDs and issuer_accounts.
create table private.ownership_migration_audit (
 id uuid primary key default gen_random_uuid(),
 account_id uuid not null references public.accounts(id),
 backup_id uuid not null references private.application_backups(id),
 aliases text[] not null,
 changed_records jsonb not null,
 assigned_issuers uuid[] not null,
 created_at timestamptz not null default now()
);
alter table private.ownership_migration_audit enable row level security;
revoke all on private.ownership_migration_audit from public,anon,authenticated;
create function private.complete_verified_ownership(target uuid, verified_aliases text[], backup uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.accounts%rowtype; changes jsonb; assigned uuid[];
begin
 select * into strict a from public.accounts where id=target;
 if not exists(select 1 from auth.users where id=a.auth_user_id and email_confirmed_at is not null)
 or not exists(select 1 from private.application_backups where id=backup) then raise exception 'Verified account and backup required'; end if;
 if exists(select 1 from public.accounts where id<>target and legacy_auth_id=any(verified_aliases)) then raise exception 'Alias belongs to another account'; end if;
 if exists(select 1 from unnest(verified_aliases) x where not exists(
 select 1 from private.legacy_records r where r.source_table in ('App Users','Zite Users','Legacy User Directory') and
 (r.source_id=x or r.payload->>'Original User ID'=x or r.payload->>'Auth User ID'=x or r.payload->>'Legacy User ID'=x))) then raise exception 'Unverified source alias'; end if;
 select coalesce(jsonb_agg(to_jsonb(w)),'[]') into changes from public.workspace_records w
 where payload->>'ownerId'=any(verified_aliases) or
 (kind='asaneed' and coalesce(payload->>'additionalShaykh','')='' and
 (payload->>'originalShaykhUserId'=any(verified_aliases) or payload->'shaykh'->>0=any(verified_aliases)));
 update public.workspace_records set payload=jsonb_set(payload,'{ownerId}',to_jsonb(a.auth_user_id::text)) where payload->>'ownerId'=any(verified_aliases);
 update public.workspace_records set payload=jsonb_set(payload,'{shaykh}',jsonb_build_array(a.auth_user_id::text)) where kind='asaneed' and coalesce(payload->>'additionalShaykh','')='' and
 (payload->>'originalShaykhUserId'=any(verified_aliases) or payload->'shaykh'->>0=any(verified_aliases));
 select coalesce(array_agg(id),'{}') into assigned from public.issuers where print_profile->>'createdBy'=any(verified_aliases);
 insert into public.issuer_accounts(issuer_id,account_id) select unnest(assigned),target on conflict do nothing;
 insert into private.ownership_migration_audit(account_id,backup_id,aliases,changed_records,assigned_issuers) values(target,backup,verified_aliases,changes,assigned);
 return jsonb_build_object('updated_workspace_records',jsonb_array_length(changes),'assigned_issuers',cardinality(assigned));
end; $$;
revoke all on function private.complete_verified_ownership(uuid,text[],uuid) from public,anon,authenticated;
commit;
