begin;

-- Only the exact-match functions may read the frozen public projection.
-- The private definer runs with table-owner privileges, so publication is
-- checked explicitly both when testing register readiness and when looking up a number.
create function private.verify_ijazah_number(p_number text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare certificate jsonb;
begin
 if p_number is null or p_number !~ '^[0-9]{4}-[0-9]{4,21}$' then
  raise exception 'Invalid registration number' using errcode = '22023';
 end if;

 select jsonb_build_object(
  'registration_number', v.registration_number, 'student_name', v.student_name,
  'issuer_name', v.issuer_name, 'qiraah_name', v.qiraah_name,
  'riwayah_name', v.riwayah_name, 'completion_date', v.completion_date
 ) into certificate
 from private.ijazah_verification_index v
 where v.registration_number = p_number and v.published;

 if certificate is not null then
  return jsonb_build_object('status', 'verified', 'certificate', certificate);
 end if;
 if exists (select 1 from private.ijazah_verification_index where published) then
  return jsonb_build_object('status', 'not_found');
 end if;
 return jsonb_build_object('status', 'preparing');
end;
$$;
revoke all on function private.verify_ijazah_number(text) from public;
grant execute on function private.verify_ijazah_number(text) to anon, authenticated;

create or replace function public.verify_ijazah(p_number text) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select private.verify_ijazah_number(p_number);
$$;

revoke select on private.ijazah_verification_index from anon, authenticated;

commit;
