begin;

-- 1. Añadir tipo de notificación para aviso de favorito al vendedor
alter table public.lp_notifications drop constraint if exists lp_notifications_type_check;
alter table public.lp_notifications add constraint lp_notifications_type_check check(type in (
  'order_created', 'new_message', 'outbid', 'status_changed', 'auction_won',
  'auction_sold', 'auction_ended', 'payment_confirmed', 'reservation_expired', 'bid_received',
  'favorite_auction_closing_soon', 'favorite_auction_ended', 'favorite_unavailable',
  'favorite_received'
));

-- 2. Actualizar función lp_set_favorite para notificar al vendedor cuando se añade un favorito
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
      -- Notificar al vendedor con ventana antispam de 1 hora y privacidad absoluta
      if not exists (
        select 1 from lp_notifications
        where user_id = l.seller_id
          and listing_id = p_listing
          and type = 'favorite_received'
          and created_at > now() - interval '1 hour'
      ) then
        insert into lp_notifications(user_id, listing_id, type, title, body)
        values(
          l.seller_id,
          p_listing,
          'favorite_received',
          'Artículo guardado',
          'Un usuario ha guardado «' || l.title || '» en favoritos.'
        );
      end if;
      return true;
    end if;
  elsif p_active = true then
    insert into lp_favorites(user_id, listing_id) values(p_actor, p_listing) on conflict do nothing;
    if not current_fav then
      if not exists (
        select 1 from lp_notifications
        where user_id = l.seller_id
          and listing_id = p_listing
          and type = 'favorite_received'
          and created_at > now() - interval '1 hour'
      ) then
        insert into lp_notifications(user_id, listing_id, type, title, body)
        values(
          l.seller_id,
          p_listing,
          'favorite_received',
          'Artículo guardado',
          'Un usuario ha guardado «' || l.title || '» en favoritos.'
        );
      end if;
    end if;
    return true;
  else
    delete from lp_favorites where user_id = p_actor and listing_id = p_listing;
    return false;
  end if;
end $$;

revoke execute on function public.lp_set_favorite(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.lp_set_favorite(uuid,uuid,boolean) to service_role;

commit;
