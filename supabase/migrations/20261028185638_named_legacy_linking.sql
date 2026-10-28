begin;
create function private.list_application_accounts() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(row_to_json(t)) from (select a.*,u.email from public.accounts a left join auth.users u on u.id=a.auth_user_id where a.auth_user_id=auth.uid() or private.is_admin() order by a.created_at)t),'[]'::jsonb);
end; $$;
revoke all on function private.list_application_accounts() from public,anon;
grant execute on function private.list_application_accounts() to authenticated;
create function public.list_application_accounts() returns jsonb language sql stable security invoker set search_path='' as $$ select private.list_application_accounts(); $$;
revoke all on function public.list_application_accounts() from public,anon;
grant execute on function public.list_application_accounts() to authenticated;
create function private.legacy_identity_choices() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'email',email) order by name) from (
 select distinct on (coalesce(nullif(lower(payload->>'Email'),''),source_id))
 coalesce(nullif(payload->>'Original User ID',''),nullif(payload->>'Auth User ID',''),source_id) id,
 coalesce(nullif(payload->>'Name',''),payload->>'Email',source_id) name,coalesce(payload->>'Email','') email
 from private.legacy_records where source_table in ('Legacy User Directory','App Users','Zite Users')
 order by coalesce(nullif(lower(payload->>'Email'),''),source_id),case source_table when 'Legacy User Directory' then 0 when 'App Users' then 1 else 2 end
 )t),'[]'::jsonb);
end; $$;
revoke all on function private.legacy_identity_choices() from public,anon;
grant execute on function private.legacy_identity_choices() to authenticated;
create function public.legacy_identity_choices() returns jsonb language sql stable security invoker set search_path='' as $$ select private.legacy_identity_choices(); $$;
revoke all on function public.legacy_identity_choices() from public,anon;
grant execute on function public.legacy_identity_choices() to authenticated;
create function private.link_legacy_profile(target uuid,legacy_id text) returns void language plpgsql security definer set search_path='' as $$
declare a public.accounts%rowtype; person jsonb; aliases text[];
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 select * into a from public.accounts where id=target for update;
 if not found or not exists(select 1 from auth.users where id=a.auth_user_id and email_confirmed_at is not null) then raise exception 'Verified login required'; end if;
 select item into person from jsonb_array_elements(private.legacy_identity_choices())item where item->>'id'=legacy_id;
 if person is null then raise exception 'Choose a named legacy person'; end if;
 select array_agg(distinct alias) into aliases from (
  select legacy_id alias union all
  select val from private.legacy_records r cross join lateral (values(r.payload->>'Original User ID'),(r.payload->>'Auth User ID'),(r.payload->>'Legacy User ID'),(r.source_id))v(val)
  where r.source_table in ('Legacy User Directory','App Users','Zite Users') and lower(r.payload->>'Email')=lower(person->>'email') and coalesce(person->>'email','')<>''
 )x where coalesce(alias,'')<>'';
 if exists(select 1 from public.accounts where id<>target and legacy_auth_id=any(aliases)) then raise exception 'This legacy person is already linked to another login'; end if;
 if a.legacy_auth_id is not null and not a.legacy_auth_id=any(aliases) then raise exception 'This login already has a different legacy person linked'; end if;
 update public.workspace_records set payload=jsonb_set(payload,'{ownerId}',to_jsonb(a.auth_user_id::text)) where payload->>'ownerId'=any(aliases);
 update public.workspace_records set payload=jsonb_set(payload,'{shaykh}',jsonb_build_array(a.auth_user_id::text)) where kind='asaneed' and coalesce(payload->>'additionalShaykh','')='' and (payload->>'originalShaykhUserId'=any(aliases) or (payload->'shaykh'->>0)=any(aliases));
 update public.accounts set legacy_auth_id=legacy_id where id=target;
end; $$;
revoke all on function private.link_legacy_profile(uuid,text) from public,anon,authenticated;
create function private.save_account_profile(target uuid,new_name text,new_role text,new_active boolean,legacy_id text default null) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.edit_account_profile(target,new_name,new_role,new_active);
 if legacy_id is not null and legacy_id<>'' then perform private.link_legacy_profile(target,legacy_id); end if;
end; $$;
revoke all on function private.save_account_profile(uuid,text,text,boolean,text) from public,anon;
grant execute on function private.save_account_profile(uuid,text,text,boolean,text) to authenticated;
create function public.save_account_profile(target uuid,new_name text,new_role text,new_active boolean,legacy_id text default null) returns void language sql security invoker set search_path='' as $$ select private.save_account_profile(target,new_name,new_role,new_active,legacy_id); $$;
revoke all on function public.save_account_profile(uuid,text,text,boolean,text) from public,anon;
grant execute on function public.save_account_profile(uuid,text,text,boolean,text) to authenticated;
commit;
