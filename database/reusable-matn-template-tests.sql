begin;
do $fixtures$
declare author_id uuid; reader_id uuid; student_id uuid;
begin
 select auth_user_id into author_id from public.accounts where active and role='shaykh' and auth_user_id is not null order by id limit 1;
 select auth_user_id into reader_id from public.accounts where active and role='shaykh' and auth_user_id is not null and auth_user_id<>author_id order by id limit 1;
 select auth_user_id into student_id from public.accounts where active and role='student' and auth_user_id is not null order by id limit 1;
 if author_id is null or reader_id is null or student_id is null then raise exception 'Run with two synthetic issuing accounts and one synthetic student account';end if;
 perform set_config('test.template_author',author_id::text,true);
 perform set_config('test.template_reader',reader_id::text,true);
 perform set_config('test.template_student',student_id::text,true);
end $fixtures$;
select set_config('test.template_public',gen_random_uuid()::text,true),set_config('test.template_private',gen_random_uuid()::text,true),set_config('test.template_draft',gen_random_uuid()::text,true);
insert into public.workspace_records(kind,id,payload)
select 'mutoonTextTemplates',current_setting('test.template_'||v.kind)::uuid,jsonb_build_object('ownerId',current_setting('test.template_author'),'name','Synthetic template permission check','kind','introduction','body','synthetic','reusable',v.reusable,'status',v.status)
from (values ('public',true,'published'),('private',false,'published'),('draft',true,'draft')) v(kind,reusable,status);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.template_reader'),true);
do $$ declare n int; begin
 select count(*) into n from public.workspace_records where kind='mutoonTextTemplates' and id=current_setting('test.template_public')::uuid;
 if n<>1 then raise exception 'Published reusable template is not visible';end if;
 select count(*) into n from public.workspace_records where kind='mutoonTextTemplates' and id in (current_setting('test.template_private')::uuid,current_setting('test.template_draft')::uuid);
 if n<>0 then raise exception 'Private or draft template exposed';end if;
 update public.workspace_records set payload=payload||'{"body":"forbidden"}'::jsonb where kind='mutoonTextTemplates' and id=current_setting('test.template_public')::uuid;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Other issuer modified author template';end if;
 delete from public.workspace_records where kind='mutoonTextTemplates' and id=current_setting('test.template_public')::uuid;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Other issuer deleted author template';end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.template_author'),true);
do $$ declare n int;begin
 update public.workspace_records set payload=payload||'{"body":"author edit"}'::jsonb where kind='mutoonTextTemplates' and id=current_setting('test.template_public')::uuid;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Author cannot edit own template';end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.template_student'),true);
do $$ declare n int;begin
 select count(*) into n from public.workspace_records where kind='mutoonTextTemplates' and id=current_setting('test.template_public')::uuid;
 if n<>0 then raise exception 'Student can read issuing library';end if;
end $$;
rollback;
