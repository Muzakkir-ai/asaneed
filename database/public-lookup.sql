begin;
-- Frozen public verification fields, in a schema not exposed by the Data API.
create table private.ijazah_verification_index (
 registration_number text primary key check (registration_number ~ '^[0-9]{4}-[0-9]{4}$'),
 certificate_id uuid unique not null references public.certificates(id),
 student_name text not null, issuer_name text not null,
 qiraah_name text not null, riwayah_name text not null,
 completion_date date not null, published boolean not null default true
);
alter table private.ijazah_verification_index enable row level security;
revoke all on private.ijazah_verification_index from public,anon,authenticated;
grant usage on schema private to anon;
grant select on private.ijazah_verification_index to anon,authenticated;
create policy verification_lookup_read on private.ijazah_verification_index for select to anon,authenticated using (published);
create function private.index_finalized_ijazah() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 insert into private.ijazah_verification_index(registration_number,certificate_id,student_name,issuer_name,qiraah_name,riwayah_name,completion_date)
 select new.registration_number,new.id,s.display_name,i.display_name,q.display_name,r.display_name,new.completion_date
 from public.students s join public.issuers i on i.id=new.issuer_id
 join public.riwayat r on r.code=new.riwayah_code join public.qiraat q on q.id=r.qiraah_id
 where s.id=new.student_id;
 return new;
end;
$$;
revoke all on function private.index_finalized_ijazah() from public,anon,authenticated;
-- The existing authorized finalizer's transaction can write this private projection.
create trigger index_finalized_ijazah after insert or update of status on public.certificates
for each row when (new.status = 'finalized') execute function private.index_finalized_ijazah();
insert into private.ijazah_verification_index(registration_number,certificate_id,student_name,issuer_name,qiraah_name,riwayah_name,completion_date)
select c.registration_number,c.id,s.display_name,i.display_name,q.display_name,r.display_name,c.completion_date
from public.certificates c join public.students s on s.id=c.student_id join public.issuers i on i.id=c.issuer_id
join public.riwayat r on r.code=c.riwayah_code join public.qiraat q on q.id=r.qiraah_id
where c.status='finalized' and exists(select 1 from public.certificate_snapshots cs where cs.certificate_id=c.id);
-- Exact lookup only. No privileged public code or underlying table grants.
create function public.verify_ijazah(p_number text) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare certificate jsonb;
begin
 if p_number is null or p_number !~ '^[0-9]{4}-[0-9]{4}$' then
 raise exception 'Invalid registration number' using errcode='22023'; end if;
 if not exists(select 1 from private.ijazah_verification_index) then
 return jsonb_build_object('status','preparing'); end if;
 select jsonb_build_object('registration_number',v.registration_number,'student_name',v.student_name,
 'issuer_name',v.issuer_name,'qiraah_name',v.qiraah_name,'riwayah_name',v.riwayah_name,'completion_date',v.completion_date)
 into certificate from private.ijazah_verification_index v where v.registration_number=p_number;
 if certificate is null then return jsonb_build_object('status','not_found'); end if;
 return jsonb_build_object('status','verified','certificate',certificate);
end;
$$;
revoke all on function public.verify_ijazah(text) from public;
grant execute on function public.verify_ijazah(text) to anon,authenticated;
commit;
