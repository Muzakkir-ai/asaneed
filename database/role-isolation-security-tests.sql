-- Staging only; no committed changes.
begin;
create temporary table audit_roles as select
(select auth_user_id from public.accounts where role='student' and active limit 1) student_uid,
(select auth_user_id from public.accounts where role='shaykh' and active limit 1) shaykh_uid,
(select auth_user_id from public.accounts where not active and auth_user_id is not null limit 1) inactive_uid,
(select id from public.accounts where role='shaykh' and active limit 1) staff_id;
grant select on audit_roles to authenticated;
do $$begin if exists(select 1 from audit_roles where student_uid is null or shaykh_uid is null or inactive_uid is null or staff_id is null) then raise exception 'Missing test roles';end if;end$$;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select student_uid from audit_roles),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$begin
 if exists(select 1 from public.accounts where auth_user_id<>(select student_uid from audit_roles)) then raise exception 'Account directory exposed';end if;
 if exists(select 1 from public.sanads) then raise exception 'Sanad library exposed to students';end if;
 if exists(select 1 from public.builder_people) then raise exception 'Narrator library exposed to students';end if;
 begin perform public.set_issuance_capability((select staff_id from audit_roles),true);raise exception 'Elevation allowed';exception when others then if sqlerrm<>'Administrator required' then raise;end if;end;
end$$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select shaykh_uid from audit_roles),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$begin
 begin perform public.set_issuance_capability((select staff_id from audit_roles),true);raise exception 'Shaykh elevation allowed';exception when others then if sqlerrm<>'Administrator required' then raise;end if;end;
end$$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select inactive_uid from audit_roles),'role','authenticated')::text,true) is not null;
set local role authenticated;
do $$begin
 if exists(select 1 from public.certificates) or exists(select 1 from public.sanads) or exists(select 1 from public.builder_people) or exists(select 1 from public.students) then raise exception 'Inactive account can read protected data';end if;
end$$;
reset role;
do $$begin
 if exists(select 1 from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='r' and not c.relrowsecurity) then raise exception 'Missing RLS';end if;
 if exists(select 1 from pg_class c where c.relnamespace='private'::regnamespace and c.relkind='r' and (has_table_privilege('anon',c.oid,'select') or has_table_privilege('authenticated',c.oid,'select'))) then raise exception 'Private table exposed';end if;
 if exists(select 1 from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='r' and (has_table_privilege('anon',c.oid,'select') or has_table_privilege('anon',c.oid,'insert') or has_table_privilege('anon',c.oid,'update') or has_table_privilege('anon',c.oid,'delete'))) then raise exception 'Anonymous table grant';end if;
end$$;
select 'PASS: student and inactive role isolation, student and shaykh privilege escalation denial, private and anonymous table grants' as result;
rollback;
