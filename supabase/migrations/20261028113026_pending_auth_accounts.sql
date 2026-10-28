begin;
create function private.create_pending_account() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.accounts(auth_user_id,display_name,role,active)
 values (new.id,coalesce(nullif(left(btrim(new.raw_user_meta_data->>'display_name'),120),''),nullif(left(btrim(new.raw_user_meta_data->>'full_name'),120),''),'Asaneed user'),'student',false)
 on conflict (auth_user_id) do nothing;
 return new;
end;
$$;
revoke all on function private.create_pending_account() from public,anon,authenticated;
create trigger asaneed_pending_account after insert on auth.users for each row execute function private.create_pending_account();
-- Metadata supplies display text only. Role and activation are always fixed by trusted code.
insert into public.accounts(auth_user_id,display_name,role,active)
select id,coalesce(nullif(left(btrim(raw_user_meta_data->>'display_name'),120),''),'Asaneed user'),'student',false from auth.users
on conflict (auth_user_id) do nothing;
commit;
