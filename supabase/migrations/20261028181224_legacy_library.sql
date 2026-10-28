begin;
create function private.read_legacy_library(source_name text default 'Asaneed',page_number integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 if page_number<0 or page_number>100000 then raise exception 'Invalid page'; end if;
 select jsonb_build_object('tables',(select jsonb_agg(t) from (select source_table as name,count(*) as total from private.legacy_records where source_table<>'__manifest' group by source_table order by source_table)t),'total',(select count(*) from private.legacy_records where source_table=source_name),'records',coalesce((select jsonb_agg(t) from (select source_id,payload from private.legacy_records where source_table=source_name order by source_id limit 20 offset (page_number*20))t),'[]'::jsonb)) into result;
 return result;
end;
$$;
revoke all on function private.read_legacy_library(text,integer) from public,anon,authenticated;
grant execute on function private.read_legacy_library(text,integer) to authenticated;
create function public.read_legacy_library(source_name text default 'Asaneed',page_number integer default 0)
returns jsonb language sql stable security invoker set search_path='' as $$ select private.read_legacy_library(source_name,page_number); $$;
revoke all on function public.read_legacy_library(text,integer) from public,anon,authenticated;
grant execute on function public.read_legacy_library(text,integer) to authenticated;

create or replace function private.finalize_certificate(target uuid, snapshot jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare c public.certificates%rowtype; code text; yr integer; seq integer; result text;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
 select * into c from public.certificates where id = target for update;
 if not found or not private.can_manage_issuer(c.issuer_id) then
 raise exception 'Issuer access required' using errcode = '42501'; end if;
 if c.status <> 'draft' then raise exception 'Certificate already finalized'; end if;
 if jsonb_typeof(snapshot) <> 'object' or snapshot is null or snapshot = '{}'::jsonb then raise exception 'Snapshot required'; end if;
 if c.sanad_id is not null and not exists(select 1 from public.sanads s where s.id=c.sanad_id and s.issuer_id=c.issuer_id) then
 raise exception 'Sanad issuer mismatch'; end if;
 yr := extract(year from c.completion_date)::integer;
 if yr < 1900 or yr > 2199 then raise exception 'Unsupported completion year'; end if;
 select issuer_code into code from public.issuers where id=c.issuer_id;
 if c.registration_number is not null then
 if c.registration_number !~ '^[0-9]{4}-[0-9]{4}$' or left(c.registration_number,4) <> code||right(yr::text,2) or substring(c.registration_number,6,2)<>c.riwayah_code or right(c.registration_number,2)='00' then raise exception 'Reserved registration mismatch'; end if;
 result := c.registration_number;
 insert into private.registration_counters(issuer_id,completion_year,riwayah_code,last_number) values(c.issuer_id,yr,c.riwayah_code,right(result,2)::smallint)
 on conflict(issuer_id,completion_year,riwayah_code) do update set last_number=greatest(private.registration_counters.last_number,excluded.last_number);
 else
 insert into private.registration_counters(issuer_id,completion_year,riwayah_code,last_number)
 values(c.issuer_id,yr,c.riwayah_code,1)
 on conflict (issuer_id,completion_year,riwayah_code) do update
 set last_number = private.registration_counters.last_number + 1
 where private.registration_counters.last_number < 99 returning last_number into seq;
 if seq is null then raise exception 'Registration sequence exhausted'; end if;
 result := code || right(yr::text,2) || '-' || c.riwayah_code || lpad(seq::text,2,'0');
 end if;
 insert into public.certificate_snapshots(certificate_id,content) values(c.id,snapshot);
 update public.certificates set status='finalized',registration_number=result,
 verification_token=replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','') where id=c.id;
 return result;
end;
$$;

commit;
