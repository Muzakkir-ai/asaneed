begin;

create table private.verification_lookup_capability (
 singleton boolean primary key default true check (singleton),
 secret_hash bytea not null check (octet_length(secret_hash) = 32)
);
create table private.verification_lookup_budget (
 minute bigint not null,
 client_key text not null,
 attempts integer not null check (attempts >= 0),
 primary key (minute, client_key)
);
alter table private.verification_lookup_capability enable row level security;
alter table private.verification_lookup_budget enable row level security;
revoke all on private.verification_lookup_capability, private.verification_lookup_budget
 from public, anon, authenticated, service_role;

create function private.guard_certificate_number_lookup(
 p_number text, p_client_key text, p_capability text
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
 window_minute bigint := floor(extract(epoch from transaction_timestamp()) / 60)::bigint;
 total integer;
 accepted integer;
begin
 if p_capability is null or p_capability !~ '^[a-f0-9]{64}$' or not exists (
  select 1 from private.verification_lookup_capability
  where secret_hash = sha256(convert_to(p_capability, 'UTF8'))
 ) then
  raise exception 'Number lookup denied' using errcode = '42501';
 end if;
 if p_client_key is null or p_client_key !~ '^[a-f0-9]{64}$'
    or p_number is null or p_number !~ '^[0-9]{4}-[0-9]{4,21}$' then
  raise exception 'Invalid lookup input' using errcode = '22023';
 end if;

 -- Serialize admission across application instances. Client denials do not spend the shared budget.
 insert into private.verification_lookup_budget values (window_minute, 'global', 0)
 on conflict do nothing;
 select attempts into strict total from private.verification_lookup_budget
 where minute = window_minute and client_key = 'global' for update;
 if total >= 60 then
  return jsonb_build_object('status', 'rate_limited');
 end if;

 insert into private.verification_lookup_budget as budget values (window_minute, p_client_key, 1)
 on conflict (minute, client_key) do update set attempts = budget.attempts + 1
 where budget.attempts < 10 returning attempts into accepted;
 if accepted is null then
  return jsonb_build_object('status', 'rate_limited');
 end if;

 update private.verification_lookup_budget set attempts = attempts + 1
 where minute = window_minute and client_key = 'global';
 return private.verify_ijazah_number(p_number);
end;
$$;

revoke all on function private.guard_certificate_number_lookup(text,text,text)
 from public, anon, authenticated, service_role;
grant execute on function private.guard_certificate_number_lookup(text,text,text) to anon;

create function public.lookup_certificate_number(
 p_number text, p_client_key text, p_capability text
) returns jsonb language sql volatile security invoker set search_path = '' as $$
 select private.guard_certificate_number_lookup(p_number, p_client_key, p_capability);
$$;
revoke all on function public.lookup_certificate_number(text,text,text)
 from public, anon, authenticated, service_role;
grant execute on function public.lookup_certificate_number(text,text,text) to anon;

revoke all on function public.verify_ijazah(text), private.verify_ijazah_number(text)
 from public, anon, authenticated, service_role;

commit;
