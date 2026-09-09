begin;

-- Permitir 'in_person' en payment_mode de lp_orders
alter table public.lp_orders drop constraint if exists lp_orders_payment_mode_check;
alter table public.lp_orders add constraint lp_orders_payment_mode_check check(payment_mode in ('simulation','stripe','in_person'));

-- Actualizar lp_send_message para permitir chat en pending_payment (reserva activa)
create or replace function public.lp_send_message(p_order uuid,p_actor uuid,p_content text) returns public.lp_messages language plpgsql security definer set search_path=public as $$
declare o public.lp_orders; m public.lp_messages;
begin
 select * into o from lp_orders where id=p_order for update;
 if not found or p_actor not in(o.buyer_id,o.seller_id) or o.status not in ('pending_payment','paid','shipped','completed','disputed') then
  raise exception 'El chat se habilita durante la reserva o tras el pago y solo entre las partes del pedido';
 end if;
 insert into lp_messages(order_id,sender_id,content) values(p_order,p_actor,trim(p_content)) returning * into m;
 return m;
end $$;

-- Crear lp_confirm_in_person_payment para que el vendedor confirme el cobro en persona
create or replace function public.lp_confirm_in_person_payment(p_order uuid,p_actor uuid) returns public.lp_orders language plpgsql security definer set search_path=public as $$
declare o public.lp_orders;
begin
 select * into o from lp_orders where id=p_order for update;
 if not found or o.seller_id<>p_actor then
  raise exception 'Solo el vendedor puede confirmar el pago en persona';
 end if;
 if o.status<>'pending_payment' then
  raise exception 'Solo se puede confirmar el pago en persona de un pedido pendiente de pago';
 end if;
 if o.expires_at<=now() then
  raise exception 'La reserva ya ha expirado';
 end if;
 update lp_orders set status='completed',payment_mode='in_person' where id=o.id returning * into o;
 update lp_listings set status='sold' where id=o.listing_id;
 return o;
end $$;

revoke execute on function public.lp_send_message(uuid,uuid,text), public.lp_confirm_in_person_payment(uuid,uuid) from public,anon,authenticated;
grant execute on function public.lp_send_message(uuid,uuid,text), public.lp_confirm_in_person_payment(uuid,uuid) to service_role;

commit;
