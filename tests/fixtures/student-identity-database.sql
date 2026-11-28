\set ON_ERROR_STOP on
create schema auth;
create schema private;
create role anon;
create role authenticated;
create role service_role;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,private,public to authenticated;
create table public.issuers(id uuid primary key);
create table public.students(id uuid primary key,display_name text not null);
create table public.student_accounts(student_id uuid references public.students(id) on delete cascade,account_id uuid not null,primary key(student_id,account_id));
create table public.certificates(id uuid primary key,student_id uuid not null references public.students(id) on delete restrict,issuer_id uuid references public.issuers(id),sanad_id uuid not null,completion_date date not null,status text not null,registration_number text,draft jsonb default '{}');
alter table public.certificates enable row level security;
create policy fixture_read on public.certificates for select to authenticated using(issuer_id='10000000-0000-4000-8000-000000000001');
grant select on public.certificates,public.students,public.issuers to authenticated;
insert into public.issuers values('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002');
insert into public.students values('20000000-0000-4000-8000-000000000001','أَحْمَد'),('20000000-0000-4000-8000-000000000002','احمد'),('20000000-0000-4000-8000-000000000003','Linked'),('20000000-0000-4000-8000-000000000004','Unused');
insert into public.student_accounts values('20000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001');
insert into public.certificates(id,student_id,issuer_id,sanad_id,completion_date,status) values
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','2026-01-01','draft'),
('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','2026-01-02','draft'),
('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','2026-01-03','draft'),
('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','2026-01-04','draft');
create temp table baseline as select md5(string_agg(to_jsonb(c)::text,'' order by id)) h from public.certificates c;
