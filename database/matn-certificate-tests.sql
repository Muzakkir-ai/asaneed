-- All synthetic students, subjects and certificates are rolled back.
begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select auth_user_id from public.accounts where role='admin' and active and auth_user_id is not null limit 1),'role','authenticated')::text,true);
do $$
declare issuer_a uuid; issuer_b uuid; student uuid; subject text; repeated text; sanad uuid; c1 uuid; c2 uuid; c3 uuid; n1 text; n2 text; token text; result jsonb;
begin
 select id into issuer_a from public.issuers order by issuer_code limit 1;
 select id into issuer_b from public.issuers where id<>issuer_a order by issuer_code limit 1;
 subject:=public.register_matn_subject(issuer_a,'اختبار مَتْن مؤقت');
 repeated:=public.register_matn_subject(issuer_b,'اختبار متن مؤقت');
 if subject<>repeated or subject::int<21 then raise exception 'Matn code reuse failed';end if;
 insert into public.students(display_name) values('اختبار شهادة متن مؤقت') returning id into student;
 insert into public.sanads(issuer_id,title,body) values(issuer_a,'اختبار متن',jsonb_build_object('chain','【بيان القراءة:إجازة في اختبار متن】 سنده','editor',jsonb_build_object('matnCode',subject))) returning id into sanad;
 insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date) values(issuer_a,student,sanad,subject,'2098-06-01') returning id into c1;
 insert into public.certificates(issuer_id,student_id,sanad_id,riwayah_code,completion_date) values(issuer_a,student,sanad,'01','2098-01-01') returning id into c2;
 n1:=private.reserve_certificate_number(c1);
 select registration_number into n2 from public.certificates where id=c2;
 if right(n1,4)<>'02'||subject or right(n2,4)<>'0101' then raise exception 'Shared issuer chronological numbering failed';end if;
 insert into public.certificates(issuer_id,student_id,riwayah_code,completion_date) values(issuer_b,student,subject,'2098-06-01') returning id into c3;
 n2:=private.reserve_certificate_number(c3);
 if right(n2,4)<>'01'||subject then raise exception 'Separate issuer numbering failed';end if;
 update public.certificates set completion_date='2099-01-01' where id=c3;
 n2:=private.reserve_certificate_number(c3);
 if left(n2,2)<>'99' or right(n2,4)<>'01'||subject then raise exception 'Annual reset failed';end if;
 perform private.finalize_certificate(c1,jsonb_build_object('chain','اختبار سند','heading','إجازة في اختبار متن','formatting','{}'));
 select verification_token into token from public.certificates where id=c1;
 result:=public.verify_certificate_token(token);
 if not (result->>'verified')::boolean or result->'certificate'->>'reading'<>'إجازة في اختبار مَتْن مؤقت' then raise exception 'Matn token verification failed: %',result;end if;
 result:=public.verify_ijazah(n1);
 if result->>'status'<>'verified' or result->'certificate'->>'qiraah_name'<>'المتون العلمية' then raise exception 'Matn number verification failed';end if;
 begin update public.certificates set completion_date='2098-06-02' where id=c1;raise exception 'Final certificate edit allowed';exception when others then if sqlerrm='Final certificate edit allowed' then raise;end if;end;
 perform set_config('request.jwt.claims','{}',true);
 begin perform public.register_matn_subject(issuer_a,'غير مصرح');raise exception 'Anonymous allocation allowed';exception when insufficient_privilege then null;end;
end $$;
rollback;
