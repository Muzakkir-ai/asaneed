begin;
select set_config('request.jwt.claim.sub','393ac60e-11fb-418b-910f-ee2d4d807fbd',true);
do $$ declare fixture uuid; expected integer; code integer; a record; total integer;begin
 select greatest(5,coalesce(max(issuer_code::integer),0))+1 into expected from public.issuers;
 fixture:=public.create_issuer_profile('Rollback-only issuer allocation fixture','{}',false);
 select issuer_code::integer into code from public.issuers where id=fixture;
 if code<>expected then raise exception 'New issuer code must follow highest existing code';end if;
 fixture:=public.create_issuer_profile('Rollback-only issuer allocation fixture two','{}',false);
 select issuer_code::integer into code from public.issuers where id=fixture;
 if code<>expected+1 then raise exception 'Sequential issuer allocation failed';end if;
 for a in select auth_user_id from public.accounts where role='admin' and active loop
  perform set_config('request.jwt.claim.sub',a.auth_user_id::text,true);
  if exists(select 1 from public.issuers i where not private.can_manage_issuer(i.id)) then raise exception 'Admin cannot administer all issuer profiles';end if;
 end loop;
end $$;
rollback;
select 'PASS: sequential codes and all active administrators retain issuer management access; fixtures rolled back' as result;
