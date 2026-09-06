begin;
alter table public.lp_listings add column environment text not null default 'sandbox' check(environment in ('sandbox','live'));
alter table public.lp_orders add column payment_mode text check(payment_mode in ('simulation','stripe'));
create function public.lp_simulate_payment(p_order uuid,p_actor uuid) returns public.lp_orders language plpgsql security definer set search_path=public as $$
declare o public.lp_orders; l public.lp_listings;
begin
 select * into o from lp_orders where id=p_order for update;
 if not found or o.buyer_id<>p_actor then raise exception 'No puedes confirmar este pedido'; end if;
 select * into l from lp_listings where id=o.listing_id;
 if l.environment<>'sandbox' or o.stripe_session_id is not null then raise exception 'La simulación solo está disponible para artículos de prueba'; end if;
 if o.status='paid' and o.payment_mode='simulation' then return o;end if;
 if o.status<>'pending_payment' or o.expires_at<=now() then raise exception 'La reserva ya no admite pagos';end if;
 update lp_orders set status='paid',payment_mode='simulation' where id=o.id returning * into o;
 update lp_listings set status='sold' where id=o.listing_id;
 return o;
end $$;
revoke execute on function public.lp_simulate_payment(uuid,uuid) from public,anon,authenticated;
grant execute on function public.lp_simulate_payment(uuid,uuid) to service_role;
commit;
