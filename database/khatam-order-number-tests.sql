begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where role='admin' and active and auth_user_id is not null order by id limit 1),'role','authenticated')::text,true);
do $$ declare target_id uuid; first_number text; again text; begin
 select c.id into target_id from public.certificates c join public.issuers i on i.id=c.issuer_id where i.issuer_code='01' and c.status='draft' order by c.completion_date desc,c.created_at desc,c.id desc limit 1;
 update public.certificates set completion_date='2026-01-01' where id=target_id;
 first_number=private.reserve_certificate_number(target_id);
 if first_number not like '2601-01%' then raise exception 'Backdated draft was not moved to first serial';end if;
 again=private.reserve_certificate_number(target_id);
 if again<>first_number then raise exception 'Reservation not idempotent';end if;
 update public.certificates set completion_date='2027-01-01' where id=target_id;
 again=private.reserve_certificate_number(target_id);
 if again not like '2701-01%' then raise exception 'Year reset failed';end if;
end $$;
rollback;
