\set ON_ERROR_STOP on
begin isolation level repeatable read read only;

select 'listados' as entidad, count(*) as filas from public.lp_listings
union all select 'pedidos', count(*) from public.lp_orders
union all select 'pujas', count(*) from public.lp_bids
union all select 'avisos', count(*) from public.lp_notifications
union all select 'favoritos', count(*) from public.lp_favorites
union all select 'mensajes', count(*) from public.lp_messages
union all select 'valoraciones', count(*) from public.lp_reviews
union all select 'eventos de pago', count(*) from public.lp_payment_events;

with bid_totals as (
  select listing_id, count(*) as bids, max(amount_cents) as max_cents
  from public.lp_bids group by listing_id
), repeated_favorite_notices as (
  select count(*) as notices
  from (
    select created_at, lag(created_at) over (
      partition by user_id, listing_id order by created_at, id
    ) as previous_at
    from public.lp_notifications where type = 'favorite_received'
  ) as received where created_at - previous_at < interval '1 hour'
), findings as (
  select 'pedidos con comprador igual al vendedor o vendedor distinto al del anuncio' as comprobacion,
    count(*) as casos
  from public.lp_orders o join public.lp_listings l on l.id = o.listing_id
  where o.buyer_id = o.seller_id or o.seller_id <> l.seller_id
  union all
  select 'anuncios con más de un pedido activo', count(*) from (
    select listing_id from public.lp_orders where status not in ('cancelled','refunded')
    group by listing_id having count(*) > 1
  ) as repeated
  union all
  select 'reservados sin pedido pendiente o vendidos sin pedido cobrado', count(*)
  from public.lp_listings l where
    (l.status = 'reserved' and not exists (
      select 1 from public.lp_orders o where o.listing_id = l.id and o.status = 'pending_payment'
    )) or (l.status = 'sold' and not exists (
      select 1 from public.lp_orders o where o.listing_id = l.id
        and o.status in ('paid','shipped','completed','disputed','refunded')
    ))
  union all
  select 'pedidos con estado incompatible con el estado del anuncio', count(*)
  from public.lp_orders o join public.lp_listings l on l.id = o.listing_id
  where (o.status = 'pending_payment' and l.status <> 'reserved')
     or (o.status in ('paid','shipped','completed') and l.status <> 'sold')
  union all
  select 'pedidos activos cuyo importe no corresponde al anuncio y al envío', count(*)
  from public.lp_orders o join public.lp_listings l on l.id = o.listing_id
  where o.status in ('pending_payment','paid','shipped','completed')
    and o.amount_cents <> l.price_cents + l.shipping_cents
    and (l.mode <> 'auction' or l.buy_now_cents is null
      or o.amount_cents <> l.buy_now_cents + l.shipping_cents)
  union all
  select 'pedidos de Stripe cobrados sin sesión o identificador de pago', count(*)
  from public.lp_orders where payment_mode = 'stripe' and (
    stripe_session_id is null or stripe_payment_id is null
  )
  union all
  select 'pedidos completados en persona que conservan una sesión Stripe', count(*)
  from public.lp_orders where payment_mode = 'in_person' and stripe_session_id is not null
  union all
  select 'pedidos cobrados sin modo de pago', count(*)
  from public.lp_orders where status in ('paid','shipped','completed') and payment_mode is null
  union all
  select 'subastas cuyo contador, importe o mejor postor no concuerda con las pujas', count(*)
  from public.lp_listings l left join bid_totals b on b.listing_id = l.id
  where l.bid_count <> coalesce(b.bids, 0)
    or (b.bids is null and l.highest_bidder is not null)
    or (b.bids is not null and (
      l.mode <> 'auction' or l.price_cents <> b.max_cents or not exists (
        select 1 from public.lp_bids best where best.listing_id = l.id
          and best.bidder_id = l.highest_bidder and best.amount_cents = b.max_cents
      )
    ))
  union all
  select 'pujas o favoritos de un vendedor sobre su propio anuncio', (
    select count(*) from public.lp_bids b join public.lp_listings l on l.id=b.listing_id
    where b.bidder_id=l.seller_id
  ) + (
    select count(*) from public.lp_favorites f join public.lp_listings l on l.id=f.listing_id
    where f.user_id=l.seller_id
  )
  union all
  select 'mensajes con remitente ajeno al pedido', count(*)
  from public.lp_messages m join public.lp_orders o on o.id = m.order_id
  where m.sender_id not in (o.buyer_id, o.seller_id)
  union all
  select 'valoraciones de otra persona u otro pedido', count(*)
  from public.lp_reviews r join public.lp_orders o on o.id = r.order_id
  where not ((r.author_id=o.buyer_id and r.recipient_id=o.seller_id)
    or (r.author_id=o.seller_id and r.recipient_id=o.buyer_id))
    or o.status <> 'completed'
  union all
  select 'avisos de pedidos enviados a ajenos o ligados a otro anuncio', count(*)
  from public.lp_notifications n join public.lp_orders o on o.id = n.order_id
  where n.user_id not in (o.buyer_id, o.seller_id) or n.listing_id is distinct from o.listing_id
  union all
  select 'avisos cuyo estado de lectura no coincide con su fecha', count(*)
  from public.lp_notifications where read <> (read_at is not null)
  union all
  select 'avisos de favorito al mismo vendedor y anuncio en menos de una hora', notices
  from repeated_favorite_notices
  union all
  select 'avisos de pago duplicados para un pedido', count(*) from (
    select order_id from public.lp_notifications where type = 'payment_confirmed'
    group by order_id having count(*) > 1
  ) as repeated
) select * from findings order by comprobacion;

commit;
