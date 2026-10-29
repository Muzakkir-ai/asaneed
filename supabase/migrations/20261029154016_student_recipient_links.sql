begin;
create table public.student_accounts(
 student_id uuid primary key references public.students(id) on delete cascade,
 account_id uuid not null references public.accounts(id) on delete restrict,
 linked_at timestamptz not null default now()
);
create index student_accounts_account_idx on public.student_accounts(account_id);
alter table public.student_accounts enable row level security;
revoke all on public.student_accounts from public,anon,authenticated;
grant select,insert,update,delete on public.student_accounts to authenticated;
create policy student_links_read on public.student_accounts for select to authenticated using(private.is_admin() or exists(select 1 from public.accounts a where a.id=account_id and a.auth_user_id=(select auth.uid()) and a.active));
create policy student_links_insert on public.student_accounts for insert to authenticated with check(private.is_admin());
create policy student_links_update on public.student_accounts for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy student_links_delete on public.student_accounts for delete to authenticated using(private.is_admin());
create policy linked_student_read on public.students for select to authenticated using(exists(select 1 from public.student_accounts l join public.accounts a on a.id=l.account_id where l.student_id=students.id and a.auth_user_id=(select auth.uid()) and a.active));
create policy linked_recipient_certificate_read on public.certificates for select to authenticated using(status='finalized' and recipient_account_id is null and exists(select 1 from public.student_accounts l join public.accounts a on a.id=l.account_id where l.student_id=certificates.student_id and a.auth_user_id=(select auth.uid()) and a.active));
create function public.set_student_account(student uuid, account uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 if not exists(select 1 from public.students where id=student) then raise exception 'Student not found'; end if;
 if account is null then delete from public.student_accounts where student_id=student; return; end if;
 if not exists(select 1 from public.accounts where id=account) then raise exception 'Account not found'; end if;
 if exists(select 1 from public.certificates where student_id=student and recipient_account_id is not null and recipient_account_id<>account) then raise exception 'A certificate already names a different recipient account'; end if;
 insert into public.student_accounts(student_id,account_id) values(student,account) on conflict(student_id) do update set account_id=excluded.account_id,linked_at=now();
end; $$;
revoke all on function public.set_student_account(uuid,uuid) from public,anon;
grant execute on function public.set_student_account(uuid,uuid) to authenticated;
-- Extend complete backups and restores without changing frozen certificate content.
do $backup$
declare source text; needle text;
begin
 source:=pg_get_functiondef('private.full_application_backup()'::regprocedure);
 needle:='return jsonb_build_object(';
 if position(needle in source)=0 then raise exception 'Backup function shape changed'; end if;
 execute replace(source,needle,'return jsonb_build_object(''student_accounts'',coalesce((select jsonb_agg(to_jsonb(t)) from public.student_accounts t),''[]''),');
 source:=pg_get_functiondef('private.restore_application_backup(jsonb,boolean)'::regprocedure);
 needle:='return jsonb_build_object(''success''';
 if position(needle in source)=0 then raise exception 'Restore function shape changed'; end if;
 execute replace(source,needle,'if data ? ''student_accounts'' then insert into public.student_accounts select * from jsonb_populate_recordset(null::public.student_accounts,data->''student_accounts'') on conflict(student_id) do update set account_id=case when overwrite then excluded.account_id else public.student_accounts.account_id end; end if; return jsonb_build_object(''success''');
end; $backup$;
commit;

