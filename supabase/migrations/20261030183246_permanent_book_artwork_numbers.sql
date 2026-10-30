begin;
insert into private.application_backups(purpose,snapshot) values ('Before permanent route-book artwork numbers',jsonb_build_object('builder_books',(select jsonb_agg(to_jsonb(b)) from public.builder_books b)));
create sequence public.builder_book_artwork_number start 2 maxvalue 9999;
revoke all on sequence public.builder_book_artwork_number from public,anon;
grant usage on sequence public.builder_book_artwork_number to authenticated;
alter table public.builder_books add column artwork_number text unique check(artwork_number ~ '^[0-9]{2,4}$');
do $$ begin
if (select count(*) from public.builder_books where title='المستنير')>1 then raise exception 'Mustanir mapping requires review';end if;
update public.builder_books set artwork_number='01' where title='المستنير';
end $$;
with numbered as (select id,nextval('public.builder_book_artwork_number') n from public.builder_books where artwork_number is null order by id)
update public.builder_books b set artwork_number=lpad(n.n::text,2,'0') from numbered n where n.id=b.id;
create function private.assign_book_artwork_number() returns trigger language plpgsql security invoker set search_path='' as $$
begin
if tg_op='UPDATE' then
 if new.artwork_number is distinct from old.artwork_number then raise exception 'Artwork number is permanent';end if;
else
 -- App-created books cannot choose/reuse another book's folder number.
 new.artwork_number:=lpad(nextval('public.builder_book_artwork_number')::text,2,'0');
end if;
return new;
end $$;
create trigger builder_book_artwork_number before insert or update on public.builder_books for each row execute function private.assign_book_artwork_number();
commit;
