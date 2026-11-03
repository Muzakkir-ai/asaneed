-- Shared immutable subject codes; Quran remains 01..20, matn starts at 21.
insert into private.application_backups(purpose,snapshot)
select 'Before matn certificate subject support 2026-11-03',jsonb_build_object('certificates',(select jsonb_agg(to_jsonb(c)) from public.certificates c),'snapshots',(select jsonb_agg(to_jsonb(s)) from public.certificate_snapshots s));
create table public.certificate_subjects (
 code text primary key check(code ~ '^[0-9]{2}$'),
 kind text not null check(kind in ('riwayah','matn')),
 display_name text not null check(length(btrim(display_name)) between 1 and 200),
 name_key text not null,
 created_at timestamptz not null default now(),
 unique(kind,name_key),
 check((kind='riwayah' and code::int between 1 and 20) or (kind='matn' and code::int between 21 and 99))
);
alter table public.certificate_subjects enable row level security;
grant select on public.certificate_subjects to authenticated;
create policy certificate_subjects_read on public.certificate_subjects for select to authenticated
 using(exists(select 1 from public.accounts a where a.auth_user_id=(select auth.uid()) and a.active));
insert into public.certificate_subjects(code,kind,display_name,name_key) select code,'riwayah',display_name,code from public.riwayat;
alter table public.certificates drop constraint certificates_riwayah_code_fkey;
alter table public.certificates add constraint certificates_subject_code_fkey foreign key(riwayah_code) references public.certificate_subjects(code);
create function private.register_matn_subject(target_issuer uuid,matn_name text) returns text
language plpgsql security definer set search_path='' as $$
declare k text; result text; next_code int;
begin
 if auth.uid() is null or not private.can_manage_issuer(target_issuer) then raise exception 'Issuer access required' using errcode='42501';end if;
 if matn_name is null or length(btrim(matn_name)) not between 1 and 200 then raise exception 'Matn name required';end if;
 k:=lower(regexp_replace(translate(regexp_replace(normalize(btrim(matn_name),NFKC),'[ً-ٰٟـ]','','g'),'أإآٱى','ااااي'),'\s+',' ','g'));
 perform pg_advisory_xact_lock(hashtextextended('matn-subject-codes',0));
 select code into result from public.certificate_subjects where kind='matn' and name_key=k;
 if result is not null then return result;end if;
 select greatest(20,coalesce(max(code::int),20))+1 into next_code from public.certificate_subjects;
 if next_code>99 then raise exception 'Matn code capacity reached';end if;
 result:=lpad(next_code::text,2,'0');
 insert into public.certificate_subjects(code,kind,display_name,name_key) values(result,'matn',btrim(matn_name),k);
 return result;
end $$;
revoke all on function private.register_matn_subject(uuid,text) from public,anon;
grant execute on function private.register_matn_subject(uuid,text) to authenticated;
create function public.register_matn_subject(target_issuer uuid,matn_name text) returns text
language sql security invoker set search_path='' as $$select private.register_matn_subject(target_issuer,matn_name);$$;
revoke all on function public.register_matn_subject(uuid,text) from public,anon;
grant execute on function public.register_matn_subject(uuid,text) to authenticated;
create or replace function private.index_finalized_ijazah() returns trigger
language plpgsql set search_path='' as $$
begin
 insert into private.ijazah_verification_index(registration_number,certificate_id,student_name,issuer_name,qiraah_name,riwayah_name,completion_date)
 select new.registration_number,new.id,s.display_name,i.display_name,
 case when subject.kind='matn' then 'المتون العلمية' else q.display_name end,
 case when subject.kind='matn' then subject.display_name else r.display_name end,new.completion_date
 from public.students s join public.issuers i on i.id=new.issuer_id
 join public.certificate_subjects subject on subject.code=new.riwayah_code
 left join public.riwayat r on r.code=new.riwayah_code left join public.qiraat q on q.id=r.qiraah_id
 where s.id=new.student_id;
 return new;
end $$;
create or replace function private.verify_certificate_token(token text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if token is null or token !~ '^[0-9a-f-]{32,64}$' then return jsonb_build_object('verified',false,'certificate',null);end if;
 select jsonb_build_object('certificateNumber',0,'registrationNumber',v.registration_number,'studentName',v.student_name,'issuerName',v.issuer_name,
 'reading',case when subject.kind='matn' then 'إجازة في '||v.riwayah_name else v.riwayah_name||' عن '||v.qiraah_name end,
 'completionDate',v.completion_date,'publishedAt',s.created_at) into result
 from public.certificates c join private.ijazah_verification_index v on v.certificate_id=c.id
 join public.certificate_snapshots s on s.certificate_id=c.id
 join public.certificate_subjects subject on subject.code=c.riwayah_code
 where c.verification_token=token and c.status='finalized' and v.published;
 return jsonb_build_object('verified',result is not null,'certificate',result);
end $$;
