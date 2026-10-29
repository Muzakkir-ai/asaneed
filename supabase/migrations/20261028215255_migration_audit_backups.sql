begin;
create table private.application_backups(id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now(),purpose text not null,snapshot jsonb not null);
alter table private.application_backups enable row level security;
revoke all on private.application_backups from public,anon,authenticated;
commit;
