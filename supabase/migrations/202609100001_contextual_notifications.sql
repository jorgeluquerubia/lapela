begin;

alter table public.lp_notifications drop constraint if exists lp_notifications_type_check;
alter table public.lp_notifications add constraint lp_notifications_type_check check(type in (
  'order_created', 'new_message', 'outbid', 'status_changed', 'auction_won',
  'auction_sold', 'auction_ended', 'payment_confirmed', 'reservation_expired'
));

-- The article is not enough context to consider a chat or order event read.
create or replace function public.lp_mark_listing_notifications_read(p_listing uuid, p_actor uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare updated_count integer;
begin
  update public.lp_notifications
  set read = true, read_at = now()
  where listing_id = p_listing
    and order_id is null
    and user_id = p_actor
    and read = false;
  get diagnostics updated_count = row_count;
  return updated_count;
end $$;

create or replace function public.lp_close_auctions() returns integer language plpgsql security definer set search_path=public as $$
declare l public.lp_listings; o public.lp_orders; n integer:=0;
begin
  for l in select * from lp_listings where mode='auction' and status='available' and ends_at<=now() for update skip locked loop
    if l.highest_bidder is null then
      update lp_listings set status='expired' where id=l.id;
      insert into lp_notifications(user_id,listing_id,type,title,body)
      values(l.seller_id,l.id,'auction_ended','Subasta finalizada sin pujas','Tu artículo ha finalizado sin recibir pujas.');
    else
      insert into lp_orders(listing_id,buyer_id,seller_id,amount_cents,expires_at)
      values(l.id,l.highest_bidder,l.seller_id,l.price_cents+l.shipping_cents,now()+interval '24 hours') returning * into o;
      update lp_listings set status='reserved' where id=l.id;
      insert into lp_notifications(user_id,listing_id,order_id,type,title,body)
      values
        (o.buyer_id,l.id,o.id,'auction_won','Has ganado la subasta','La subasta ha finalizado. Completa el pago para cerrar la compra.'),
        (o.seller_id,l.id,o.id,'auction_sold','Subasta adjudicada','Tu artículo se ha adjudicado al mejor postor. Coordina el pago y la entrega.');
    end if;
    n:=n+1;
  end loop;
  return n;
end $$;

create or replace function public.lp_simulate_payment(p_order uuid,p_actor uuid) returns public.lp_orders language plpgsql security definer set search_path=public as $$
declare o public.lp_orders; l public.lp_listings;
begin
  select * into o from lp_orders where id=p_order for update;
  if not found or o.buyer_id<>p_actor then raise exception 'No puedes confirmar este pedido'; end if;
  select * into l from lp_listings where id=o.listing_id;
  if l.environment<>'sandbox' or o.stripe_session_id is not null then raise exception 'La simulación solo está disponible para artículos de prueba'; end if;
  if o.status='paid' and o.payment_mode='simulation' then return o; end if;
  if o.status<>'pending_payment' or o.expires_at<=now() then raise exception 'La reserva ya no admite pagos'; end if;
  update lp_orders set status='paid',payment_mode='simulation' where id=o.id returning * into o;
  update lp_listings set status='sold' where id=o.listing_id;
  insert into lp_notifications(user_id,listing_id,order_id,type,title,body)
  values(o.seller_id,o.listing_id,o.id,'payment_confirmed','Pago confirmado','El comprador ha confirmado el pago. Ya puedes preparar la entrega.');
  return o;
end $$;

create or replace function public.lp_confirm_payment(p_event text,p_order uuid,p_session text,p_payment text,p_amount integer,p_address jsonb) returns void language plpgsql security definer set search_path=public as $$
declare o public.lp_orders;
begin
  if exists(select 1 from lp_payment_events where id=p_event) then return; end if;
  select * into o from lp_orders where id=p_order for update;
  if not found or o.stripe_session_id is distinct from p_session or o.amount_cents<>p_amount then raise exception 'El pago no coincide con el pedido'; end if;
  if o.status in ('paid','shipped','completed') and o.stripe_payment_id=p_payment then
    insert into lp_payment_events(id) values(p_event) on conflict do nothing;
    return;
  end if;
  if o.status<>'pending_payment' then raise exception 'Estado incompatible con el pago'; end if;
  update lp_orders set status='paid',payment_mode='stripe',stripe_payment_id=p_payment,shipping_address=p_address where id=o.id;
  update lp_listings set status='sold' where id=o.listing_id;
  insert into lp_payment_events(id) values(p_event);
  insert into lp_notifications(user_id,listing_id,order_id,type,title,body)
  values(o.seller_id,o.listing_id,o.id,'payment_confirmed','Pago confirmado','El comprador ha confirmado el pago. Ya puedes preparar la entrega.');
end $$;

create or replace function public.lp_release(p_order uuid) returns void language plpgsql security definer set search_path=public as $$
declare o public.lp_orders;
begin
  select * into o from lp_orders where id=p_order for update;
  if not found or o.status<>'pending_payment' then return; end if;
  update lp_orders set status='cancelled' where id=o.id;
  update lp_listings set status=case when mode='auction' and ends_at<=now() then 'expired' else 'available' end where id=o.listing_id and status='reserved';
  insert into lp_notifications(user_id,listing_id,order_id,type,title,body)
  values
    (o.buyer_id,o.listing_id,o.id,'reservation_expired','Reserva cancelada','La reserva ha caducado y el artículo ha vuelto a estar disponible.'),
    (o.seller_id,o.listing_id,o.id,'reservation_expired','Reserva cancelada','La reserva ha caducado y el artículo ha vuelto a estar disponible.');
end $$;

revoke execute on function public.lp_mark_listing_notifications_read(uuid,uuid),
                           public.lp_close_auctions(),
                           public.lp_simulate_payment(uuid,uuid),
                           public.lp_confirm_payment(text,uuid,text,text,integer,jsonb),
                           public.lp_release(uuid) from public,anon,authenticated;
grant execute on function public.lp_mark_listing_notifications_read(uuid,uuid),
                          public.lp_close_auctions(),
                          public.lp_simulate_payment(uuid,uuid),
                          public.lp_confirm_payment(text,uuid,text,text,integer,jsonb),
                          public.lp_release(uuid) to service_role;

commit;
