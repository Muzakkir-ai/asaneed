begin;
create or replace function private.legacy_identity_choices() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'email',email) order by name) from (
  select distinct on (id) id,name,email from (
   select distinct on (coalesce(nullif(lower(payload->>'Email'),''),source_id))
    coalesce(nullif(payload->>'Original User ID',''),nullif(payload->>'Legacy User ID',''),nullif(payload->>'Auth User ID',''),source_id) id,
    coalesce(nullif(payload->>'Name',''),payload->>'Email',source_id) name,coalesce(payload->>'Email','') email,
    case source_table when 'Legacy User Directory' then 0 when 'App Users' then 1 else 2 end priority
   from private.legacy_records where source_table in ('Legacy User Directory','App Users','Zite Users')
   order by coalesce(nullif(lower(payload->>'Email'),''),source_id),priority
  )people order by id,priority
 )t),'[]'::jsonb);
end; $$;
commit;
