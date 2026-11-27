begin;
create function public.certificate_list_page(p_issuers uuid[],p_year integer,p_status text,p_sort text,p_page integer)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 if p_page is null or p_page<0 or p_page>1000000 or p_status is null or p_status not in ('all','draft','final') or p_sort is null or p_sort not in ('added','completion','completion-desc') or (p_year is not null and p_year not between 1 and 9998) then raise exception 'Invalid page request' using errcode='22023';end if;
 with scoped as materialized (
  select c.id,c.completion_date,c.status,c.registration_number,
   case when coalesce(c.draft->'editor'->>'shahadaNumber',c.draft->'source'->>'shahadaNumber',c.draft->'source'->>'Certificate Number') ~ '^[0-9]{1,16}$' then coalesce(c.draft->'editor'->>'shahadaNumber',c.draft->'source'->>'shahadaNumber',c.draft->'source'->>'Certificate Number')::numeric else 0 end as ordinal
  from public.certificates c join public.issuers i on i.id=c.issuer_id
  where c.issuer_id=any(p_issuers)
 ), filtered as materialized (
  select * from scoped where (p_status='all' or status=case when p_status='final' then 'finalized' else p_status end)
   and (p_year is null or extract(year from completion_date)=p_year)
 ), totals as (
  select count(*) as total,greatest(1,(count(*)+14)/15) as pages from filtered
 ), bounds as (select total,pages,least(p_page::bigint,pages-1) as page from totals),
 ordered as (
  select id,row_number() over(order by
   case when p_sort='completion' then completion_date end asc,
   case when p_sort='completion-desc' then completion_date end desc,
   case when p_sort='completion' then coalesce(split_part(registration_number,'-',1)::numeric,-1) end asc,
   case when p_sort='completion-desc' then coalesce(split_part(registration_number,'-',1)::numeric,-1) end desc,
   case when p_sort='completion' then coalesce(split_part(registration_number,'-',2)::numeric,-1) end asc,
   case when p_sort='completion-desc' then coalesce(split_part(registration_number,'-',2)::numeric,-1) end desc,
   case when p_sort='completion' then ordinal end asc,
   case when p_sort in ('completion-desc','added') then ordinal end desc,id asc) as position
  from filtered
 ), picked as (select o.id,o.position from ordered o cross join bounds b where o.position>b.page*15 and o.position<=b.page*15+15)
 select jsonb_build_object('totalCertificates',b.total,'pages',b.pages,'page',b.page,'years',coalesce((select jsonb_agg(y order by y desc) from (select distinct to_char(completion_date,'YYYY') as y from scoped where completion_date is not null) yy),'[]'::jsonb),'ids',coalesce((select jsonb_agg(id order by position) from picked),'[]'::jsonb))
 into result from bounds b;
 return result;
end $$;
revoke all on function public.certificate_list_page(uuid[],integer,text,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.certificate_list_page(uuid[],integer,text,text,integer) to authenticated;
commit;
