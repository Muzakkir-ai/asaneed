-- Transaction-only fixture: no users remain after this test.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('cce0ba10-0000-4000-8000-000000000001','auth-test@example.invalid','{"display_name":"Auth test","role":"admin","active":true}');
do $$ begin
 if not exists(select 1 from public.accounts where auth_user_id='cce0ba10-0000-4000-8000-000000000001' and role='student' and active=false and display_name='Auth test') then raise exception 'Pending account invariant failed'; end if;
 if has_table_privilege('authenticated','public.accounts','UPDATE') then raise exception 'Account update privilege leaked'; end if;
 if has_function_privilege('authenticated','private.create_pending_account()','EXECUTE') then raise exception 'Trigger execute privilege leaked'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','cce0ba10-0000-4000-8000-000000000001',true);
do $$ begin
 if (select count(*) from public.accounts)<>1 then raise exception 'Account self-read failed'; end if;
 if (select count(*) from public.issuers)<>0 then raise exception 'Inactive account can see issuers'; end if;
 if (select count(*) from public.students)<>0 then raise exception 'Inactive account can see students'; end if;
end $$;
rollback;
