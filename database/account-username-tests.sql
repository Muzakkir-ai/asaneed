begin;
do $$
declare first_user uuid; second_user uuid; first_account uuid; first_email text; resolved text; before_row jsonb; after_row jsonb; secret text:=repeat('t',64); blocked boolean;
begin
 select a.id,a.auth_user_id,u.email,to_jsonb(a) into first_account,first_user,first_email,before_row from public.accounts a join auth.users u on u.id=a.auth_user_id where a.active and a.role='admin' order by a.id limit 1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',first_user,'role','authenticated')::text,true);
 if public.set_account_username('  Workflow_Test_Alias  ')<>'workflow_test_alias' then raise exception 'Username normalization failed';end if;
 if public.get_account_username()<>'workflow_test_alias' then raise exception 'Own username lookup failed';end if;
 select to_jsonb(a) into after_row from public.accounts a where a.id=first_account;
 if before_row-'username'<>after_row-'username' then raise exception 'Other account fields changed';end if;
 insert into private.server_login_keys(purpose,key_hash) values('username-login',encode(extensions.digest(secret,'sha256'),'hex')) on conflict(purpose) do update set key_hash=excluded.key_hash;
 resolved:=public.resolve_account_username('workflow_test_alias',secret);
 if resolved is distinct from first_email then raise exception 'Server alias resolution failed';end if;
 blocked:=false;begin perform public.resolve_account_username('workflow_test_alias',repeat('x',64));exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Public email disclosure allowed';end if;
 blocked:=false;begin perform public.set_account_username('bad name');exception when others then blocked:=true;end;if not blocked then raise exception 'Invalid username accepted';end if;
 select auth_user_id into second_user from public.accounts where active and auth_user_id is not null and auth_user_id<>first_user order by id limit 1;
 if second_user is not null then
 perform set_config('request.jwt.claims',jsonb_build_object('sub',second_user,'role','authenticated')::text,true);
 blocked:=false;begin perform public.set_account_username('workflow_test_alias');exception when unique_violation then blocked:=true;end;if not blocked then raise exception 'Duplicate username accepted';end if;
 if public.get_account_username()='workflow_test_alias' then raise exception 'Other account username leaked as own';end if;
 end if;
 perform set_config('request.jwt.claims','{}',true);
 blocked:=false;begin perform private.set_account_username('anonymous_test');exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Anonymous username write allowed';end if;
 if has_function_privilege('anon','public.set_account_username(text)','EXECUTE') or has_table_privilege('anon','private.server_login_keys','SELECT') then raise exception 'Unsafe grants';end if;
end $$;
rollback;
