\set ON_ERROR_STOP on

create extension if not exists dblink;

begin;

delete from public.lp_notifications where listing_id = '10000000-0000-0000-0000-000000000001';
delete from public.lp_listings where id = '10000000-0000-0000-0000-000000000001';
delete from auth.users where id in ('10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000013');
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data,aud,role,created_at,updated_at)
values ('10000000-0000-0000-0000-000000000010','lp-favorite-race-seller@example.invalid','{}','{}','authenticated','authenticated',now(),now()),
       ('10000000-0000-0000-0000-000000000011','lp-favorite-race-one@example.invalid','{}','{}','authenticated','authenticated',now(),now()),
       ('10000000-0000-0000-0000-000000000012','lp-favorite-race-two@example.invalid','{}','{}','authenticated','authenticated',now(),now()),
       ('10000000-0000-0000-0000-000000000013','lp-favorite-race-three@example.invalid','{}','{}','authenticated','authenticated',now(),now());
insert into public.lp_listings(id,seller_id,title,description,category,condition,location,images,mode,price_cents,delivery)
values ('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000010','Artículo carrera favoritos','Descripción sintética para validar una carrera concurrente de notificaciones de favoritos.','Hogar','Buen estado','Madrid',array['https://example.invalid/favorite-race.jpg'],'sale',2000,'pickup');
commit;

select dblink_connect('favorite_race_one', 'dbname=' || current_database());
select dblink_connect('favorite_race_two', 'dbname=' || current_database());

begin;
lock table public.lp_notifications in share mode;
select dblink_send_query('favorite_race_one', $$select public.lp_set_favorite('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', true)$$);
select dblink_send_query('favorite_race_two', $$select public.lp_set_favorite('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000012', true)$$);
select pg_sleep(0.5);
commit;

select * from dblink_get_result('favorite_race_one') as result(saved boolean);
select * from dblink_get_result('favorite_race_two') as result(saved boolean);

do $$
declare
  v_listing_id constant uuid := '10000000-0000-0000-0000-000000000001';
  v_seller_id constant uuid := '10000000-0000-0000-0000-000000000010';
  v_buyer_one constant uuid := '10000000-0000-0000-0000-000000000011';
  v_buyer_three constant uuid := '10000000-0000-0000-0000-000000000013';
begin
  if (select count(*) from public.lp_favorites where listing_id = v_listing_id) <> 2 then raise exception 'FAIL concurrent favorites were not both persisted'; end if;
  if (select count(*) from public.lp_notifications where user_id = v_seller_id and listing_id = v_listing_id and type = 'favorite_received') <> 1 then raise exception 'FAIL concurrent favorite notification was not deduplicated'; end if;
  perform public.lp_set_favorite(v_listing_id, v_buyer_one, true);
  if (select count(*) from public.lp_favorites where listing_id = v_listing_id) <> 2 or (select count(*) from public.lp_notifications where user_id = v_seller_id and listing_id = v_listing_id and type = 'favorite_received') <> 1 then raise exception 'FAIL repeated active favorite was not idempotent'; end if;
  update public.lp_notifications set created_at = now() - interval '1 hour 1 second' where user_id = v_seller_id and listing_id = v_listing_id and type = 'favorite_received';
  perform public.lp_set_favorite(v_listing_id, v_buyer_three, true);
  if (select count(*) from public.lp_notifications where user_id = v_seller_id and listing_id = v_listing_id and type = 'favorite_received') <> 2 then raise exception 'FAIL favorite notification did not reopen after rolling hour'; end if;
  if exists (select 1 from public.lp_notifications where listing_id = v_listing_id and type = 'favorite_received' and user_id <> v_seller_id) then raise exception 'FAIL favorite notification recipient leaked'; end if;
  if exists (select 1 from public.lp_notifications where listing_id = v_listing_id and type = 'favorite_received' and body <> 'Un usuario ha guardado «Artículo carrera favoritos» en favoritos.') then raise exception 'FAIL favorite notification body leaked identity'; end if;
  if has_table_privilege('anon','lp_favorites','SELECT') or has_table_privilege('authenticated','lp_favorites','SELECT') then raise exception 'FAIL favorite privacy privileges'; end if;
  if has_function_privilege('authenticated','lp_set_favorite(uuid,uuid,boolean)','EXECUTE') then raise exception 'FAIL favorite RPC direct privilege'; end if;
end $$;

select dblink_disconnect('favorite_race_one');
select dblink_disconnect('favorite_race_two');

begin;
delete from public.lp_listings where id = '10000000-0000-0000-0000-000000000001';
delete from auth.users where id in ('10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000013');
commit;

select 'PASS: concurrent favorite notifications, repeat idempotency, rolling window, and privacy' as result;
