begin;

-- 1. Tabla de notificaciones por usuario y artículo/pedido
create table if not exists public.lp_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.lp_listings(id) on delete cascade,
  order_id uuid references public.lp_orders(id) on delete cascade,
  type text not null check(type in ('order_created', 'new_message', 'outbid', 'status_changed')),
  title text not null,
  body text,
  read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists lp_notifications_user_unread_idx on public.lp_notifications(user_id, created_at desc) where read = false;
create index if not exists lp_notifications_order_user_idx on public.lp_notifications(order_id, user_id);
create index if not exists lp_notifications_listing_user_idx on public.lp_notifications(listing_id, user_id);

alter table public.lp_notifications enable row level security;
revoke all on public.lp_notifications from anon, authenticated;
grant all on public.lp_notifications to service_role;

-- 2. Función para marcar como leídas las notificaciones de un pedido
create or replace function public.lp_mark_order_notifications_read(p_order uuid, p_actor uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare
  updated_count integer;
begin
  update public.lp_notifications
  set read = true,
      read_at = now()
  where order_id = p_order
    and user_id = p_actor
    and read = false;
  get diagnostics updated_count = row_count;
  return updated_count;
end $$;

-- 3. Función para marcar como leídas las notificaciones de un artículo (ej. puja superada)
create or replace function public.lp_mark_listing_notifications_read(p_listing uuid, p_actor uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare
  updated_count integer;
begin
  update public.lp_notifications
  set read = true,
      read_at = now()
  where listing_id = p_listing
    and user_id = p_actor
    and read = false;
  get diagnostics updated_count = row_count;
  return updated_count;
end $$;

-- 4. Actualizar lp_reserve para notificar al vendedor sobre una nueva compra/reserva
create or replace function public.lp_reserve(p_listing uuid,p_actor uuid) returns public.lp_orders language plpgsql security definer set search_path=public as $$
declare l public.lp_listings; o public.lp_orders; amount integer;
begin
 select * into l from lp_listings where id=p_listing for update;
 if not found then raise exception 'Artículo no encontrado'; end if;
 if l.seller_id=p_actor then raise exception 'No puedes comprar tu artículo'; end if;
 select * into o from lp_orders where listing_id=p_listing and buyer_id=p_actor and status='pending_payment' and expires_at>now();
 if found then return o; end if;
 if l.status<>'available' then raise exception 'Este artículo ya no está disponible'; end if;
 if l.mode='auction' and (l.buy_now_cents is null or l.ends_at<=now()) then raise exception 'Este artículo solo se adjudica por subasta'; end if;
 amount:=case when l.mode='auction' then l.buy_now_cents else l.price_cents end;
 insert into lp_orders(listing_id,buyer_id,seller_id,amount_cents,expires_at) values(l.id,p_actor,l.seller_id,amount+l.shipping_cents,now()+interval '48 hours') returning * into o;
 update lp_listings set status='reserved' where id=l.id;

 -- Notificar al vendedor de la nueva venta/reserva
 insert into public.lp_notifications(user_id, listing_id, order_id, type, title, body)
 values(l.seller_id, l.id, o.id, 'order_created', 'Nueva venta · Artículo reservado', 'Un comprador ha reservado tu artículo. Coordina el pago y la entrega en el chat.');

 return o;
end $$;

-- 5. Actualizar lp_send_message para notificar al receptor del mensaje
create or replace function public.lp_send_message(p_order uuid,p_actor uuid,p_content text) returns public.lp_messages language plpgsql security definer set search_path=public as $$
declare o public.lp_orders; m public.lp_messages; recipient_id uuid; clean_content text;
begin
 select * into o from lp_orders where id=p_order for update;
 if not found or p_actor not in(o.buyer_id,o.seller_id) or o.status not in ('pending_payment','paid','shipped','completed','disputed') then
  raise exception 'El chat se habilita durante la reserva o tras el pago y solo entre las partes del pedido';
 end if;
 clean_content := trim(p_content);
 insert into lp_messages(order_id,sender_id,content) values(p_order,p_actor,clean_content) returning * into m;
 recipient_id := case when p_actor = o.buyer_id then o.seller_id else o.buyer_id end;
 insert into public.lp_notifications(user_id, listing_id, order_id, type, title, body)
 values(recipient_id, o.listing_id, o.id, 'new_message', 'Nuevo mensaje', substring(clean_content from 1 for 120));
 return m;
end $$;

-- 6. Actualizar lp_bid para notificar al pujador cuya puja ha sido superada
create or replace function public.lp_bid(p_listing uuid,p_actor uuid,p_amount integer) returns public.lp_listings language plpgsql security definer set search_path=public as $$
declare l public.lp_listings; minimum integer; previous_bidder uuid;
begin
 select * into l from lp_listings where id=p_listing for update;
 if not found then raise exception 'Artículo no encontrado'; end if;
 if l.mode<>'auction' or l.status<>'available' or l.ends_at<=now() then raise exception 'Subasta cerrada'; end if;
 if l.seller_id=p_actor then raise exception 'No puedes pujar en tu subasta'; end if;
 previous_bidder := l.highest_bidder;
 minimum:=case when l.bid_count=0 then l.price_cents else l.price_cents+100 end;
 if p_amount<minimum or p_amount>1000000 then raise exception 'La puja no alcanza el mínimo permitido'; end if;
 if l.buy_now_cents is not null and p_amount>=l.buy_now_cents then raise exception 'Utiliza Comprar ahora para ese importe'; end if;
 insert into lp_bids(listing_id,bidder_id,amount_cents) values(p_listing,p_actor,p_amount);
 update lp_listings set price_cents=p_amount,bid_count=bid_count+1,highest_bidder=p_actor,
 ends_at=case when ends_at<now()+interval '2 minutes' then now()+interval '2 minutes' else ends_at end where id=p_listing returning * into l;

 -- Si había un pujador previo diferente al actual, avisar de sobrepuja
 if previous_bidder is not null and previous_bidder <> p_actor then
   insert into public.lp_notifications(user_id, listing_id, type, title, body)
   values(previous_bidder, l.id, 'outbid', 'Puja superada', 'Otro usuario ha realizado una puja superior en este artículo.');
 end if;
 return l;
end $$;

-- 7. Actualizar lp_confirm_in_person_payment para notificar al comprador
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

 insert into public.lp_notifications(user_id, listing_id, order_id, type, title, body)
 values(o.buyer_id, o.listing_id, o.id, 'status_changed', 'Pago en persona confirmado', 'El vendedor ha registrado el cobro en persona y completado la venta.');

 return o;
end $$;

-- 8. Actualizar lp_transition para notificar al comprador/vendedor según el evento
create or replace function public.lp_transition(p_order uuid,p_actor uuid,p_action text,p_tracking text default null) returns public.lp_orders language plpgsql security definer set search_path=public as $$
declare o public.lp_orders;
begin
 select * into o from lp_orders where id=p_order for update;
 if not found then raise exception 'Pedido no encontrado'; end if;
 if p_action='ship' and o.seller_id=p_actor and o.status='paid' then
  update lp_orders set status='shipped',tracking=p_tracking where id=o.id returning * into o;
  insert into public.lp_notifications(user_id, listing_id, order_id, type, title, body)
  values(o.buyer_id, o.listing_id, o.id, 'status_changed', 'Pedido enviado', 'El vendedor ha registrado el envío de tu pedido.');
 elsif p_action='complete' and o.buyer_id=p_actor and o.status in ('paid','shipped') then
  update lp_orders set status='completed' where id=o.id returning * into o;
  insert into public.lp_notifications(user_id, listing_id, order_id, type, title, body)
  values(o.seller_id, o.listing_id, o.id, 'status_changed', 'Entrega completada', 'El comprador ha confirmado la recepción satisfactoria.');
 else
  raise exception 'No puedes realizar esta acción en este pedido';
 end if;
 return o;
end $$;

-- 9. Actualizar permisos de ejecución
revoke execute on function public.lp_mark_order_notifications_read(uuid,uuid),
                           public.lp_mark_listing_notifications_read(uuid,uuid),
                           public.lp_reserve(uuid,uuid),
                           public.lp_send_message(uuid,uuid,text),
                           public.lp_bid(uuid,uuid,integer),
                           public.lp_confirm_in_person_payment(uuid,uuid),
                           public.lp_transition(uuid,uuid,text,text) from public,anon,authenticated;

grant execute on function public.lp_mark_order_notifications_read(uuid,uuid),
                          public.lp_mark_listing_notifications_read(uuid,uuid),
                          public.lp_reserve(uuid,uuid),
                          public.lp_send_message(uuid,uuid,text),
                          public.lp_bid(uuid,uuid,integer),
                          public.lp_confirm_in_person_payment(uuid,uuid),
                          public.lp_transition(uuid,uuid,text,text) to service_role;

commit;
