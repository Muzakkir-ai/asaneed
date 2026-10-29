begin;

lock table public.issuers in share row exclusive mode;
lock table public.certificates in share row exclusive mode;
create temporary table issuer_code_changes(id uuid primary key,new_code text,temporary_code text) on commit drop;
insert into issuer_code_changes values
('b6e2ffe2-a5c5-4a20-881f-c29a495e2bc7','03','96'),
('9d28ba95-2b03-438e-b570-787ea46fceb2','04','97'),
('d5044cff-5782-4117-9ec4-109c2da93050','05','98');
do $$ begin
 if (select count(*) from public.issuers i join issuer_code_changes m on m.id=i.id)<>3 then raise exception 'Expected issuer profiles missing';end if;
 if exists(select 1 from public.issuers i join issuer_code_changes m on i.issuer_code=m.temporary_code) then raise exception 'Temporary code collision'; end if;
end $$;
create temporary table revised_draft_numbers on commit drop as select c.id,c.registration_number as old_number,right(extract(year from c.completion_date)::integer::text,2)||m.new_code||substring(c.registration_number,5) as new_number from public.certificates c join issuer_code_changes m on m.id=c.issuer_id where c.status='draft' and c.registration_number is not null;
do $$ begin
 if exists(select 1 from revised_draft_numbers m join public.certificates c on c.registration_number=m.new_number and not exists(select 1 from revised_draft_numbers own where own.id=c.id)) then raise exception 'Certificate number collision';end if;
end $$;
update private.application_backups set snapshot=snapshot||jsonb_build_object('issuer_code_changes',(select jsonb_agg(to_jsonb(m)) from issuer_code_changes m),'draft_number_changes',(select jsonb_agg(to_jsonb(m)) from revised_draft_numbers m)) where id='95673453-6720-4d11-b72c-a79b400e93a2';
update public.issuers i set issuer_code=m.temporary_code from issuer_code_changes m where m.id=i.id;
update public.issuers i set issuer_code=m.new_code from issuer_code_changes m where m.id=i.id;
update public.certificates c set registration_number=null from revised_draft_numbers m where m.id=c.id;
update public.certificates c set registration_number=m.new_number from revised_draft_numbers m where m.id=c.id;
update private.ijazah_verification_index v set registration_number=m.new_number from revised_draft_numbers m where v.certificate_id=m.id and not v.published;
update public.workspace_records set payload=payload||jsonb_build_object('revision','24ace977e381dad4a473a62b887c316d0a035c11') where kind='assetSources' and payload->>'key'='default' and payload->>'gitHubRepository'='https://github.com/Muzakkir-ai/fonts' and payload->>'branch'='main';
create or replace function private.create_issuer_profile(new_name text, profile jsonb, personal boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare target uuid; code text; actor uuid; last_code integer;
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 select id into actor from public.accounts where auth_user_id=auth.uid() and active;
 perform pg_advisory_xact_lock(71741001);
 if personal then
  select i.id into target from public.issuer_accounts ia join public.issuers i on i.id=ia.issuer_id
  where ia.account_id=actor and i.print_profile->>'personalAccount'=actor::text limit 1;
  if target is not null then return target; end if;
 end if;
 if length(trim(new_name)) not between 1 and 220 then raise exception 'Invalid issuer name'; end if;
 select greatest(5,coalesce(max(issuer_code::integer),0)) into last_code from public.issuers;
 if last_code>=99 then raise exception 'Issuer codes exhausted'; end if;
 code:=lpad((last_code+1)::text,2,'0');
 insert into public.issuers(display_name,issuer_code,print_profile) values(trim(new_name),code,coalesce(profile,'{}')||case when personal then jsonb_build_object('personalAccount',actor) else '{}'::jsonb end) returning id into target;
 insert into public.issuer_accounts values(target,actor);
 return target;
end; $$;

commit;
