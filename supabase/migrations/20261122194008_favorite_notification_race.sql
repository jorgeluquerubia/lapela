begin;

-- Mantiene los favoritos independientes, pero serializa la decisión antispam
-- del aviso agregado por vendedor y anuncio durante la transacción.
create or replace function public.lp_set_favorite(p_listing uuid, p_actor uuid, p_active boolean default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare
  l public.lp_listings;
  current_fav boolean;
  favorite_added boolean := false;
begin
  select * into l from public.lp_listings where id = p_listing;
  if not found then raise exception 'Artículo no encontrado'; end if;
  if l.seller_id = p_actor then raise exception 'No puedes añadir tu propio artículo a favoritos'; end if;

  select exists(
    select 1 from public.lp_favorites where user_id = p_actor and listing_id = p_listing
  ) into current_fav;

  if p_active is null then
    if current_fav then
      delete from public.lp_favorites where user_id = p_actor and listing_id = p_listing;
      return false;
    end if;
  elsif p_active = false then
    delete from public.lp_favorites where user_id = p_actor and listing_id = p_listing;
    return false;
  end if;

  insert into public.lp_favorites(user_id, listing_id)
  values(p_actor, p_listing)
  on conflict do nothing
  returning true into favorite_added;

  -- Solo una inserción nueva puede producir el aviso. El bloqueo se mantiene
  -- hasta el commit y hace atómica la consulta de ventana y la inserción.
  if coalesce(favorite_added, false) then
    perform pg_advisory_xact_lock(
      hashtextextended('lp_favorite_received:' || l.seller_id::text || ':' || p_listing::text, 0)
    );

    if not exists (
      select 1
      from public.lp_notifications
      where user_id = l.seller_id
        and listing_id = p_listing
        and type = 'favorite_received'
        and created_at > now() - interval '1 hour'
    ) then
      insert into public.lp_notifications(user_id, listing_id, type, title, body)
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
end $$;

revoke execute on function public.lp_set_favorite(uuid,uuid,boolean) from public, anon, authenticated;
grant execute on function public.lp_set_favorite(uuid,uuid,boolean) to service_role;

commit;
