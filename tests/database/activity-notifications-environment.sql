begin;

do $$
declare actor uuid := gen_random_uuid(); sandbox_listing uuid; live_listing uuid; sandbox_order uuid; live_order uuid; sandbox_note uuid; live_note uuid; live_listing_note uuid; legacy_note uuid; counterparty uuid := gen_random_uuid();
begin
  insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data,aud,role,created_at,updated_at) values(actor,'lp-env-' || actor || '@example.invalid','{}','{}','authenticated','authenticated',now(),now()), (counterparty,'lp-env-' || counterparty || '@example.invalid','{}','{}','authenticated','authenticated',now(),now());
  insert into public.lp_listings(seller_id,environment,title,description,category,condition,location,images,mode,price_cents,delivery) values(actor,'sandbox','Sandbox','Descripción de prueba aislada.','Hogar','Buen estado','Madrid',array['https://example.invalid/s.jpg'],'sale',100,'pickup') returning id into sandbox_listing;
  insert into public.lp_listings(seller_id,environment,title,description,category,condition,location,images,mode,price_cents,delivery) values(actor,'live','Anuncio Live','Descripción de prueba aislada.','Hogar','Buen estado','Madrid',array['https://example.invalid/l.jpg'],'sale',100,'pickup') returning id into live_listing;
  insert into public.lp_orders(listing_id,buyer_id,seller_id,amount_cents,expires_at) values(sandbox_listing,counterparty,actor,100,now()+interval '1 day') returning id into sandbox_order;
  insert into public.lp_orders(listing_id,buyer_id,seller_id,amount_cents,expires_at) values(live_listing,counterparty,actor,100,now()+interval '1 day') returning id into live_order;
  insert into public.lp_notifications(user_id,listing_id,order_id,type,title,body) values(actor,sandbox_listing,sandbox_order,'status_changed','Sandbox','Aviso de prueba') returning id into sandbox_note;
  insert into public.lp_notifications(user_id,listing_id,order_id,type,title,body) values(actor,live_listing,live_order,'status_changed','Live','Aviso de prueba') returning id into live_note;
  insert into public.lp_notifications(user_id,listing_id,type,title,body) values(actor,live_listing,'auction_ended','Fin de subasta','Aviso de prueba') returning id into live_listing_note;
  insert into public.lp_notifications(user_id,type,title,body) values(actor,'status_changed','Legado','Aviso de prueba') returning id into legacy_note;
  if (select environment from public.lp_notifications where id=sandbox_note) <> 'sandbox' then raise exception 'FAIL sandbox notification environment'; end if;
  if (select environment from public.lp_notifications where id=live_note) <> 'live' then raise exception 'FAIL live notification environment'; end if;
  if (select environment from public.lp_notifications where id=legacy_note) <> 'sandbox' then raise exception 'FAIL legacy notification environment'; end if;
  perform public.lp_mark_order_notifications_read(sandbox_order,actor,'sandbox');
  if not (select read from public.lp_notifications where id=sandbox_note) then raise exception 'FAIL sandbox read'; end if;
  if (select read from public.lp_notifications where id=live_note) then raise exception 'FAIL cross environment order read'; end if;
  perform public.lp_mark_listing_notifications_read(live_listing,actor,'live');
  if not (select read from public.lp_notifications where id=live_listing_note) then raise exception 'FAIL live listing read'; end if;
  if (select read from public.lp_notifications where id=live_note) then raise exception 'FAIL listing marked an order notification'; end if;
  perform public.lp_mark_order_notifications_read(live_order,actor,'sandbox');
  if (select read from public.lp_notifications where id=live_note) then raise exception 'FAIL live order read from sandbox'; end if;
  perform public.lp_mark_order_notifications_read(live_order,actor,'live');
  if not (select read from public.lp_notifications where id=live_note) then raise exception 'FAIL live order read'; end if;
  if (select count(*) from public.lp_notifications where user_id=actor and environment='sandbox') <> 2 then raise exception 'FAIL sandbox visibility'; end if;
  if (select count(*) from public.lp_notifications where user_id=actor and environment='live') <> 2 then raise exception 'FAIL live visibility'; end if;
end $$;

rollback;
select 'PASS: activity and notification environment isolation' as result;
