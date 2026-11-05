alter table public.builder_people add column if not exists aliases jsonb not null default '[]'::jsonb;
alter table public.builder_people add constraint builder_people_aliases_array check (jsonb_typeof(aliases)='array' and jsonb_array_length(aliases)<=100);
create index if not exists builder_people_aliases_gin on public.builder_people using gin(aliases jsonb_path_ops);
comment on column public.builder_people.aliases is 'Explicitly reviewed alternate spellings for the same saved narrator; [{name,key}].';
