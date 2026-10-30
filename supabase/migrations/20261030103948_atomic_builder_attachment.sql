begin;
create function public.attach_builder_route(route_id uuid,holding jsonb,extra uuid default null) returns uuid language plpgsql security invoker set search_path='' as $$
declare actor public.accounts; target uuid; route public.builder_chains; issuer public.issuers; readings jsonb; owner text;
begin
 select * into actor from public.accounts where auth_user_id=(select auth.uid()) and active and role in ('admin','shaykh');
 if actor.id is null then raise exception 'Staff access required';end if;
 select * into route from public.builder_chains where id=route_id and kind='route' and confirmed and not archived;
 if route.id is null then raise exception 'Reviewed route unavailable';end if;
 owner:=holding->>'ownerId';
 if extra is not null then
  if actor.role<>'admin' or owner<>'guest:'||extra::text then raise exception 'Administrator required';end if;
  select * into issuer from public.issuers where id=extra;
  if issuer.id is null then raise exception 'Issuing shaykh unavailable';end if;
 else
  if not exists(select 1 from public.accounts a where a.auth_user_id::text=owner and a.active and a.role in ('admin','shaykh') and (a.id=actor.id or actor.role='admin')) then raise exception 'Owner unavailable';end if;
 end if;
 if holding->>'builderRouteId'<>route.id::text or holding->>'tariqNumber'<>route.route_code or holding->>'qariId'<>route.qari_id or holding->>'rawi'<>route.rawi or length(holding->>'personalChain')<100 then raise exception 'Route identity mismatch';end if;
 perform pg_advisory_xact_lock(hashtextextended(route.id::text||owner,0));
 select id into target from public.workspace_records where kind='ijazahHoldings' and payload->>'ownerId'=owner and payload->>'builderRouteId'=route.id::text;
 if target is not null then return target;end if;
 target:=gen_random_uuid();
 insert into public.workspace_records(kind,id,payload) values('ijazahHoldings',target,holding);
 if extra is not null then
  readings:=coalesce(nullif(issuer.print_profile->>'readingsJson','')::jsonb,'[]');
  if not exists(select 1 from jsonb_array_elements(readings) r where r->>'qariId'=route.qari_id and r->>'rawi'=route.rawi) then readings:=readings||jsonb_build_array(jsonb_build_object('qariId',route.qari_id,'rawi',route.rawi));end if;
  update public.issuers set print_profile=print_profile||jsonb_build_object('readingsJson',readings::text) where id=extra;
  insert into public.workspace_records(kind,payload) values('additionalShaykhReadingSanads',jsonb_build_object('shaykhId',extra,'qariId',route.qari_id,'rawi',route.rawi,'name',holding->>'name','sanadText',holding->>'personalChain','junction','jazari','tariqNumber',route.route_code,'tariqName',holding->>'tariqName','bookAuthor',holding->>'bookAuthor','routeSource',holding->>'routeSource','builderRouteId',route.id));
 end if;
 return target;
end $$;
revoke all on function public.attach_builder_route(uuid,jsonb,uuid) from public,anon;
grant execute on function public.attach_builder_route(uuid,jsonb,uuid) to authenticated;
commit;
