begin;
lock table public.certificates in access exclusive mode;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where role='admin' and active and auth_user_id is not null order by id limit 1),'role','authenticated')::text,true);
insert into private.application_backups(purpose,snapshot) values('Before khatam-date draft number ordering 2026-11-01',private.full_application_backup());
create or replace function private.reserve_certificate_number(target uuid) returns text language plpgsql security definer set search_path='' as $$
declare c public.certificates; code text; yr integer; mapping jsonb; reserved_max bigint; draft_count bigint; result text;
begin
 select * into c from public.certificates where id=target;
 if not found or auth.uid() is null or not private.can_manage_issuer(c.issuer_id) then raise exception 'Issuer access required' using errcode='42501';end if;
 if c.status='finalized' then return c.registration_number;end if;
 perform pg_advisory_xact_lock(hashtextextended('khatam-numbers:'||c.issuer_id::text,0));
 select * into c from public.certificates where id=target for update;
 if c.status='finalized' then return c.registration_number;end if;
 yr=extract(year from c.completion_date)::integer;
 if yr<1900 or yr>2199 then raise exception 'Unsupported year';end if;
 select issuer_code into strict code from public.issuers where id=c.issuer_id;
 perform 1 from public.certificates d where d.issuer_id=c.issuer_id and d.status='draft' and extract(year from d.completion_date)=yr order by d.id for update;
 if exists(select 1 from private.annual_certificate_allocations a join public.certificates d on d.id=a.certificate_id where d.issuer_id=c.issuer_id and d.status='draft' and extract(year from d.completion_date)=yr and a.issuer_id<>c.issuer_id) then raise exception 'Allocated issuer mismatch';end if;
 select count(*) into draft_count from public.certificates d where d.issuer_id=c.issuer_id and d.status='draft' and extract(year from d.completion_date)=yr;
 select coalesce(max(a.serial),0) into reserved_max from private.annual_certificate_allocations a left join public.certificates d on d.id=a.certificate_id where a.issuer_id=c.issuer_id and a.year=yr and (d.id is null or d.status<>'draft');
 with ranked as(select d.id,d.riwayah_code,row_number() over(order by d.completion_date,d.created_at,d.id) position from public.certificates d where d.issuer_id=c.issuer_id and d.status='draft' and extract(year from d.completion_date)=yr), slots as(select serial,row_number() over(order by serial) position from generate_series(1,reserved_max+draft_count) as candidates(serial) where not exists(select 1 from private.annual_certificate_allocations a left join public.certificates d on d.id=a.certificate_id where a.issuer_id=c.issuer_id and a.year=yr and a.serial=candidates.serial and (d.id is null or d.status<>'draft')))
 select jsonb_agg(jsonb_build_object('id',r.id,'serial',s.serial,'number',right(yr::text,2)||code||'-'||lpad(s.serial::text,greatest(2,length(s.serial::text)),'0')||r.riwayah_code)) into mapping from ranked r join slots s using(position);
 -- Clear drafts before moving unique serials; finalized/deleted allocations stay reserved.
 update public.certificates d set registration_number=null where d.id in(select (x->>'id')::uuid from jsonb_array_elements(mapping) x) and d.status='draft';
 delete from private.annual_certificate_allocations a where a.certificate_id in(select (x->>'id')::uuid from jsonb_array_elements(mapping) x);
 insert into private.annual_certificate_allocations(certificate_id,issuer_id,year,serial) select (x->>'id')::uuid,c.issuer_id,yr,(x->>'serial')::bigint from jsonb_array_elements(mapping) x;
 insert into private.annual_issuer_counters(issuer_id,year,last_number) select c.issuer_id,yr,max((x->>'serial')::bigint) from jsonb_array_elements(mapping) x on conflict(issuer_id,year) do update set last_number=greatest(private.annual_issuer_counters.last_number,excluded.last_number);
 update public.certificates d set registration_number=x->>'number' from jsonb_array_elements(mapping) x where d.id=(x->>'id')::uuid and d.status='draft';
 update private.ijazah_verification_index v set registration_number=x->>'number' from jsonb_array_elements(mapping) x where v.certificate_id=(x->>'id')::uuid and not v.published;
 select registration_number into result from public.certificates where id=target;
 return result;
end $$;
do $$ declare item record;begin
 for item in select distinct on(issuer_id,extract(year from completion_date)) id from public.certificates where status='draft' order by issuer_id,extract(year from completion_date),completion_date,created_at,id loop perform private.reserve_certificate_number(item.id);end loop;
end $$;
do $$ declare data jsonb;begin
 select snapshot into data from private.application_backups where purpose='Before khatam-date draft number ordering 2026-11-01' order by created_at desc limit 1;
 if exists(select 1 from public.certificates c join jsonb_array_elements(data->'certificates') old on old->>'id'=c.id::text where to_jsonb(c)-'registration_number'<>old-'registration_number' or (c.status='finalized' and to_jsonb(c)<>old)) then raise exception 'Unexpected certificate change';end if;
 if (select jsonb_agg(to_jsonb(s) order by certificate_id) from public.certificate_snapshots s) is distinct from (select jsonb_agg(s order by s->>'certificate_id') from jsonb_array_elements(data->'certificate_snapshots') s) then raise exception 'Snapshot changed';end if;
end $$;
commit;
