-- Additive structure only. No existing CHAIN, holding, sanad or snapshot is rewritten.
begin;
insert into private.application_backups(purpose,snapshot)
values ('before unified sanad continuations',jsonb_build_object('save_builder_chain',pg_get_functiondef('public.save_builder_chain(jsonb)'::regprocedure)));
alter table public.builder_chains add column continuation_ids uuid[];
alter table public.builder_chains add column continuation_override boolean default false;

create function private.sanad_utf16_selection(value text,first_offset integer,last_offset integer) returns text language plpgsql immutable set search_path='' as $fn$
declare pos integer:=0; c text; width integer; result text:=''; boundaries integer:=0;
begin
 if first_offset<0 or last_offset<=first_offset then raise exception 'Invalid selection';end if;
 for i in 1..length(value) loop
 c:=substr(value,i,1);width:=case when ascii(c)>65535 then 2 else 1 end;
 if pos=first_offset then boundaries:=boundaries+1;end if;
 if pos>=first_offset and pos<last_offset then result:=result||c;end if;
 pos:=pos+width;
 if pos=last_offset then boundaries:=boundaries+1;end if;
 end loop;
 if boundaries<>2 then raise exception 'Invalid UTF16 selection boundary';end if;
 return result;
end $fn$;
revoke all on function private.sanad_utf16_selection(text,integer,integer) from public,anon,authenticated;

-- The shared relationship library is administered centrally; attachment remains available to issuers.
do $block$ declare t text; begin
 foreach t in array array['builder_people','builder_books','builder_chains','builder_nodes'] loop
 execute format('create policy unified_admin_insert on public.%I as restrictive for insert to authenticated with check ((select private.is_admin()))',t);
 execute format('create policy unified_admin_update on public.%I as restrictive for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',t);
 execute format('create policy unified_admin_delete on public.%I as restrictive for delete to authenticated using ((select private.is_admin()))',t);
 end loop;
end $block$;
create policy unified_library_read on public.builder_people for select to authenticated using ((select private.is_staff()));
create policy unified_library_read on public.builder_books for select to authenticated using ((select private.is_staff()));
create policy unified_library_read on public.builder_chains for select to authenticated using ((select private.is_staff()) and (kind='book' or confirmed));
create policy unified_library_read on public.builder_nodes for select to authenticated using ((select private.is_staff()) and exists(select 1 from public.builder_chains c where c.id=builder_nodes.chain_id and (c.kind='book' or c.confirmed)));

create function private.save_sanad_continuation(record jsonb) returns uuid language plpgsql security definer set search_path='' as $fn$
declare actor uuid; target uuid; prior jsonb; source jsonb; metadata jsonb; body text; v_kind text;
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Administrator required'; end if;
 select id into actor from public.accounts where auth_user_id=auth.uid() and active and role='admin';
 v_kind:=record->>'kind';body:=record->>'body';
 if coalesce(v_kind,'') not in ('rawi','qari','prophet') or coalesce(length(body),0) not between 1 and 30000 or coalesce(length(record->>'title'),0) not between 2 and 250 or coalesce(record->>'status','') not in ('draft','approved') or coalesce(record->>'qariId','')='' then raise exception 'Invalid continuation';end if;
 if v_kind='rawi' and coalesce(record->>'rawi','')='' then raise exception 'Rawi required';end if;
 if record ? 'source' then
 select payload into source from public.workspace_records where kind='sanadSections' and id=(record->'source'->>'id')::uuid and coalesce(payload->>'ownerId','')='' for share;
 if source is null or record->>'sourceBody' is distinct from source->>'body' then raise exception 'Source changed; review again';end if;
 if private.sanad_utf16_selection(source->>'body',(record->'source'->>'start')::int,(record->'source'->>'end')::int) is distinct from body then raise exception 'Selection does not match source';end if;
 end if;
 target:=coalesce(nullif(record->>'id','')::uuid,gen_random_uuid());
 select payload into prior from public.workspace_records where kind='sanadSections' and id=target for update;
 if prior is not null and (coalesce(prior->>'ownerId','')<>'' or prior->'continuation' is null) then raise exception 'Original reference sections cannot be overwritten';end if;
 metadata:=jsonb_build_object('version',1,'kind',v_kind,'qariId',record->>'qariId','rawi',record->>'rawi','variant',coalesce(record->>'variant',''),'status',record->>'status','reviewedBy',case when record->>'status'='approved' then actor::text end,'reviewedAt',case when record->>'status'='approved' then now() end);
 insert into public.workspace_records(kind,id,payload) values('sanadSections',target,jsonb_build_object('title',record->>'title','body',body,'sectionType','narrator','ownerId','','formatting',(record->'formatting')::text,'continuation',metadata,'sourceSelection',record->'source','sourceBody',record->>'sourceBody')) on conflict(kind,id) do update set payload=excluded.payload;
 insert into public.content_audit(actor_id,action,target_id,before_data,after_data) values(actor,'save_continuation',target,prior,jsonb_build_object('metadata',metadata,'body',body));
 return target;
end $fn$;
revoke all on function private.save_sanad_continuation(jsonb) from public,anon;
grant execute on function private.save_sanad_continuation(jsonb) to authenticated;
create function public.save_sanad_continuation(record jsonb) returns uuid language sql security invoker set search_path='' as 'select private.save_sanad_continuation(record)';
revoke all on function public.save_sanad_continuation(jsonb) from public,anon;
grant execute on function public.save_sanad_continuation(jsonb) to authenticated;

create function private.review_sanad_consolidation(record jsonb) returns uuid language plpgsql security definer set search_path='' as $fn$
declare actor uuid; route public.builder_chains; parent public.builder_chains; s jsonb; saved jsonb; target uuid; prior jsonb;
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Administrator required';end if;
 select id into actor from public.accounts where auth_user_id=auth.uid() and active and role='admin';
 select * into route from public.builder_chains where id=(record->>'routeId')::uuid and kind='route' and not archived for share;
 select * into parent from public.builder_chains where id=route.book_chain_id and not archived for share;
 if route.id is null or parent.id is null or route.revision is distinct from (record->>'revision')::int or parent.id is distinct from (record->>'parentId')::uuid or parent.revision is distinct from (record->>'parentRevision')::int then raise exception 'Builder changed; review again';end if;
 if jsonb_array_length(record->'sources') not between 1 and 20 or length(coalesce(record->>'note',''))<5 then raise exception 'Review evidence required';end if;
 for s in select value from jsonb_array_elements(record->'sources') loop
 select payload into saved from public.workspace_records where kind='sanadSections' and id=(s->>'id')::uuid and coalesce(payload->>'ownerId','')='' for share;
 if saved is null or saved->>'body' is distinct from s->>'body' then raise exception 'Source changed; review again';end if;
 end loop;
 perform pg_advisory_xact_lock(hashtextextended('sanad-review:'||route.id::text,0));
 select id,payload into target,prior from public.workspace_records where kind='sanadSections' and payload->>'title'='REVIEW:'||route.id::text for update;
 target:=coalesce(target,gen_random_uuid());
 insert into public.workspace_records(kind,id,payload) values('sanadSections',target,jsonb_build_object('title','REVIEW:'||route.id::text,'body','','sectionType','route','ownerId','','consolidation',record||jsonb_build_object('status','approved','reviewedBy',actor,'reviewedAt',now()))) on conflict(kind,id) do update set payload=excluded.payload;
 insert into public.content_audit(actor_id,action,target_id,before_data,after_data) values(actor,'review_consolidation',route.id,prior,record);
 return target;
end $fn$;
revoke all on function private.review_sanad_consolidation(jsonb) from public,anon;
grant execute on function private.review_sanad_consolidation(jsonb) to authenticated;
create function public.review_sanad_consolidation(record jsonb) returns uuid language sql security invoker set search_path='' as 'select private.review_sanad_consolidation(record)';
revoke all on function public.review_sanad_consolidation(jsonb) from public,anon;
grant execute on function public.review_sanad_consolidation(jsonb) to authenticated;

-- Preserve the original tested builder save procedure and its revision/identity checks.
alter function public.save_builder_chain(jsonb) set schema private;
revoke all on function private.save_builder_chain(jsonb) from public,anon;
grant execute on function private.save_builder_chain(jsonb) to authenticated;
create function public.save_builder_chain(record jsonb) returns uuid language plpgsql security invoker set search_path='' as $fn$
declare target uuid; ids uuid[]; s record; kinds text[]:='{}';
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Administrator required';end if;
 if record->>'kind'='route' then
 if record->'continuation_ids' is not null and record->'continuation_ids'<>'null'::jsonb then
 select array_agg(value::uuid) into ids from jsonb_array_elements_text(record->'continuation_ids');
 if cardinality(ids)<>3 or (select count(distinct id) from unnest(ids) id)<>3 then raise exception 'Select three continuation segments';end if;
 for s in select id,payload from public.workspace_records where kind='sanadSections' and id=any(ids) for share loop
 if coalesce(s.payload->>'ownerId','')<>'' or s.payload->'continuation'->>'status' is distinct from 'approved' or s.payload->'continuation'->>'qariId' is distinct from record->>'qari_id' or (s.payload->'continuation'->>'kind'='rawi' and s.payload->'continuation'->>'rawi' is distinct from record->>'rawi') then raise exception 'Continuation unavailable';end if;
 kinds:=array_append(kinds,s.payload->'continuation'->>'kind');
 end loop;
 if not (kinds @> array['rawi','qari','prophet'] and cardinality(kinds)=3) then raise exception 'Incomplete continuation';end if;
 elsif coalesce((record->>'confirmed')::boolean,false) and (not coalesce((record->>'continuation_override')::boolean,false) or length(coalesce(record->>'continuation',''))<80) then raise exception 'Approved continuation or reviewed override required';end if;
 end if;
 target:=private.save_builder_chain(record||jsonb_build_object('confirmed',false));
 update public.builder_chains set continuation_ids=ids,continuation_override=coalesce((record->>'continuation_override')::boolean,false),confirmed=coalesce((record->>'confirmed')::boolean,false) where id=target;
 return target;
end $fn$;
revoke all on function public.save_builder_chain(jsonb) from public,anon;
grant execute on function public.save_builder_chain(jsonb) to authenticated;

create function private.assert_builder_continuation(route public.builder_chains) returns void language plpgsql security invoker set search_path='' as $fn$
declare kinds text[]; n integer;
begin
 if route.continuation_ids is null then return;end if;
 select array_agg(payload->'continuation'->>'kind'),count(*) into kinds,n from public.workspace_records where kind='sanadSections' and id=any(route.continuation_ids) and coalesce(payload->>'ownerId','')='' and payload->'continuation'->>'status'='approved' and payload->'continuation'->>'qariId'=route.qari_id and (payload->'continuation'->>'kind'<>'rawi' or payload->'continuation'->>'rawi'=route.rawi);
 if cardinality(route.continuation_ids)<>3 or n<>3 or not kinds @> array['rawi','qari','prophet'] then raise exception 'Approved continuation unavailable';end if;
end $fn$;
revoke all on function private.assert_builder_continuation(public.builder_chains) from public,anon;
grant execute on function private.assert_builder_continuation(public.builder_chains) to authenticated;
create function private.validate_unified_builder() returns trigger language plpgsql security invoker set search_path='' as $fn$
begin
 if new.kind='route' and new.confirmed and not new.archived then
 if new.continuation_ids is null and (not coalesce(new.continuation_override,false) or length(new.continuation)<80) then raise exception 'Approved continuation or reviewed override required';end if;
 perform private.assert_builder_continuation(new);
 end if;
 return new;
end $fn$;
create trigger unified_builder_validation before insert or update on public.builder_chains for each row execute function private.validate_unified_builder();

-- Retain attachment ownership/issuer guards and add referenced continuation validation.
do $patch$ declare source text; patched text; begin
 if to_regprocedure('public.attach_builder_route(uuid,jsonb,uuid)') is not null then
 source:=pg_get_functiondef('public.attach_builder_route(uuid,jsonb,uuid)'::regprocedure);
 insert into private.application_backups(purpose,snapshot) values('before unified sanad attachment',jsonb_build_object('attach_builder_route',source));
 if position('Reviewed route unavailable' in source)=0 or position('owner:=holding' in source)=0 then raise exception 'Attachment function changed; review migration';end if;
 source:=replace(source,'owner:=holding','perform private.assert_builder_continuation(route); owner:=holding');
 patched:=replace(source,'''builderRouteId'',route.id)', '''builderRouteId'',route.id,''unifiedSanad'',holding->''unifiedSanad'')');
 if patched=source then raise exception 'Attachment payload changed; review migration';end if;
 execute patched;
 end if;
end $patch$;

create policy shared_continuation_visibility on public.workspace_records as restrictive for select to authenticated using (
 kind<>'sanadSections' or private.is_admin() or (
 not (payload ? 'consolidation') and (not (payload ? 'continuation') or payload->'continuation'->>'status'='approved')
 ));

-- Old backups predate reference fields. Preserve their complete continuation as
-- an explicit legacy override on restore, without approving a central segment.
do $restore$ declare source text; patched text; begin
 source:=pg_get_functiondef('private.restore_application_backup(jsonb,boolean)'::regprocedure);
 insert into private.application_backups(purpose,snapshot) values('before unified sanad restore compatibility',jsonb_build_object('restore_application_backup',source));
 patched:=regexp_replace(source,'\mbegin\M',$replacement$begin
 if data ? 'builder_chains' then
 data:=jsonb_set(data,'{builder_chains}',coalesce((select jsonb_agg(x||jsonb_build_object('continuation_ids',coalesce(x->'continuation_ids','null'::jsonb),'continuation_override',case when x ? 'continuation_override' then x->'continuation_override' else to_jsonb(coalesce(x->>'kind','')='route' and coalesce((x->>'confirmed')::boolean,false)) end)) from jsonb_array_elements(data->'builder_chains') x),'[]'::jsonb));
 end if;
 $replacement$,'i');
 if patched=source then raise exception 'Restore function changed; review migration';end if;
 execute patched;
end $restore$;
commit;
