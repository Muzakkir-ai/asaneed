begin;
lock table public.certificates in access exclusive mode;
-- Finalized renumbering was authorized, but inspection found none. Stop if that changes.
do $$ begin if exists(select 1 from public.certificates where status='finalized') then raise exception 'Finalized records changed since review; prepare snapshot-aware mapping first';end if;end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where role='admin' and active and auth_user_id is not null order by id limit 1),'role','authenticated')::text,true);
insert into private.application_backups(purpose,snapshot) values ('Before YYSS-NNRR lifetime issuer numbering',private.full_application_backup());
create table private.issuer_certificate_counters(issuer_id uuid primary key references public.issuers(id),last_number bigint not null check(last_number>0));
-- No certificate FK: a deleted draft must never release its serial for reuse.
create table private.certificate_number_allocations(certificate_id uuid primary key,issuer_id uuid not null references public.issuers(id),serial bigint not null check(serial>0),unique(issuer_id,serial));
alter table private.issuer_certificate_counters enable row level security;
alter table private.certificate_number_allocations enable row level security;
revoke all on private.issuer_certificate_counters,private.certificate_number_allocations from public,anon,authenticated;
insert into private.certificate_number_allocations select id,issuer_id,row_number() over(partition by issuer_id order by created_at,id) from public.certificates;
insert into private.issuer_certificate_counters select issuer_id,max(serial) from private.certificate_number_allocations group by issuer_id;
alter table public.certificates drop constraint certificates_registration_number_check;
alter table public.certificates add constraint certificates_registration_number_check check(registration_number ~ '^[0-9]{4}-[0-9]{4,21}$');
alter table private.ijazah_verification_index drop constraint ijazah_verification_index_registration_number_check;
alter table private.ijazah_verification_index add constraint ijazah_verification_index_registration_number_check check(registration_number ~ '^[0-9]{4}-[0-9]{4,21}$');
create temporary table certificate_number_changes on commit drop as
 select c.id,c.registration_number old_number,right(extract(year from c.completion_date)::int::text,2)||i.issuer_code||'-'||lpad(a.serial::text,greatest(2,length(a.serial::text)),'0')||c.riwayah_code new_number
 from public.certificates c join public.issuers i on i.id=c.issuer_id join private.certificate_number_allocations a on a.certificate_id=c.id;
do $$ begin
if exists(select new_number from certificate_number_changes group by new_number having count(*)>1) then raise exception 'Number collision';end if;
end $$;
update private.application_backups set snapshot=snapshot||jsonb_build_object('certificate_number_changes',(select jsonb_agg(to_jsonb(m)) from certificate_number_changes m)) where purpose='Before YYSS-NNRR lifetime issuer numbering' and created_at=(select max(created_at) from private.application_backups where purpose='Before YYSS-NNRR lifetime issuer numbering');
update public.certificates set registration_number=null;
update public.certificates c set registration_number=m.new_number from certificate_number_changes m where c.id=m.id;
-- No finalized certificates exist, so no published index entry may need correction.
do $$ begin if exists(select 1 from private.ijazah_verification_index v join certificate_number_changes m on m.id=v.certificate_id where v.published) then raise exception 'Unexpected published index record';end if;end $$;
update private.ijazah_verification_index v set registration_number=m.new_number from certificate_number_changes m where m.id=v.certificate_id and not v.published;
create or replace function private.reserve_certificate_number(target uuid) returns text language plpgsql security definer set search_path='' as $$
declare c public.certificates; code text; yr integer; seq bigint; result text; allocated_issuer uuid;
begin
 select * into c from public.certificates where id=target for update;
 if not found or auth.uid() is null or not private.can_manage_issuer(c.issuer_id) then raise exception 'Issuer access required' using errcode='42501';end if;
 if c.status='finalized' then return c.registration_number;end if;
 yr:=extract(year from c.completion_date)::integer;
 if yr<1900 or yr>2199 then raise exception 'Unsupported year';end if;
 select issuer_code into strict code from public.issuers where id=c.issuer_id;
 select serial,issuer_id into seq,allocated_issuer from private.certificate_number_allocations where certificate_id=target;
 if found then
  if allocated_issuer<>c.issuer_id then raise exception 'Allocated issuer mismatch';end if;
 else
  insert into private.issuer_certificate_counters(issuer_id,last_number) values(c.issuer_id,1) on conflict(issuer_id) do update set last_number=private.issuer_certificate_counters.last_number+1 returning last_number into seq;
  insert into private.certificate_number_allocations(certificate_id,issuer_id,serial) values(target,c.issuer_id,seq);
 end if;
 result:=right(yr::text,2)||code||'-'||lpad(seq::text,greatest(2,length(seq::text)),'0')||c.riwayah_code;
 if c.registration_number is distinct from result then update public.certificates set registration_number=result where id=target;end if;
 return result;
end $$;
-- Keep finalization's existing authorization, snapshot, token and immutable-record handling.
do $$ declare source text; a integer; b integer;begin
 source:=pg_get_functiondef('private.finalize_certificate(uuid,jsonb)'::regprocedure);
 a:=strpos(source,' yr := extract(year from c.completion_date)');
 b:=strpos(source,' token:=replace(gen_random_uuid()');
 if a=0 or b<=a then raise exception 'Finalization implementation changed';end if;
 source:=left(source,a-1)||E' result:=private.reserve_certificate_number(target);\n'||substring(source from b);
 execute source;
 source:=pg_get_functiondef('public.verify_ijazah(text)'::regprocedure);
 if strpos(source,'[0-9]{4}-[0-9]{4}$')=0 then raise exception 'Verification implementation changed';end if;
 execute replace(source,'[0-9]{4}-[0-9]{4}$','[0-9]{4}-[0-9]{4,21}$');
 source:=pg_get_functiondef('private.full_application_backup()'::regprocedure);
 execute replace(source,'return jsonb_build_object(', 'return jsonb_build_object(''issuer_certificate_counters'',coalesce((select jsonb_agg(to_jsonb(t)) from private.issuer_certificate_counters t),''[]''),''certificate_number_allocations'',coalesce((select jsonb_agg(to_jsonb(t)) from private.certificate_number_allocations t),''[]''),');
 source:=pg_get_functiondef('private.restore_application_backup(jsonb,boolean)'::regprocedure);
 if strpos(source,'return jsonb_build_object(''success''')=0 then raise exception 'Restore implementation changed';end if;
 execute replace(source,'return jsonb_build_object(''success''', 'if data ? ''issuer_certificate_counters'' then insert into private.issuer_certificate_counters select * from jsonb_populate_recordset(null::private.issuer_certificate_counters,data->''issuer_certificate_counters'') on conflict(issuer_id) do update set last_number=greatest(private.issuer_certificate_counters.last_number,excluded.last_number); end if; if data ? ''certificate_number_allocations'' then insert into private.certificate_number_allocations select * from jsonb_populate_recordset(null::private.certificate_number_allocations,data->''certificate_number_allocations'') on conflict do nothing; end if; insert into private.issuer_certificate_counters select issuer_id,max(serial) from private.certificate_number_allocations group by issuer_id on conflict(issuer_id) do update set last_number=greatest(private.issuer_certificate_counters.last_number,excluded.last_number); return jsonb_build_object(''success''');
end $$;
-- All fields except the explicitly changed registration number must match the preimage.
do $$ declare data jsonb;begin
 select snapshot into data from private.application_backups where purpose='Before YYSS-NNRR lifetime issuer numbering' order by created_at desc limit 1;
 if exists(select 1 from public.certificates c join jsonb_array_elements(data->'certificates') old on old->>'id'=c.id::text where to_jsonb(c)-'registration_number'<>old-'registration_number') then raise exception 'Unexpected certificate change';end if;
 if (select jsonb_agg(to_jsonb(s) order by certificate_id) from public.certificate_snapshots s) is distinct from (select jsonb_agg(s order by s->>'certificate_id') from jsonb_array_elements(data->'certificate_snapshots') s) then raise exception 'Snapshot changed';end if;
end $$;
commit;
