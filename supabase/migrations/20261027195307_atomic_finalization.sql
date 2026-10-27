begin;
-- A single controlled transaction allocates the number and freezes the snapshot.
-- The private definer must check live account authorization before touching data.
create function private.finalize_certificate(target uuid, snapshot jsonb) returns text
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
 insert into private.registration_counters(issuer_id,completion_year,riwayah_code,last_number)
 values(c.issuer_id,yr,c.riwayah_code,1)
 on conflict (issuer_id,completion_year,riwayah_code) do update
 set last_number = private.registration_counters.last_number + 1
 where private.registration_counters.last_number < 99 returning last_number into seq;
 if seq is null then raise exception 'Registration sequence exhausted'; end if;
 result := code || right(yr::text,2) || '-' || c.riwayah_code || lpad(seq::text,2,'0');
 insert into public.certificate_snapshots(certificate_id,content) values(c.id,snapshot);
 update public.certificates set status='finalized',registration_number=result,
 verification_token=replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','') where id=c.id;
 return result;
end;
$$;
revoke all on function private.finalize_certificate(uuid,jsonb) from public,anon;
grant execute on function private.finalize_certificate(uuid,jsonb) to authenticated;
create function public.finalize_certificate(certificate_id uuid, snapshot jsonb) returns text
language sql security invoker set search_path = '' as $$
 select private.finalize_certificate(certificate_id,snapshot);
$$;
revoke all on function public.finalize_certificate(uuid,jsonb) from public,anon;
grant execute on function public.finalize_certificate(uuid,jsonb) to authenticated;
commit;
