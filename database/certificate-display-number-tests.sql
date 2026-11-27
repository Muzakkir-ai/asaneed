-- Staging only; fixture rows roll back. Sequence increments do not roll back.
begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where role='admin' and active and auth_user_id is not null limit 1),'role','authenticated')::text,true);
create temporary table display_fixture as select issuer_id,student_id,sanad_id,riwayah_code,completion_date from public.certificates limit 1;
grant select on display_fixture to authenticated;
set local role authenticated;
do $$
declare f record; n bigint; n2 bigint; first_id uuid; count_inserted bigint; unique_numbers bigint;
begin
 select * into strict f from display_fixture;
 insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft)
 values(f.issuer_id,f.student_id,f.sanad_id,f.riwayah_code,f.completion_date,'{"editor":{"shahadaNumber":1,"notes":"fixture"}}')
 returning id,(draft->'editor'->>'shahadaNumber')::bigint into first_id,n;
 insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft)
 values(f.issuer_id,f.student_id,f.sanad_id,f.riwayah_code,f.completion_date,'{"editor":{}}')
 returning (draft->'editor'->>'shahadaNumber')::bigint into n2;
 if n2<=n or n<=1 then raise exception 'allocator did not advance';end if;
 update public.certificates set draft=jsonb_set(draft,'{editor,notes}','"updated fixture"') where id=first_id;
 begin
  update public.certificates set draft=jsonb_set(draft,'{editor,shahadaNumber}','1') where id=first_id;
  raise exception 'unauthorized number change was accepted';
 exception when sqlstate '22023' then null;end;
 with inserted as (insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft)
 select f.issuer_id,f.student_id,f.sanad_id,f.riwayah_code,f.completion_date,'{"editor":{}}'::jsonb from generate_series(1,2100)
 returning (draft->'editor'->>'shahadaNumber')::bigint as number)
 select count(*),count(distinct number) into count_inserted,unique_numbers from inserted;
 if count_inserted<>2100 or unique_numbers<>2100 then raise exception 'large allocation failed';end if;
end $$;
reset role;
select 'PASS: normal insert, forged display number ignored, update guard, 2100 unique allocations' as result;
rollback;
