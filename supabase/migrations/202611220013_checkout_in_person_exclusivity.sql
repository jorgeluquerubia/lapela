-- A Checkout session and cash-in-person are mutually exclusive payment paths.
create or replace function public.lp_confirm_in_person_payment(p_order uuid,p_actor uuid) returns public.lp_orders language plpgsql security definer set search_path=public as $$
declare o public.lp_orders;
begin
 select * into o from lp_orders where id=p_order for update;
 if not found or o.seller_id<>p_actor then raise exception 'Solo el vendedor puede confirmar el pago en persona'; end if;
 if o.status='completed' and o.payment_mode='in_person' then return o; end if;
 if o.status<>'pending_payment' then raise exception 'Solo se puede confirmar el pago en persona de un pedido pendiente de pago'; end if;
 if o.expires_at<=now() then raise exception 'La reserva ya ha expirado'; end if;
 if o.stripe_session_id is not null then raise exception 'El pedido tiene un Checkout activo o pendiente de verificar'; end if;
 update lp_orders set status='completed',payment_mode='in_person' where id=o.id returning * into o;
 update lp_listings set status='sold' where id=o.listing_id;
 insert into public.lp_notifications(user_id, listing_id, order_id, type, title, body)
 values(o.buyer_id, o.listing_id, o.id, 'status_changed', 'Pago en persona confirmado', 'El vendedor ha registrado el cobro en persona y completado la venta.');
 return o;
