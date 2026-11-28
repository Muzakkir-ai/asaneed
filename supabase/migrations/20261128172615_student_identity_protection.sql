begin;
-- Restrict deletion of students connected to a login, even during concurrent requests.
alter table public.student_accounts drop constraint student_accounts_student_id_fkey,
 add constraint student_accounts_student_id_fkey foreign key(student_id) references public.students(id) on delete restrict;
create or replace function public.certificate_filtered_page(p_issuers uuid[],p_readings jsonb,p_issuer_labels jsonb,p_filters jsonb,p_view text,p_page integer)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb; yr integer; st text:=p_filters->>'status'; ord text:=p_filters->>'sort'; words text[]; issuer_filter text:=p_filters->>'issuer'; qari_filter text:=p_filters->>'qari'; rawi_filter text:=p_filters->>'rawi';
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 if p_page is null or p_page<0 or p_page>1000000 or p_view not in ('certificates','students') or st is null or st not in ('all','draft','final') or ord is null or ord not in ('added','completion','completion-desc','name') or issuer_filter is null or qari_filter is null or rawi_filter is null or jsonb_typeof(p_readings) is distinct from 'object' or jsonb_typeof(p_issuer_labels) is distinct from 'object' or length(coalesce(p_filters->>'query',''))>200 then raise exception 'Invalid page request' using errcode='22023';end if;
 if p_filters->>'year'<>'all' then yr:=(p_filters->>'year')::int;if yr not between 1 and 9998 then raise exception 'Invalid year' using errcode='22023';end if;end if;
 words:=string_to_array(private.certificate_search_key(coalesce(p_filters->>'query','')),' ');
 -- Preserve legacy fallback behavior where a heading or identity cannot be resolved exactly.
 if exists(select 1 from public.certificates c join public.issuers i on i.id=c.issuer_id where c.issuer_id=any(p_issuers) and (not (p_issuer_labels ? c.issuer_id::text) or not coalesce(p_readings ? c.sanad_id::text,false) or coalesce(p_readings->c.sanad_id::text->>'label','')='')) then return jsonb_build_object('fallback',true);end if;
 with years as (
  select distinct to_char(c.completion_date,'YYYY') as y from public.certificates c join public.issuers i on i.id=c.issuer_id where c.issuer_id=any(p_issuers)
 ), scoped as (
  select c.id,c.student_id,c.completion_date,c.registration_number,
   coalesce(nullif(s.display_name,''),nullif(c.draft->>'studentName',''),c.draft->'source'->>'Student Name','') as student,
   p_readings->c.sanad_id::text->>'label' as reading,
   p_issuer_labels->c.issuer_id::text->>'name' as shaykh,
   case when coalesce(c.draft->'editor'->>'shahadaNumber',c.draft->'source'->>'shahadaNumber',c.draft->'source'->>'Certificate Number') ~ '^[0-9]{1,16}$' then coalesce(c.draft->'editor'->>'shahadaNumber',c.draft->'source'->>'shahadaNumber',c.draft->'source'->>'Certificate Number')::numeric else 0 end as ordinal
  from public.certificates c join public.issuers i on i.id=c.issuer_id left join public.students s on s.id=c.student_id
  where c.issuer_id=any(p_issuers)
   and (st='all' or c.status=case when st='final' then 'finalized' else st end)
   and (yr is null or (c.completion_date>=make_date(yr,1,1) and c.completion_date<make_date(yr+1,1,1)))
   and (issuer_filter='all' or p_issuer_labels->c.issuer_id::text->>'key'=issuer_filter)
   and (qari_filter='all' or p_readings->c.sanad_id::text->>'qari'=qari_filter)
   and (rawi_filter='all' or (p_readings->c.sanad_id::text->>'qari')||'|'||(p_readings->c.sanad_id::text->>'rawi')=rawi_filter)
 ), ranked as materialized (
  select id,coalesce('student:'||student_id::text,'certificate:'||id::text) as student_key,row_number() over(order by
   case when ord='name' then student end collate pg_catalog."ar-x-icu" asc,
   case when ord='completion' then completion_date end asc,
   case when ord='completion-desc' then completion_date end desc,
   case when ord='completion' then coalesce(split_part(registration_number,'-',1)::numeric,-1) end asc,
   case when ord='completion-desc' then coalesce(split_part(registration_number,'-',1)::numeric,-1) end desc,
   case when ord='completion' then coalesce(split_part(registration_number,'-',2)::numeric,-1) end asc,
   case when ord='completion-desc' then coalesce(split_part(registration_number,'-',2)::numeric,-1) end desc,
   case when ord='completion' then ordinal end asc,
   case when ord in ('completion-desc','added') then ordinal end desc,id asc) as position
  from scoped where not exists(select 1 from unnest(words) w where w<>'' and strpos(private.certificate_search_key(concat_ws(' ',student,reading,shaykh,coalesce(registration_number,''),ordinal::text)),w)=0)
 ), groups as (select student_key,min(position) first_position from ranked group by student_key),
 totals as (select (select count(*) from ranked) as total,case when p_view='students' then (select count(*) from groups) else (select count(*) from ranked) end as units),
 bounds as (select total,greatest(1,(units+14)/15) as pages,least(p_page::bigint,greatest(1,(units+14)/15)-1) as page from totals),
 group_page as (select g.student_key,g.first_position from groups g order by first_position limit 15 offset (select page*15 from bounds)),
 picked as materialized (select r.id,r.position,r.student_key from ranked r cross join bounds b where (p_view='certificates' and r.position>b.page*15 and r.position<=b.page*15+15) or (p_view='students' and exists(select 1 from group_page gp where gp.student_key=r.student_key))),
 grouped_ids as (select gp.first_position,jsonb_agg(p.id order by p.position) as ids from group_page gp join picked p on p.student_key=gp.student_key group by gp.first_position)
 select case when (select count(*) from picked)>150 then jsonb_build_object('fallback',true) else jsonb_build_object('totalCertificates',b.total,'pages',b.pages,'page',b.page,'years',coalesce((select jsonb_agg(y order by y desc) from years),'[]'::jsonb),'ids',coalesce((select jsonb_agg(id order by position) from picked),'[]'::jsonb),'groups',case when p_view='students' then coalesce((select jsonb_agg(ids order by first_position) from grouped_ids),'[]'::jsonb) else '[]'::jsonb end) end into result from bounds b;
 return result;
end $$;
revoke all on function public.certificate_filtered_page(uuid[],jsonb,jsonb,jsonb,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.certificate_filtered_page(uuid[],jsonb,jsonb,jsonb,text,integer) to authenticated;
commit;
