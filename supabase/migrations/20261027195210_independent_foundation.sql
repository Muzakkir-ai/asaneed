-- Stage one: independent, deny-by-default application foundation.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.accounts (
 id uuid primary key default gen_random_uuid(),
 auth_user_id uuid unique references auth.users(id) on delete restrict,
 display_name text not null,
 role text not null check (role in ('admin','shaykh','student')),
 active boolean not null default false,
 legacy_auth_id text unique,
 created_at timestamptz not null default now()
);
create table public.issuers (
 id uuid primary key default gen_random_uuid(),
 display_name text not null,
 issuer_code text unique not null check (issuer_code ~ '^[0-9]{2}$' and issuer_code <> '00'),
 legacy_id text unique,
 print_profile jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create table public.issuer_accounts (
 issuer_id uuid not null references public.issuers(id) on delete restrict,
 account_id uuid not null references public.accounts(id) on delete restrict,
 primary key (issuer_id,account_id)
);
create index issuer_accounts_account_idx on public.issuer_accounts(account_id);

-- These helpers intentionally bypass RLS only to read the authorization tables.
-- They are private, have no caller-controlled account ID, and reject missing auth.
create function private.is_staff() returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (
 select 1 from public.accounts where auth_user_id = (select auth.uid()) and active and role in ('admin','shaykh'));
$$;
create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (
 select 1 from public.accounts where auth_user_id = (select auth.uid()) and active and role = 'admin');
$$;
create function private.can_manage_issuer(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (
 select 1 from public.accounts a where a.auth_user_id = (select auth.uid()) and a.active
 and (a.role = 'admin' or (a.role = 'shaykh' and exists (
 select 1 from public.issuer_accounts ia where ia.account_id = a.id and ia.issuer_id = target))));
$$;
revoke all on function private.is_staff(), private.is_admin(), private.can_manage_issuer(uuid) from public, anon;
grant execute on function private.is_staff(), private.is_admin(), private.can_manage_issuer(uuid) to authenticated;

create function public.normalize_arabic(value text) returns text language sql immutable strict parallel safe set search_path = '' as $$
 select lower(regexp_replace(translate(regexp_replace(normalize(value, NFKC), '[ـً-ٰٟۖ-ۭ]', '', 'g'), 'أإآٱى۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', 'ااااي01234567890123456789'), '\s+', ' ', 'g'));
$$;
create table public.students (
 id uuid primary key default gen_random_uuid(),
 display_name text not null check (length(trim(display_name)) > 0),
 search_name text generated always as (public.normalize_arabic(display_name)) stored,
 legacy_id text unique,
 created_at timestamptz not null default now()
);
create index students_search_idx on public.students(search_name);
create table public.qiraat (
 id text primary key,
 display_name text not null,
 legacy_id text unique
);
create table public.riwayat (
 code text primary key check (code ~ '^[0-9]{2}$'),
 qiraah_id text not null references public.qiraat(id),
 display_name text not null
);
create index riwayat_qiraah_idx on public.riwayat(qiraah_id);
create table public.sanads (
 id uuid primary key default gen_random_uuid(),
 issuer_id uuid not null references public.issuers(id),
 qiraah_id text references public.qiraat(id),
 title text not null,
 body jsonb not null default '{}',
 legacy_id text unique
);
create index sanads_issuer_idx on public.sanads(issuer_id);
create index sanads_qiraah_idx on public.sanads(qiraah_id);
create table public.certificates (
 id uuid primary key default gen_random_uuid(),
 issuer_id uuid not null references public.issuers(id),
 student_id uuid not null references public.students(id) on delete restrict,
 sanad_id uuid references public.sanads(id) on delete restrict,
 riwayah_code text not null references public.riwayat(code),
 completion_date date not null,
 status text not null default 'draft' check (status in ('draft','finalized')),
 registration_number text unique check (registration_number ~ '^[0-9]{4}-[0-9]{4}$'),
 verification_token text unique,
 recipient_account_id uuid references public.accounts(id),
 draft jsonb not null default '{}',
 legacy_id text unique,
 created_at timestamptz not null default now(),
 check (status <> 'finalized' or (registration_number is not null and length(verification_token) >= 32))
);
create index certificates_issuer_idx on public.certificates(issuer_id,completion_date desc);
create index certificates_student_idx on public.certificates(student_id);
create index certificates_sanad_idx on public.certificates(sanad_id);
create index certificates_riwayah_idx on public.certificates(riwayah_code);
create index certificates_recipient_idx on public.certificates(recipient_account_id);
create table public.certificate_snapshots (
 certificate_id uuid primary key references public.certificates(id) on delete restrict,
 content jsonb not null,
 created_at timestamptz not null default now()
);
create table private.registration_counters (
 issuer_id uuid not null references public.issuers(id),
 completion_year smallint not null check (completion_year between 1900 and 2199),
 riwayah_code text not null references public.riwayat(code),
 last_number smallint not null check (last_number between 1 and 99),
 primary key (issuer_id, completion_year, riwayah_code)
);
create index registration_counters_riwayah_idx on private.registration_counters(riwayah_code);
create table private.legacy_records (
 source_table text not null,
 source_id text not null,
 payload jsonb not null,
 imported_at timestamptz not null default now(),
 primary key (source_table, source_id)
);
alter table private.registration_counters enable row level security;
alter table private.legacy_records enable row level security;
revoke all on all tables in schema private from public,anon,authenticated;

create function private.protect_final_certificate() returns trigger language plpgsql set search_path = '' as $$
begin
 if old.status = 'finalized' then raise exception 'Finalized certificates are immutable'; end if;
 if tg_op = 'DELETE' then return old; end if;
 if new.status = 'finalized' and not exists(select 1 from public.certificate_snapshots where certificate_id = new.id) then
 raise exception 'A finalized certificate requires a snapshot'; end if;
 return new;
end;
$$;
create trigger protect_final_certificate before update or delete on public.certificates for each row execute function private.protect_final_certificate();
create function private.protect_snapshot() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'Certificate snapshots are immutable'; end;
$$;
create trigger protect_snapshot before update or delete on public.certificate_snapshots for each row execute function private.protect_snapshot();
revoke all on function private.protect_final_certificate(),private.protect_snapshot() from public,anon,authenticated;

alter table public.accounts enable row level security;
alter table public.issuers enable row level security;
alter table public.issuer_accounts enable row level security;
alter table public.students enable row level security;
alter table public.qiraat enable row level security;
alter table public.riwayat enable row level security;
alter table public.sanads enable row level security;
alter table public.certificates enable row level security;
alter table public.certificate_snapshots enable row level security;
revoke all on all tables in schema public from anon,authenticated;
grant select on public.accounts,public.issuers,public.issuer_accounts,public.students,public.qiraat,public.riwayat,public.sanads,public.certificates,public.certificate_snapshots to authenticated;
grant insert,update,delete on public.students,public.sanads to authenticated;
grant insert (issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft) on public.certificates to authenticated;
grant update (student_id,sanad_id,riwayah_code,completion_date,draft) on public.certificates to authenticated;
grant delete on public.certificates to authenticated;

create policy accounts_read on public.accounts for select to authenticated using (auth_user_id = (select auth.uid()) or (select private.is_admin()));
create policy issuers_read on public.issuers for select to authenticated using (private.can_manage_issuer(id));
create policy assignments_read on public.issuer_accounts for select to authenticated using (private.can_manage_issuer(issuer_id));
create policy students_read on public.students for select to authenticated using ((select private.is_staff()));
create policy students_insert on public.students for insert to authenticated with check ((select private.is_staff()));
create policy students_update on public.students for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy students_delete on public.students for delete to authenticated using ((select private.is_admin()));
create policy qiraat_read on public.qiraat for select to authenticated using ((select private.is_staff()));
create policy riwayat_read on public.riwayat for select to authenticated using ((select private.is_staff()));
create policy sanads_read on public.sanads for select to authenticated using (private.can_manage_issuer(issuer_id));
create policy sanads_insert on public.sanads for insert to authenticated with check (private.can_manage_issuer(issuer_id));
create policy sanads_update on public.sanads for update to authenticated using (private.can_manage_issuer(issuer_id)) with check (private.can_manage_issuer(issuer_id));
create policy sanads_delete on public.sanads for delete to authenticated using (private.can_manage_issuer(issuer_id));
create policy certificates_read on public.certificates for select to authenticated using (private.can_manage_issuer(issuer_id) or exists (
 select 1 from public.accounts a where a.id = recipient_account_id and a.auth_user_id = (select auth.uid()) and a.active));
create policy certificates_insert on public.certificates for insert to authenticated with check (status = 'draft' and private.can_manage_issuer(issuer_id));
create policy certificates_update on public.certificates for update to authenticated using (status = 'draft' and private.can_manage_issuer(issuer_id)) with check (status = 'draft' and private.can_manage_issuer(issuer_id));
create policy certificates_delete on public.certificates for delete to authenticated using (status = 'draft' and private.can_manage_issuer(issuer_id));
create policy snapshots_read on public.certificate_snapshots for select to authenticated using (exists(select 1 from public.certificates c where c.id = certificate_id));
insert into public.issuers(id,display_name,issuer_code,legacy_id) values ('64dd31bc-7105-4732-8646-148f27fe7fca','ذَكَاءُ اللهِ رَاغِب بنُ مُحَمَّد سُلَيمَان','01','64dd31bc-7105-4732-8646-148f27fe7fca');
commit;
