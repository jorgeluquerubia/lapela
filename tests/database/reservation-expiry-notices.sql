begin;

do $$
declare
  seller uuid := gen_random_uuid();
  buyer uuid := gen_random_uuid();
  direct_listing uuid;
  reopenable_auction uuid;
  ended_auction uuid;
  direct_order public.lp_orders;
  reopenable_order public.lp_orders;
  ended_order public.lp_orders;
begin
  insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data,aud,role,created_at,updated_at)
  values
    (seller,'lp-release-seller-'||seller||'@example.invalid','{}','{}','authenticated','authenticated',now(),now()),
    (buyer,'lp-release-buyer-'||buyer||'@example.invalid','{}','{}','authenticated','authenticated',now(),now());

  insert into public.lp_listings(seller_id,title,description,category,condition,location,images,mode,price_cents,delivery)
  values(seller,'Venta directa caducada','Descripción sintética para validar la liberación de una venta directa.','Hogar','Buen estado','Madrid',array['https://example.invalid/direct.jpg'],'sale',1200,'pickup')
  returning id into direct_listing;
  direct_order := lp_reserve(direct_listing,buyer);
  update lp_orders set expires_at=now()-interval '1 second' where id=direct_order.id;
  perform lp_release(direct_order.id); perform lp_release(direct_order.id);
  if (select status from lp_orders where id=direct_order.id)<>'cancelled' or (select status from lp_listings where id=direct_listing)<>'available' then raise exception 'FAIL direct final states'; end if;
  if (select count(*) from lp_notifications where order_id=direct_order.id and type='reservation_expired' and user_id in (buyer,seller) and body like '%vuelto a estar disponible%')<>2 then raise exception 'FAIL direct recipients or copy'; end if;
  if (select count(*) from lp_notifications where order_id=direct_order.id and type='reservation_expired')<>2 then raise exception 'FAIL direct idempotency'; end if;

  insert into public.lp_listings(seller_id,title,description,category,condition,location,images,mode,price_cents,buy_now_cents,delivery,ends_at)
  values(seller,'Subasta reabrible','Descripción sintética para validar una subasta que aún puede reabrirse.','Hogar','Buen estado','Madrid',array['https://example.invalid/reopen.jpg'],'auction',1300,1800,'pickup',now()+interval '1 hour')
  returning id into reopenable_auction;
  reopenable_order := lp_reserve(reopenable_auction,buyer);
  update lp_orders set expires_at=now()-interval '1 second' where id=reopenable_order.id;
  perform lp_release(reopenable_order.id); perform lp_release(reopenable_order.id);
  if (select status from lp_orders where id=reopenable_order.id)<>'cancelled' or (select status from lp_listings where id=reopenable_auction)<>'available' then raise exception 'FAIL re-openable auction final states'; end if;
  if (select count(*) from lp_notifications where order_id=reopenable_order.id and type='reservation_expired' and user_id in (buyer,seller) and body like '%vuelto a estar disponible%')<>2 then raise exception 'FAIL re-openable auction recipients or copy'; end if;
  if (select count(*) from lp_notifications where order_id=reopenable_order.id and type='reservation_expired')<>2 then raise exception 'FAIL re-openable auction idempotency'; end if;

  insert into public.lp_listings(seller_id,title,description,category,condition,location,images,mode,price_cents,delivery,ends_at,status)
  values(seller,'Subasta terminada','Descripción sintética para validar una subasta adjudicada y ya terminada.','Hogar','Buen estado','Madrid',array['https://example.invalid/ended.jpg'],'auction',1400,'pickup',now()-interval '1 second','reserved')
  returning id into ended_auction;
  insert into public.lp_orders(listing_id,buyer_id,seller_id,amount_cents,expires_at)
  values(ended_auction,buyer,seller,1400,now()-interval '1 second') returning * into ended_order;
  perform lp_release(ended_order.id); perform lp_release(ended_order.id);
  if (select status from lp_orders where id=ended_order.id)<>'cancelled' or (select status from lp_listings where id=ended_auction)<>'expired' then raise exception 'FAIL ended auction final states'; end if;
  if (select count(*) from lp_notifications where order_id=ended_order.id and type='reservation_expired' and user_id=buyer and body like '%ha quedado sin vender%')<>1 then raise exception 'FAIL ended auction buyer copy'; end if;
  if (select count(*) from lp_notifications where order_id=ended_order.id and type='reservation_expired' and user_id=seller and body like '%finalizado sin venta%')<>1 then raise exception 'FAIL ended auction seller copy'; end if;
  if (select count(*) from lp_notifications where order_id=ended_order.id and type='reservation_expired')<>2 then raise exception 'FAIL ended auction idempotency'; end if;
end $$;

rollback;

select 'PASS: reservation expiry notices reflect final listing state and are idempotent' as result;
