begin;

alter table public.lp_orders alter column expires_at set default now() + interval '48 hours';

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
 return o;
end $$;

revoke execute on function public.lp_reserve(uuid,uuid) from public,anon,authenticated;
grant execute on function public.lp_reserve(uuid,uuid) to service_role;

commit;
