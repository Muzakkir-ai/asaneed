begin;
insert into private.application_backups(purpose,snapshot) values('before account setup invitations',jsonb_build_object('accounts',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.accounts a),'issuers',(select coalesce(jsonb_agg(to_jsonb(i)),'[]') from public.issuers i)));
create table private.account_setup_invitations (
 username text primary key check(username ~ '^[a-z][a-z0-9_]{2,29}$' and username not in ('admin','administrator','system','support')),
 display_name text not null check(length(display_name) between 1 and 120),
 intended_email text, bound_email text,
 target_role text not null check(target_role in ('shaykh','student')),
 can_issue boolean not null default false,
 issuer_id uuid references public.issuers(id) on delete restrict,
 code_hash text not null check(code_hash ~ '^[a-f0-9]{64}$'),
 created_by uuid not null references public.accounts(id),
 created_at timestamptz not null default now(), expires_at timestamptz not null,
 consumed_at timestamptz, consumed_by uuid references public.accounts(id), revoked_at timestamptz,
 check(issuer_id is null or target_role='shaykh'),check(not can_issue or target_role='shaykh')
);
alter table private.account_setup_invitations enable row level security;
revoke all on private.account_setup_invitations from public,anon,authenticated;
create index account_setup_issuer_idx on private.account_setup_invitations(issuer_id);

create function private.assert_setup_server(lookup_key text) returns void language plpgsql security definer set search_path='' as $$
begin
 if lookup_key is null or length(lookup_key)<48 or not exists(select 1 from private.server_login_keys where purpose='username-login' and key_hash=encode(extensions.digest(lookup_key,'sha256'),'hex')) then raise exception 'Application server required' using errcode='42501';end if;
end $$;
revoke all on function private.assert_setup_server(text) from public,anon,authenticated;

create function private.manage_account_setup(action text,record jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid; value text; target public.issuers; prior private.account_setup_invitations; result jsonb;
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501';end if;
 select id into actor from public.accounts where auth_user_id=auth.uid() and active and role='admin';
 if action='list' then
  return coalesce((select jsonb_agg(jsonb_build_object('username',i.username,'name',i.display_name,'issuerId',i.issuer_id,'expiresAt',i.expires_at,'status',case when i.consumed_at is not null then 'used' when i.revoked_at is not null then 'revoked' when i.expires_at<=now() then 'expired' else 'pending' end) order by i.created_at desc) from private.account_setup_invitations i where record->>'issuerId' is null or i.issuer_id=(record->>'issuerId')::uuid),'[]');
 end if;
 value:=lower(btrim(record->>'username'));if value is null or value !~ '^[a-z][a-z0-9_]{2,29}$' or value in ('admin','administrator','system','support') then raise exception 'Invalid username';end if;
 perform pg_advisory_xact_lock(hashtextextended(value,5171613));
 select * into prior from private.account_setup_invitations where username=value for update;
 if action='revoke' then
  if prior.username is null or prior.consumed_at is not null then raise exception 'Pending invitation unavailable';end if;
  update private.account_setup_invitations set revoked_at=now() where username=value;return '{}'::jsonb;
 end if;
 if action<>'create' or coalesce(length(btrim(record->>'name')),0) not between 1 and 120 or coalesce(record->>'role','') not in ('shaykh','student') or coalesce(record->>'codeHash','') !~ '^[a-f0-9]{64}$' then raise exception 'Invalid setup invitation';end if;
 if prior.consumed_at is not null or exists(select 1 from public.accounts where username=value) then raise exception 'Username already belongs to an account';end if;
 if nullif(record->>'email','') is not null and (length(record->>'email')>254 or record->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Invalid email';end if;
 if nullif(record->>'issuerId','') is not null then
  select * into target from public.issuers where id=(record->>'issuerId')::uuid for update;
  if target.id is null or nullif(target.print_profile->>'personalAccount','') is not null or record->>'role'<>'shaykh' then raise exception 'Choose an additional shaykh without an existing login';end if;
  if exists(select 1 from public.issuer_accounts ia join public.accounts a on a.id=ia.account_id where ia.issuer_id=target.id and a.role<>'admin') then raise exception 'This shaykh is already assigned to an account';end if;
  update private.account_setup_invitations set revoked_at=now() where issuer_id=target.id and username<>value and consumed_at is null and revoked_at is null;
 end if;
 insert into private.account_setup_invitations(username,display_name,intended_email,target_role,can_issue,issuer_id,code_hash,created_by,expires_at)
 values(value,btrim(record->>'name'),nullif(lower(btrim(record->>'email')),''),record->>'role',coalesce((record->>'canIssue')::boolean,false),target.id,record->>'codeHash',actor,now()+interval '72 hours')
 on conflict(username) do update set display_name=excluded.display_name,intended_email=excluded.intended_email,bound_email=null,target_role=excluded.target_role,can_issue=excluded.can_issue,issuer_id=excluded.issuer_id,code_hash=excluded.code_hash,created_by=actor,created_at=now(),expires_at=excluded.expires_at,revoked_at=null;
 return jsonb_build_object('username',value,'expiresAt',(select expires_at from private.account_setup_invitations where username=value));
end $$;
revoke all on function private.manage_account_setup(text,jsonb) from public,anon;
grant execute on function private.manage_account_setup(text,jsonb) to authenticated;
create function public.manage_account_setup(action text,record jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select private.manage_account_setup(action,record);$$;
revoke all on function public.manage_account_setup(text,jsonb) from public,anon;
grant execute on function public.manage_account_setup(text,jsonb) to authenticated;

create function private.account_setup_state(login_username text,code_hash text,lookup_key text,email_input text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare invitation private.account_setup_invitations; requested_email text; current_email text; verified boolean;
begin
 perform private.assert_setup_server(lookup_key);
 select * into invitation from private.account_setup_invitations i where i.username=login_username and i.code_hash=account_setup_state.code_hash and i.expires_at>now() and i.revoked_at is null and i.consumed_at is null for update;
 if not found then return null;end if;
 requested_email:=lower(btrim(email_input));
 if email_input is not null then
  if requested_email is null or length(requested_email)>254 or requested_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or (invitation.intended_email is not null and invitation.intended_email<>requested_email) then raise exception 'Use the email approved for this invitation';end if;
  if exists(select 1 from auth.users u join public.accounts a on a.auth_user_id=u.id where lower(u.email)=requested_email and (a.active or a.role<>'student' or a.username is not null or exists(select 1 from private.account_deletions d where d.account_id=a.id))) then raise exception 'This email already has an account; ask the administrator to manage it';end if;
  update private.account_setup_invitations set bound_email=requested_email where username=login_username;
  invitation.bound_email:=requested_email;
 end if;
 select lower(u.email),u.email_confirmed_at is not null into current_email,verified from auth.users u where u.id=auth.uid();
 return jsonb_build_object('username',invitation.username,'name',invitation.display_name,'email',coalesce(invitation.bound_email,invitation.intended_email,''),'emailLocked',invitation.intended_email is not null,'expiresAt',invitation.expires_at,'emailVerified',coalesce(verified and current_email=invitation.bound_email and exists(select 1 from public.accounts a where a.auth_user_id=auth.uid() and not a.active and a.role='student' and a.username is null and not exists(select 1 from private.account_deletions d where d.account_id=a.id)),false));
end $$;
revoke all on function private.account_setup_state(text,text,text,text) from public;
grant execute on function private.account_setup_state(text,text,text,text) to anon,authenticated;
create function public.account_setup_state(login_username text,code_hash text,lookup_key text,email_input text default null) returns jsonb language sql security invoker set search_path='' as $$select private.account_setup_state(login_username,code_hash,lookup_key,email_input);$$;
revoke all on function public.account_setup_state(text,text,text,text) from public;
grant execute on function public.account_setup_state(text,text,text,text) to anon,authenticated;

-- Reserve pending names across every existing username setter, including direct writes.
create function private.reserve_setup_username() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.username is null then return new;end if;
 perform pg_advisory_xact_lock(hashtextextended(new.username,5171613));
 if exists(select 1 from private.account_setup_invitations where username=new.username and consumed_at is null and revoked_at is null and expires_at>now()) then raise exception 'Username is reserved for account setup' using errcode='23505';end if;
 return new;
end $$;
revoke all on function private.reserve_setup_username() from public,anon,authenticated;
create trigger reserve_setup_username before insert or update of username on public.accounts for each row execute function private.reserve_setup_username();

create function private.complete_account_setup(login_username text,code_hash text,lookup_key text) returns uuid language plpgsql security definer set search_path='' as $$
declare invitation private.account_setup_invitations; a public.accounts; email text; verified boolean; has_password boolean; issuer public.issuers; profile jsonb; source public.workspace_records; item jsonb; choice jsonb; record_payload jsonb; code text; prefix text; template public.workspace_records; template_key text; template_map jsonb:='{}'; template_id uuid; introduction_id text; wording_id text;
begin
 perform private.assert_setup_server(lookup_key);
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(login_username,5171613));
 select * into invitation from private.account_setup_invitations i where i.username=login_username and i.code_hash=complete_account_setup.code_hash and i.expires_at>now() and i.revoked_at is null and i.consumed_at is null for update;
 if not found then raise exception 'Setup code is invalid, expired or already used';end if;
 select lower(u.email),u.email_confirmed_at is not null,coalesce(u.encrypted_password,'')<>'' into email,verified,has_password from auth.users u where id=auth.uid();
 if not coalesce(verified,false) or not coalesce(has_password,false) or email is distinct from invitation.bound_email then raise exception 'Verify your email and set your password first';end if;
 select * into a from public.accounts where auth_user_id=auth.uid() for update;
 if a.id is null or a.active or a.role<>'student' or a.username is not null or exists(select 1 from private.account_deletions where account_id=a.id) then raise exception 'This account needs administrator review';end if;
 if invitation.issuer_id is not null then
  select * into issuer from public.issuers where id=invitation.issuer_id for update;
  if issuer.id is null or nullif(issuer.print_profile->>'personalAccount','') is not null or exists(select 1 from public.issuer_accounts ia join public.accounts other on other.id=ia.account_id where ia.issuer_id=issuer.id and other.role<>'admin' and other.id<>a.id) then raise exception 'Shaykh profile already has a login';end if;
 end if;
 insert into private.application_backups(purpose,snapshot) values('before verified account setup',jsonb_build_object('account',to_jsonb(a),'issuer',to_jsonb(issuer)));
 -- Consume inside this transaction before the username reservation trigger runs.
 update private.account_setup_invitations set consumed_at=now(),consumed_by=a.id where username=login_username;
 update public.accounts set username=login_username,display_name=invitation.display_name,role=invitation.target_role,can_issue=invitation.can_issue,active=true where id=a.id;
 if invitation.target_role='shaykh' then
  if issuer.id is null then
   perform pg_advisory_xact_lock(71741001);
   select lpad(n::text,2,'0') into code from generate_series(1,99)n where not exists(select 1 from public.issuers where issuer_code=lpad(n::text,2,'0')) order by n limit 1;
   if code is null then raise exception 'Issuer codes exhausted';end if;
   insert into public.issuers(display_name,issuer_code,print_profile) values(invitation.display_name,code,jsonb_build_object('personalAccount',a.id::text)) returning * into issuer;
  else
   update public.issuers set print_profile=print_profile||jsonb_build_object('personalAccount',a.id::text,'loginLinked',true,'loginLinkedAt',now()) where id=issuer.id;
  end if;
  insert into public.issuer_accounts(issuer_id,account_id) values(issuer.id,a.id) on conflict do nothing;
  profile:=issuer.print_profile;
  insert into public.workspace_records(kind,payload) values('shaykhPrintProfiles',profile||jsonb_build_object('ownerId',a.auth_user_id::text,'printedName',issuer.display_name,'scientificQualification',coalesce(profile->>'scientificQualification',profile->>'qualification',''),'showScientificQualification',true,'showTeachingRole',true,'showMadrasaName',true,'showMadrasaPlace',true));
  select id::text into introduction_id from public.workspace_records where kind='sanadSections' and payload->>'sectionType'='introduction' and coalesce(payload->>'ownerId','')='' order by id limit 1;
  select id::text into wording_id from public.workspace_records where kind='sanadSections' and payload->>'sectionType'='wording' and coalesce(payload->>'ownerId','')='' order by case when payload->>'title'='كلمات الإجازة' then 0 else 1 end,id limit 1;
  -- Independent reviewed holdings for this newly activated identity; preserve all source records/snapshots.
  for source in select * from public.workspace_records where kind='additionalShaykhReadingSanads' and payload->>'shaykhId'=issuer.id::text loop
   record_payload:=source.payload;
   insert into public.workspace_records(kind,payload) values('ijazahHoldings',record_payload||jsonb_build_object('ownerId',a.auth_user_id::text,'introductionId',coalesce(introduction_id,''),'wordingId',coalesce(wording_id,''),'personalChain',coalesce(record_payload->>'sanadText',''),'chainMode',case when coalesce(record_payload->>'tariqNumber','')<>'' then 'complete' else 'junction' end,'shortName',coalesce(nullif(record_payload->>'shortName',''),'السند المحفوظ'),'sourceAdditionalReadingId',source.id));
  end loop;
  for choice in select * from jsonb_array_elements(coalesce(nullif(profile->>'readingsJson',''),'[]')::jsonb) loop
   if not exists(select 1 from public.workspace_records where kind='ijazahHoldings' and payload->>'ownerId'=a.auth_user_id::text and payload->>'qariId'=choice->>'qariId' and payload->>'rawi'=choice->>'rawi' and coalesce(payload->>'tariqNumber','')='') then
    insert into public.workspace_records(kind,payload) values('ijazahHoldings',jsonb_build_object('ownerId',a.auth_user_id::text,'introductionId',coalesce(introduction_id,''),'wordingId',coalesce(wording_id,''),'qariId',choice->>'qariId','rawi',choice->>'rawi','personalChain',coalesce(profile->>'personalChain',''),'junction',coalesce(profile->>'junction','ubaydi'),'chainMode','junction','shortName','السند العام للشيخ','sourceAdditionalShaykhId',issuer.id));
   end if;
  end loop;
  for source in select * from public.workspace_records where kind='additionalShaykhExtensions' and payload->>'shaykhId'=issuer.id::text loop
   for item in select * from jsonb_array_elements(coalesce(nullif(source.payload->>'mutoonJson',''),'[]')::jsonb) loop
    foreach template_key in array array['introductionId','conclusionId'] loop
     if coalesce(item->>template_key,'')<>'' then
      if template_map ? (item->>template_key) then
       item:=jsonb_set(item,array[template_key],template_map->(item->>template_key));
      else
       select * into template from public.workspace_records where kind='mutoonTextTemplates' and id::text=item->>template_key;
       if template.id is not null and coalesce(template.payload->>'ownerId','') not in ('',a.auth_user_id::text) then
        insert into public.workspace_records(kind,payload) values('mutoonTextTemplates',template.payload||jsonb_build_object('ownerId',a.auth_user_id::text,'sourceTemplateId',template.id)) returning id into template_id;
        template_map:=template_map||jsonb_build_object(item->>template_key,template_id::text);
        item:=jsonb_set(item,array[template_key],to_jsonb(template_id::text));
       end if;
      end if;
     end if;
    end loop;
    insert into public.workspace_records(kind,payload) values('mutoonHoldings',(item-'id')||jsonb_build_object('ownerId',a.auth_user_id::text,'sourceAdditionalShaykhId',issuer.id));
   end loop;
  end loop;
 end if;
 return a.id;
end $$;
revoke all on function private.complete_account_setup(text,text,text) from public,anon;
grant execute on function private.complete_account_setup(text,text,text) to authenticated;
create function public.complete_account_setup(login_username text,code_hash text,lookup_key text) returns uuid language sql security invoker set search_path='' as $$select private.complete_account_setup(login_username,code_hash,lookup_key);$$;
revoke all on function public.complete_account_setup(text,text,text) from public,anon;
grant execute on function public.complete_account_setup(text,text,text) to authenticated;
commit;
