-- Additive: no existing holding, sanad, certificate or snapshot is rewritten.
-- Rollback: disable the new navigation/API, export new catalog/request/audit rows,
-- then remove these new objects only after explicit review. Keep legacy workspace records.
alter table public.accounts add column can_issue boolean not null default false;
update public.accounts set can_issue=true where role in ('admin','shaykh');
create function private.issuance_capability_default() returns trigger language plpgsql set search_path='' as $$begin
 if tg_op='INSERT' then new.can_issue:=new.role='shaykh';
 elsif new.role is distinct from old.role then if new.role='student' then new.can_issue:=false;elsif new.role='shaykh' then new.can_issue:=true;end if;end if;return new;end;$$;
create trigger issuance_capability_default before insert or update of role on public.accounts for each row execute function private.issuance_capability_default();
create function private.matn_key(value text) returns text language sql immutable set search_path='' as $$select trim(regexp_replace(lower(translate(regexp_replace(normalize(value,NFKC),'[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]','','g'),'أإآٱى٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','ااااي01234567890123456789')),'\s+',' ','g'));$$;
create table public.matn_catalog(
 id uuid primary key default gen_random_uuid(),title text not null check(length(trim(title)) between 2 and 200),
 title_key text generated always as (private.matn_key(title)) stored,category text not null check(category in ('التجويد','القراءات','الحديث','الفقه','العقيدة','اللغة العربية','أخرى')),
 author text not null default '' check(length(author)<=250),description text not null default '' check(length(description)<=5000),
 artwork_number text not null default '' check(artwork_number='' or artwork_number ~ '^[0-9]{2,4}$'),
 heading jsonb,template_ids uuid[] not null default '{}',status text not null default 'draft' check(status in ('draft','published')),
 created_by uuid not null references public.accounts(id),updated_by uuid not null references public.accounts(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index matn_catalog_title_key on public.matn_catalog(title_key);
create index matn_catalog_browse on public.matn_catalog(status,category,title);
create table public.matn_requests(
 id uuid primary key default gen_random_uuid(),account_id uuid not null references public.accounts(id),title text not null check(length(trim(title)) between 2 and 200),title_key text generated always as (private.matn_key(title)) stored,
 category text not null check(category in ('التجويد','القراءات','الحديث','الفقه','العقيدة','اللغة العربية','أخرى')),author text not null default '' check(length(author)<=250),reference text not null default '' check(length(reference)<=2000),notes text not null default '' check(length(notes)<=5000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),catalog_id uuid references public.matn_catalog(id),decision_by uuid references public.accounts(id),decision_at timestamptz,explanation text not null default '',seen_at timestamptz,created_at timestamptz not null default now(),
 check((status='pending' and decision_by is null and decision_at is null and catalog_id is null) or(status='approved' and decision_by is not null and decision_at is not null and catalog_id is not null) or(status='rejected' and decision_by is not null and decision_at is not null and length(trim(explanation))>0)));
create unique index matn_requests_active on public.matn_requests(account_id,title_key) where status='pending';
create index matn_requests_queue on public.matn_requests(status,created_at);
create table public.content_audit(id uuid primary key default gen_random_uuid(),actor_id uuid not null references public.accounts(id),action text not null,target_id uuid not null,before_data jsonb,after_data jsonb,created_at timestamptz not null default now());
alter table public.matn_catalog enable row level security;
alter table public.matn_requests enable row level security;
alter table public.content_audit enable row level security;
create policy matn_catalog_read on public.matn_catalog for select to authenticated using(private.is_admin() or(status='published' and private.is_staff()));
create policy matn_requests_read on public.matn_requests for select to authenticated using(private.is_admin() or exists(select 1 from public.accounts a where a.id=account_id and a.auth_user_id=(select auth.uid()) and a.active));
create policy content_audit_read on public.content_audit for select to authenticated using(private.is_admin());
revoke all on public.matn_catalog,public.matn_requests,public.content_audit from anon,authenticated;
grant select on public.matn_catalog,public.matn_requests,public.content_audit to authenticated;
-- Shared drafts are not exposed through direct workspace-record reads either.
create policy shared_template_visibility on public.workspace_records as restrictive for select to authenticated using(kind<>'mutoonTextTemplates' or coalesce(payload->>'ownerId','')<>'' or coalesce(payload->>'status','published')='published' or private.is_admin());
create function public.save_matn_catalog(entry jsonb,allow_distinct boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; target uuid; prior jsonb; normalized text;
begin
 select id into actor from public.accounts where auth_user_id=(select auth.uid()) and active and role='admin';if actor is null then raise exception 'Administrator required';end if;
 target:=nullif(entry->>'id','')::uuid;normalized:=private.matn_key(trim(entry->>'title'));perform pg_advisory_xact_lock(hashtextextended(normalized,0));
 if not allow_distinct and exists(select 1 from public.matn_catalog where title_key=normalized and id is distinct from target) then raise exception 'Possible duplicate matn: select an existing work or explicitly confirm a distinct work';end if;
 if target is not null then select to_jsonb(m) into prior from public.matn_catalog m where id=target for update;if prior is null then raise exception 'Matn unavailable';end if;end if;
 if entry->'heading' is not null and entry->'heading'<>'null'::jsonb and not coalesce((jsonb_typeof(entry->'heading')='object' and (entry->'heading'->>'version')::int=1 and (entry->'heading'->>'mainHeightPt')::numeric between 5 and 150 and (entry->'heading'->>'secondaryHeightPt')::numeric between 1 and 120 and (entry->'heading'->>'lineGapMm')::numeric between 0 and 15 and (entry->'heading'->>'afterGapMm')::numeric between 0 and 20),false) then raise exception 'Invalid heading settings';end if;
 if exists(select 1 from jsonb_array_elements_text(coalesce(entry->'template_ids','[]')) t(id) where not exists(select 1 from public.workspace_records w where w.kind='mutoonTextTemplates' and w.id=t.id::uuid and coalesce(w.payload->>'ownerId','')='' and coalesce(w.payload->>'status','published')='published')) then raise exception 'Select approved shared templates';end if;
 if target is null then insert into public.matn_catalog(title,category,author,description,artwork_number,heading,template_ids,status,created_by,updated_by) values(trim(entry->>'title'),entry->>'category',coalesce(entry->>'author',''),coalesce(entry->>'description',''),coalesce(entry->>'artwork_number',''),nullif(entry->'heading','null'::jsonb),array(select jsonb_array_elements_text(coalesce(entry->'template_ids','[]'))::uuid),coalesce(entry->>'status','draft'),actor,actor) returning id into target;
 else update public.matn_catalog set title=trim(entry->>'title'),category=entry->>'category',author=coalesce(entry->>'author',''),description=coalesce(entry->>'description',''),artwork_number=coalesce(entry->>'artwork_number',''),heading=nullif(entry->'heading','null'::jsonb),template_ids=array(select jsonb_array_elements_text(coalesce(entry->'template_ids','[]'))::uuid),status=coalesce(entry->>'status','draft'),updated_by=actor,updated_at=now() where id=target;end if;
 insert into public.content_audit(actor_id,action,target_id,before_data,after_data) select actor,'save_matn',target,prior,to_jsonb(m) from public.matn_catalog m where id=target;return target;
end;$$;
create function public.submit_matn_request(entry jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; target uuid;begin
 select id into actor from public.accounts where auth_user_id=(select auth.uid()) and active and (can_issue or role='admin');if actor is null then raise exception 'Staff required';end if;
 insert into public.matn_requests(account_id,title,category,author,reference,notes) values(actor,trim(entry->>'title'),entry->>'category',coalesce(entry->>'author',''),coalesce(entry->>'reference',''),coalesce(entry->>'notes','')) returning id into target;return target;end;$$;
create function public.review_matn_request(request_id uuid,decision text,existing_matn uuid default null,entry jsonb default null,explanation text default '',allow_distinct boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; item public.matn_requests; target uuid;begin
 select id into actor from public.accounts where auth_user_id=(select auth.uid()) and active and role='admin';if actor is null then raise exception 'Administrator required';end if;
 select * into item from public.matn_requests where id=request_id for update;if not found or item.status<>'pending' then raise exception 'Pending request required';end if;
 if decision='approved' then
  if existing_matn is not null then select id into target from public.matn_catalog where id=existing_matn and status='published';if target is null then raise exception 'Published matn required';end if;
  else target:=public.save_matn_catalog(coalesce(entry,jsonb_build_object('title',item.title,'category',item.category,'author',item.author))||jsonb_build_object('status','published','id',null),allow_distinct);end if;
 elsif decision<>'rejected' or length(trim(explanation))=0 then raise exception 'Rejection explanation required';end if;
 update public.matn_requests set status=decision,catalog_id=target,decision_by=actor,decision_at=now(),explanation=review_matn_request.explanation,seen_at=null where id=request_id;
 insert into public.content_audit(actor_id,action,target_id,before_data,after_data) select actor,'review_matn_request',request_id,to_jsonb(item),to_jsonb(r) from public.matn_requests r where id=request_id;return target;end;$$;
create function public.acknowledge_matn_decision(request_id uuid) returns void language sql security definer set search_path='' as $$update public.matn_requests set seen_at=now() where id=request_id and status<>'pending' and exists(select 1 from public.accounts a where a.id=account_id and a.auth_user_id=(select auth.uid()) and a.active);$$;
create function public.set_issuance_capability(target_account uuid,enabled boolean) returns void language plpgsql security definer set search_path='' as $$declare actor uuid;begin select id into actor from public.accounts where auth_user_id=(select auth.uid()) and active and role='admin';if actor is null then raise exception 'Administrator required';end if;
 if not exists(select 1 from public.accounts where id=target_account and role in ('admin','shaykh')) then raise exception 'Staff account required';end if;
 update public.accounts set can_issue=enabled where id=target_account;insert into public.content_audit(actor_id,action,target_id,after_data) values(actor,'issuance_capability',target_account,jsonb_build_object('enabled',enabled));end;$$;
revoke all on function public.save_matn_catalog(jsonb,boolean),public.submit_matn_request(jsonb),public.review_matn_request(uuid,text,uuid,jsonb,text,boolean),public.acknowledge_matn_decision(uuid),public.set_issuance_capability(uuid,boolean) from public,anon;
grant execute on function public.save_matn_catalog(jsonb,boolean),public.submit_matn_request(jsonb),public.review_matn_request(uuid,text,uuid,jsonb,text,boolean),public.acknowledge_matn_decision(uuid),public.set_issuance_capability(uuid,boolean) to authenticated;
-- Existing certificate permissions stay scoped to assigned issuers, with a separate
-- issuing capability. Administrator-only content work must not imply issuance.
create function private.issuance_allowed() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.accounts where auth_user_id=(select auth.uid()) and active and can_issue);$$;
revoke all on function private.issuance_allowed() from public,anon;
grant execute on function private.issuance_allowed() to authenticated;
create policy certificate_issuing_insert on public.certificates as restrictive for insert to authenticated with check(private.issuance_allowed());
create policy certificate_issuing_update on public.certificates as restrictive for update to authenticated using(private.issuance_allowed()) with check(private.issuance_allowed());
insert into private.application_backups(purpose,snapshot) select 'Before unified matn management',jsonb_build_object('finalize_function',pg_get_functiondef('private.finalize_certificate(uuid,jsonb)'::regprocedure),'backup_function',pg_get_functiondef('private.full_application_backup()'::regprocedure),'restore_function',pg_get_functiondef('private.restore_application_backup(jsonb,boolean)'::regprocedure));
do $$declare definition text;begin
 definition:=pg_get_functiondef('private.finalize_certificate(uuid,jsonb)'::regprocedure);
 if position('if auth.uid() is null then' in definition)=0 then raise exception 'Unexpected finalize definition';end if;
 definition:=replace(definition,'if auth.uid() is null then','if not private.issuance_allowed() then raise exception ''Issuing capability required'' using errcode=''42501'';end if; if auth.uid() is null then');execute definition;
 definition:=pg_get_functiondef('private.full_application_backup()'::regprocedure);
 if position('return jsonb_build_object(' in definition)=0 then raise exception 'Unexpected backup definition';end if;
 definition:=replace(definition,'return jsonb_build_object(', 'return jsonb_build_object(''matn_catalog'',coalesce((select jsonb_agg(to_jsonb(t)) from public.matn_catalog t),''[]''),''matn_requests'',coalesce((select jsonb_agg(to_jsonb(t)) from public.matn_requests t),''[]''),''content_audit'',coalesce((select jsonb_agg(to_jsonb(t)) from public.content_audit t),''[]''))||jsonb_build_object(');execute definition;
 definition:=pg_get_functiondef('private.restore_application_backup(jsonb,boolean)'::regprocedure);
 -- Supply the additive capability when restoring an older-format backup.
 definition:=replace(definition,'begin','begin if data ? ''accounts'' then data:=jsonb_set(data,''{accounts}'',(select coalesce(jsonb_agg(case when a ? ''can_issue'' then a else a||jsonb_build_object(''can_issue'',a->>''role'' in (''admin'',''shaykh'')) end),''[]'') from jsonb_array_elements(data->''accounts'') a));end if;');
 if position('return jsonb_build_object(''success''' in definition)=0 then raise exception 'Unexpected restore definition';end if;
 definition:=replace(definition,'return jsonb_build_object(''success''','if data ? ''matn_catalog'' then insert into public.matn_catalog select * from jsonb_populate_recordset(null::public.matn_catalog,data->''matn_catalog'') on conflict(id) do nothing;end if; if data ? ''matn_requests'' then insert into public.matn_requests select * from jsonb_populate_recordset(null::public.matn_requests,data->''matn_requests'') on conflict(id) do nothing;end if; if data ? ''content_audit'' then insert into public.content_audit select * from jsonb_populate_recordset(null::public.content_audit,data->''content_audit'') on conflict(id) do nothing;end if;return jsonb_build_object(''success''');execute definition;
end;$$;

create unique index personal_matn_catalog_once on public.workspace_records((payload->>'ownerId'),(payload->>'catalogId')) where kind='mutoonHoldings' and payload ? 'catalogId';
