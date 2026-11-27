-- Staging only; all fixture records roll back.
begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where role='admin' and active and auth_user_id is not null limit 1),'role','authenticated')::text,true);
create temporary table display_fixture as select issuer_id,student_id,sanad_id,riwayah_code from public.certificates limit 1;
grant select on display_fixture to authenticated;
set local role authenticated;
do $$
declare f record; a uuid; b uuid; a_display text; b_display text; a_official text; b_official text;
begin
 select * into strict f from display_fixture;
 insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft) values(f.issuer_id,f.student_id,f.sanad_id,f.riwayah_code,'2097-12-01','{"editor":{}}') returning id,draft->'editor'->>'shahadaNumber' into a,a_display;
 perform public.reserve_certificate_number(a);
 insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date,draft) values(f.issuer_id,f.student_id,f.sanad_id,f.riwayah_code,'2097-01-01','{"editor":{}}') returning id,draft->'editor'->>'shahadaNumber' into b,b_display;
 perform public.reserve_certificate_number(b);
 select registration_number into a_official from public.certificates where id=a;
 select registration_number into b_official from public.certificates where id=b;
 if left(a_official,2)<>'97' or substring(a_official from 6 for length(a_official)-7)<>'02' or substring(b_official from 6 for length(b_official)-7)<>'01' then raise exception 'Khatam order changed';end if;
 if (select draft->'editor'->>'shahadaNumber' from public.certificates where id=a)<>a_display or (select draft->'editor'->>'shahadaNumber' from public.certificates where id=b)<>b_display then raise exception 'Display ordinal changed';end if;
 if public.reserve_certificate_number(b)<>b_official then raise exception 'Registration retry changed the result';end if;
end $$;
reset role;
select 'PASS: independent official numbering, chronological draft reorder, idempotent reservation, immutable display number' result;
rollback;
