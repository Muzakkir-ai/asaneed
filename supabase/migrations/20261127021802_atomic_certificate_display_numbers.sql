begin;
-- Display numbers are UI ordinals, not official registration numbers.
-- Lock during initialization so the sequence begins above every historical number.
lock table public.certificates in share row exclusive mode;
create sequence public.certificate_display_number_seq as bigint minvalue 1 maxvalue 9007199254740991;
revoke all on sequence public.certificate_display_number_seq from public, anon, authenticated, service_role;
grant usage on sequence public.certificate_display_number_seq to authenticated, service_role;

create function private.certificate_display_number_value(value jsonb) returns text
language sql immutable security invoker set search_path='' as $$
 select coalesce(value->'editor'->>'shahadaNumber',value->'source'->>'shahadaNumber',value->'source'->>'Certificate Number')
$$;
revoke all on function private.certificate_display_number_value(jsonb) from public, anon, authenticated, service_role;
grant execute on function private.certificate_display_number_value(jsonb) to authenticated;
-- Use a private helper only for trusted restore operations; normal allocation never reads existing records.
do $$
declare highest numeric;
begin
 select max(case when private.certificate_display_number_value(draft) ~ '^[1-9][0-9]*$' then private.certificate_display_number_value(draft)::numeric end) into highest from public.certificates;
 if highest>=9007199254740991 then raise exception 'Certificate display number outside supported range';end if;
 perform pg_catalog.setval('public.certificate_display_number_seq'::regclass,greatest(1,coalesce(highest,0))::bigint,highest is not null);
end $$;

create function private.allocate_certificate_display_number() returns trigger
language plpgsql security invoker set search_path='' as $$
declare existing_number text; assigned bigint; editor jsonb;
begin
 -- A restore runs as postgres. Preserve historical JSON exactly and only raise the sequence floor.
 if current_user='postgres' then
   existing_number:=coalesce(new.draft->'editor'->>'shahadaNumber',new.draft->'source'->>'shahadaNumber',new.draft->'source'->>'Certificate Number');
   if existing_number ~ '^[1-9][0-9]*$' then
     if existing_number::numeric>=9007199254740991 then raise exception 'Certificate display number outside supported range';end if;
     perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('certificate-display-number-v1',0));
     select last_value into assigned from public.certificate_display_number_seq;
     if existing_number::bigint>=assigned then perform pg_catalog.setval('public.certificate_display_number_seq'::regclass,existing_number::bigint,true);end if;
   end if;
   return new;
 end if;
 if tg_op='UPDATE' then
   if coalesce(new.draft->'editor'->>'shahadaNumber',new.draft->'source'->>'shahadaNumber',new.draft->'source'->>'Certificate Number') is distinct from coalesce(old.draft->'editor'->>'shahadaNumber',old.draft->'source'->>'shahadaNumber',old.draft->'source'->>'Certificate Number') then
     raise exception 'Existing certificate display numbers cannot be changed' using errcode='22023';
   end if;
   return new;
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('certificate-display-number-v1',0));
 assigned:=pg_catalog.nextval('public.certificate_display_number_seq'::regclass);
 editor:=case when jsonb_typeof(new.draft->'editor')='object' then new.draft->'editor' else '{}'::jsonb end;
 new.draft:=coalesce(new.draft,'{}'::jsonb)||jsonb_build_object('editor',editor||jsonb_build_object('shahadaNumber',assigned));
 return new;
end $$;
revoke all on function private.allocate_certificate_display_number() from public, anon, authenticated, service_role;
create trigger allocate_certificate_display_number before insert or update of draft on public.certificates for each row execute function private.allocate_certificate_display_number();
commit;
