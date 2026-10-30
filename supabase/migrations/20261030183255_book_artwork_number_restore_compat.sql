create or replace function private.assign_book_artwork_number() returns trigger language plpgsql security invoker set search_path='' as $$
declare n text;
begin
if tg_op='UPDATE' then
 if new.artwork_number is distinct from old.artwork_number then raise exception 'Artwork number is permanent';end if;
elsif new.artwork_number is null or current_user='authenticated' then
 n:=nextval('public.builder_book_artwork_number')::text;
 new.artwork_number:=lpad(n,greatest(2,length(n)),'0');
end if;
return new;
end $$;
