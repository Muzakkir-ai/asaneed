begin;
lock table public.certificates in access exclusive mode;
-- The inspected population contains drafts only. Never renumber newly finalized records.
do $$ begin if exists(select 1 from public.certificates where status='finalized') then raise exception 'Finalized population changed; review mapping first';end if;end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where role='admin' and active and auth_user_id is not null order by id limit 1),'role','authenticated')::text,true);
insert into private.application_backups(purpose,snapshot) values('Before annual issuer draft numbering 2026-11-01',private.full_application_backup());
create table private.annual_issuer_counters(issuer_id uuid not null references public.issuers(id),year integer not null check(year between 1900 and 2199),last_number bigint not null check(last_number>0),primary key(issuer_id,year));
create table private.annual_certificate_allocations(certificate_id uuid primary key,issuer_id uuid not null references public.issuers(id),year integer not null check(year between 1900 and 2199),serial bigint not null check(serial>0),unique(issuer_id,year,serial));
alter table private.annual_issuer_counters enable row level security;
alter table private.annual_certificate_allocations enable row level security;
revoke all on private.annual_issuer_counters,private.annual_certificate_allocations from public,anon,authenticated;
insert into private.annual_certificate_allocations select id,issuer_id,extract(year from completion_date)::int,row_number() over(partition by issuer_id,extract(year from completion_date) order by created_at,id) from public.certificates where status='draft';
insert into private.annual_issuer_counters select issuer_id,year,max(serial) from private.annual_certificate_allocations group by issuer_id,year;
create temporary table annual_number_changes on commit drop as select c.id,c.registration_number old_number,right(a.year::text,2)||i.issuer_code||'-'||lpad(a.serial::text,greatest(2,length(a.serial::text)),'0')||c.riwayah_code new_number from public.certificates c join private.annual_certificate_allocations a on a.certificate_id=c.id join public.issuers i on i.id=c.issuer_id where c.status='draft';
update private.application_backups set snapshot=snapshot||jsonb_build_object('annual_number_changes',(select jsonb_agg(to_jsonb(m)) from annual_number_changes m)) where purpose='Before annual issuer draft numbering 2026-11-01' and created_at=(select max(created_at) from private.application_backups where purpose='Before annual issuer draft numbering 2026-11-01');
update public.certificates set registration_number=null where status='draft';
update public.certificates c set registration_number=m.new_number from annual_number_changes m where c.id=m.id and c.status='draft';
update private.ijazah_verification_index v set registration_number=m.new_number from annual_number_changes m where v.certificate_id=m.id and not v.published;
create or replace function private.reserve_certificate_number(target uuid) returns text language plpgsql security definer set search_path='' as $$
declare c public.certificates; code text; yr integer; seq bigint; allocated_issuer uuid; allocated_year integer; result text;
begin
 select * into c from public.certificates where id=target for update;
 if not found or auth.uid() is null or not private.can_manage_issuer(c.issuer_id) then raise exception 'Issuer access required' using errcode='42501';end if;
 if c.status='finalized' then return c.registration_number;end if;
 yr=extract(year from c.completion_date)::integer;
 if yr<1900 or yr>2199 then raise exception 'Unsupported year';end if;
 select issuer_code into strict code from public.issuers where id=c.issuer_id;
 select serial,issuer_id,year into seq,allocated_issuer,allocated_year from private.annual_certificate_allocations where certificate_id=target;
 if found and allocated_issuer<>c.issuer_id then raise exception 'Allocated issuer mismatch';end if;
 if seq is null or allocated_year<>yr then
  insert into private.annual_issuer_counters(issuer_id,year,last_number) values(c.issuer_id,yr,1) on conflict(issuer_id,year) do update set last_number=private.annual_issuer_counters.last_number+1 returning last_number into seq;
  insert into private.annual_certificate_allocations(certificate_id,issuer_id,year,serial) values(target,c.issuer_id,yr,seq) on conflict(certificate_id) do update set year=excluded.year,serial=excluded.serial;
 end if;
 result=right(yr::text,2)||code||'-'||lpad(seq::text,greatest(2,length(seq::text)),'0')||c.riwayah_code;
 if c.registration_number is distinct from result then update public.certificates set registration_number=result where id=target;end if;
 return result;
end $$;
-- Extend the existing complete backup and restore contract; preserve legacy backups/counters.
do $$ declare source text;begin
 select pg_get_functiondef('private.full_application_backup()'::regprocedure) into source;
 execute replace(source,'return jsonb_build_object(', 'return jsonb_build_object(''annual_issuer_counters'',coalesce((select jsonb_agg(to_jsonb(t)) from private.annual_issuer_counters t),''[]''),''annual_certificate_allocations'',coalesce((select jsonb_agg(to_jsonb(t)) from private.annual_certificate_allocations t),''[]''),');
 select pg_get_functiondef('private.restore_application_backup(jsonb,boolean)'::regprocedure) into source;
 if strpos(source,'return jsonb_build_object(''success''')=0 then raise exception 'Restore implementation changed';end if;
 execute replace(source,'return jsonb_build_object(''success''', 'if data ? ''annual_issuer_counters'' then insert into private.annual_issuer_counters select * from jsonb_populate_recordset(null::private.annual_issuer_counters,data->''annual_issuer_counters'') on conflict(issuer_id,year) do update set last_number=greatest(private.annual_issuer_counters.last_number,excluded.last_number); end if; if data ? ''annual_certificate_allocations'' then insert into private.annual_certificate_allocations select * from jsonb_populate_recordset(null::private.annual_certificate_allocations,data->''annual_certificate_allocations'') on conflict do nothing; end if; insert into private.annual_certificate_allocations select c.id,c.issuer_id,extract(year from c.completion_date)::int,substring(split_part(c.registration_number,''-'',2) from 1 for length(split_part(c.registration_number,''-'',2))-2)::bigint from public.certificates c where c.registration_number ~ ''^[0-9]{4}-[0-9]{4,21}$'' on conflict do nothing; insert into private.annual_issuer_counters select issuer_id,year,max(serial) from private.annual_certificate_allocations group by issuer_id,year on conflict(issuer_id,year) do update set last_number=greatest(private.annual_issuer_counters.last_number,excluded.last_number); return jsonb_build_object(''success''');
end $$;
do $$ declare data jsonb;begin
 select snapshot into data from private.application_backups where purpose='Before annual issuer draft numbering 2026-11-01' order by created_at desc limit 1;
 if exists(select 1 from public.certificates c join jsonb_array_elements(data->'certificates') old on old->>'id'=c.id::text where to_jsonb(c)-'registration_number'<>old-'registration_number') then raise exception 'Unexpected certificate change';end if;
 if (select jsonb_agg(to_jsonb(s) order by certificate_id) from public.certificate_snapshots s) is distinct from (select jsonb_agg(s order by s->>'certificate_id') from jsonb_array_elements(data->'certificate_snapshots') s) then raise exception 'Snapshot changed';end if;
end $$;
commit;
