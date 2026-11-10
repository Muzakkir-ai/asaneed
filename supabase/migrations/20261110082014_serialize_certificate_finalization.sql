begin;

create or replace function private.finalize_certificate(target uuid, snapshot jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
 c public.certificates%rowtype;
 result text;
 token text;
begin
 if not private.issuance_allowed() then
  raise exception 'Issuing capability required' using errcode = '42501';
 end if;

 -- Reservation takes the issuer advisory lock before locking draft rows.
 -- Use the same order for finalization, including simultaneous approvals.
 result := private.reserve_certificate_number(target);
 select * into c from public.certificates where id = target for update;
 if not found or not private.can_manage_issuer(c.issuer_id) then
  raise exception 'Issuer access required' using errcode = '42501';
 end if;
 if c.status = 'finalized' then return c.registration_number; end if;
 if c.status <> 'draft' then raise exception 'Certificate is not a draft'; end if;

 if jsonb_typeof(snapshot) <> 'object' or snapshot is null or snapshot = '{}'::jsonb then
  raise exception 'Snapshot required';
 end if;
 if c.sanad_id is not null and not exists(
  select 1 from public.sanads s where s.id = c.sanad_id and s.issuer_id = c.issuer_id
 ) then raise exception 'Sanad issuer mismatch'; end if;

 token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
 if snapshot ? 'formatting' then
  snapshot := jsonb_set(snapshot, '{formatting}', to_jsonb(
   ((snapshot->>'formatting')::jsonb ||
    jsonb_build_object('verificationToken', token, 'registrationNumber', result))::text
  ));
 end if;
 snapshot := jsonb_set(snapshot, '{issuedAt}', to_jsonb(now()::text));
 insert into public.certificate_snapshots(certificate_id, content) values (c.id, snapshot);
 update public.certificates set status = 'finalized', registration_number = result,
  verification_token = token where id = c.id;
 return result;
end;
$$;

commit;
