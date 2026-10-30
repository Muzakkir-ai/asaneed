begin;
create table private.artwork_refresh_credentials(name text primary key,token_hash text not null check(length(token_hash)=64));
alter table private.artwork_refresh_credentials enable row level security;
revoke all on private.artwork_refresh_credentials from public,anon,authenticated;
create function public.refresh_github_artwork(p_secret text,p_revision text,p_artwork jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare current_row public.workspace_records; result jsonb;
begin
 if p_secret is null or length(p_secret)<40 or not exists(select 1 from private.artwork_refresh_credentials where name='fonts' and token_hash=encode(extensions.digest(p_secret,'sha256'),'hex')) then raise exception 'Unauthorized';end if;
 if p_revision is null or p_revision !~ '^[a-f0-9]{40}$' or jsonb_typeof(p_artwork) is distinct from 'array' or jsonb_array_length(p_artwork)>500 then raise exception 'Invalid catalog';end if;
 if exists(select 1 from jsonb_array_elements(p_artwork) a where a->>'path' !~ '^svg/(mashaykh|books|turuq)/[0-9]{2,4}/(name|line-02|line-03|heading)\.svg$' or coalesce((a->>'width')::numeric,0)<=0 or coalesce((a->>'height')::numeric,0)<=0) then raise exception 'Invalid artwork';end if;
 select * into strict current_row from public.workspace_records where kind='assetSources' and payload->>'key'='default' for update;
 if current_row.payload->>'gitHubRepository'<>'https://github.com/Muzakkir-ai/fonts' or current_row.payload->>'branch'<>'main' then raise exception 'Repository changed';end if;
 if current_row.payload->>'revision'=p_revision then return jsonb_build_object('updated',false,'revision',p_revision);end if;
 select coalesce(jsonb_agg(case when a->>'kind'='turuq' and b.id is not null then a||jsonb_build_object('label',b.title) else a end),'[]') into result from jsonb_array_elements(p_artwork) a left join public.builder_books b on a->>'kind'='turuq' and b.artwork_number=a->>'number';
 update public.workspace_records set payload=payload||jsonb_build_object('revision',p_revision,'artwork',result,'updatedAt',now()) where id=current_row.id;
 return jsonb_build_object('updated',true,'revision',p_revision,'artworkCount',jsonb_array_length(result));
end $$;
revoke all on function public.refresh_github_artwork(text,text,jsonb) from public;
grant execute on function public.refresh_github_artwork(text,text,jsonb) to anon,authenticated;
commit;
