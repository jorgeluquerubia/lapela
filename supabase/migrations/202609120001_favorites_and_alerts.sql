begin;

-- 1. Tabla de favoritos por usuario y anuncio
create table if not exists public.lp_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.lp_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists lp_favorites_user_idx on public.lp_favorites(user_id, created_at desc);
create index if not exists lp_favorites_listing_idx on public.lp_favorites(listing_id);

alter table public.lp_favorites enable row level security;
revoke all on public.lp_favorites from anon, authenticated;
grant all on public.lp_favorites to service_role;

-- 2. Actualizar tipos de notificación para soportar alertas de favoritos
alter table public.lp_notifications drop constraint if exists lp_notifications_type_check;
alter table public.lp_notifications add constraint lp_notifications_type_check check(type in (
  'order_created', 'new_message', 'outbid', 'status_changed', 'auction_won',
  'auction_sold', 'auction_ended', 'payment_confirmed', 'reservation_expired', 'bid_received',
  'favorite_auction_closing_soon', 'favorite_auction_ended', 'favorite_unavailable'
));

-- 3. Índice único parcial para deduplicación idempotente de alertas temporales y de indisponibilidad
create unique index if not exists lp_notifications_fav_alerts_uniq
on public.lp_notifications(user_id, listing_id, type)
where type in ('favorite_auction_closing_soon', 'favorite_auction_ended', 'favorite_unavailable');

-- 4. Función para guardar o retirar un artículo de favoritos de forma idempotente
create or replace function public.lp_set_favorite(p_listing uuid, p_actor uuid, p_active boolean default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare
  l public.lp_listings;
  current_fav boolean;
begin
  select * into l from lp_listings where id = p_listing;
  if not found then raise exception 'Artículo no encontrado'; end if;
  if l.seller_id = p_actor then raise exception 'No puedes añadir tu propio artículo a favoritos'; end if;

  select exists(select 1 from lp_favorites where user_id = p_actor and listing_id = p_listing) into current_fav;

  if p_active is null then
    if current_fav then
      delete from lp_favorites where user_id = p_actor and listing_id = p_listing;
      return false;
    else
      insert into lp_favorites(user_id, listing_id) values(p_actor, p_listing) on conflict do nothing;
      return true;
    end if;
  elsif p_active = true then
    insert into lp_favorites(user_id, listing_id) values(p_actor, p_listing) on conflict do nothing;
    return true;
  else
    delete from lp_favorites where user_id = p_actor and listing_id = p_listing;
    return false;
  end if;
end $$;

-- 5. Función para procesar avisos periódicos a seguidores de subastas y artículos favoritos
create or replace function public.lp_process_favorite_alerts()
returns integer language plpgsql security definer set search_path=public as $$
declare
  r record;
  n integer := 0;
begin
  -- Subastas favoritas a punto de terminar (en su última hora y disponibles)
  for r in
    select f.user_id, l.id as listing_id
    from lp_favorites f
    join lp_listings l on l.id = f.listing_id
    where l.mode = 'auction'
      and l.status = 'available'
      and l.ends_at > now()
      and l.ends_at <= now() + interval '1 hour'
      and f.user_id <> l.seller_id
  loop
    insert into lp_notifications(user_id, listing_id, type, title, body)
    values(
      r.user_id,
      r.listing_id,
      'favorite_auction_closing_soon',
      'Subasta por finalizar',
      'Una subasta que sigues finaliza en menos de una hora.'
    )
    on conflict do nothing;
    n := n + 1;
  end loop;

  -- Subastas favoritas finalizadas o artículos favoritos ya no disponibles
  for r in
    select f.user_id, l.id as listing_id, l.status, l.mode
    from lp_favorites f
    join lp_listings l on l.id = f.listing_id
    where l.status in ('sold', 'withdrawn', 'expired')
      and f.user_id <> l.seller_id
      and not exists (
        select 1 from lp_orders o
        where o.listing_id = l.id and o.buyer_id = f.user_id and o.status in ('paid', 'completed', 'pending_payment')
      )
  loop
    if r.mode = 'auction' and r.status = 'expired' then
      insert into lp_notifications(user_id, listing_id, type, title, body)
      values(
        r.user_id,
        r.listing_id,
        'favorite_auction_ended',
        'Subasta favorita finalizada',
        'La subasta que seguías ha concluido.'
      )
      on conflict do nothing;
    else
      insert into lp_notifications(user_id, listing_id, type, title, body)
      values(
        r.user_id,
        r.listing_id,
        'favorite_unavailable',
        'Artículo no disponible',
        case
          when r.status = 'sold' then 'Un artículo que guardaste en favoritos ya no está disponible (vendido).'
          when r.status = 'withdrawn' then 'Un artículo que guardaste en favoritos ha sido retirado.'
          else 'Un artículo que guardaste en favoritos ha finalizado.'
        end
      )
      on conflict do nothing;
    end if;
    n := n + 1;
  end loop;

  return n;
end $$;

-- 6. Actualizar permisos de ejecución
revoke execute on function public.lp_set_favorite(uuid,uuid,boolean),
                           public.lp_process_favorite_alerts() from public,anon,authenticated;

grant execute on function public.lp_set_favorite(uuid,uuid,boolean),
                          public.lp_process_favorite_alerts() to service_role;

commit;
