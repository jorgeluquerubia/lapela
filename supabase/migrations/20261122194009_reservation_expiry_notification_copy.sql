begin;

create or replace function public.lp_release(p_order uuid) returns void language plpgsql security definer set search_path=public as $$
declare
  o public.lp_orders;
  final_listing_status text;
begin
  select * into o from lp_orders where id=p_order for update;
  if not found or o.status<>'pending_payment' then return; end if;

  update lp_orders set status='cancelled' where id=o.id;
  update lp_listings
  set status=case when mode='auction' and ends_at<=now() then 'expired' else 'available' end
  where id=o.listing_id and status='reserved'
  returning status into final_listing_status;

  if final_listing_status='expired' then
    insert into lp_notifications(user_id,listing_id,order_id,type,title,body)
    values
      (o.buyer_id,o.listing_id,o.id,'reservation_expired','Reserva cancelada','La reserva ha caducado. La subasta ya había finalizado y el artículo ha quedado sin vender.'),
      (o.seller_id,o.listing_id,o.id,'reservation_expired','Reserva cancelada','La reserva ha caducado. La subasta ya había finalizado y el artículo ha quedado como finalizado sin venta.');
  else
    insert into lp_notifications(user_id,listing_id,order_id,type,title,body)
    values
      (o.buyer_id,o.listing_id,o.id,'reservation_expired','Reserva cancelada','La reserva ha caducado y el artículo ha vuelto a estar disponible.'),
      (o.seller_id,o.listing_id,o.id,'reservation_expired','Reserva cancelada','La reserva ha caducado y el artículo ha vuelto a estar disponible.');
  end if;
end $$;

revoke execute on function public.lp_release(uuid) from public,anon,authenticated;
grant execute on function public.lp_release(uuid) to service_role;

commit;
