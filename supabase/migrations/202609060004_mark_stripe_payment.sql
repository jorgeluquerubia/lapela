-- Keep real payment confirmations distinguishable from the sandbox path.
create or replace function public.lp_confirm_payment(p_event text,p_order uuid,p_session text,p_payment text,p_amount integer,p_address jsonb) returns void language plpgsql security definer set search_path=public as $$
declare o public.lp_orders;
begin
 if exists(select 1 from lp_payment_events where id=p_event) then return; end if;
 select * into o from lp_orders where id=p_order for update;
 if not found or o.stripe_session_id is distinct from p_session or o.amount_cents<>p_amount then raise exception 'El pago no coincide con el pedido'; end if;
 if o.status in ('paid','shipped','completed') and o.stripe_payment_id=p_payment then
  insert into lp_payment_events(id) values(p_event) on conflict do nothing; return;
 end if;
 if o.status<>'pending_payment' then raise exception 'Estado incompatible con el pago'; end if;
 update lp_orders set status='paid',payment_mode='stripe',stripe_payment_id=p_payment,shipping_address=p_address where id=o.id;
 update lp_listings set status='sold' where id=o.listing_id;
 insert into lp_payment_events(id) values(p_event);
end $$;
revoke execute on function public.lp_confirm_payment(text,uuid,text,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.lp_confirm_payment(text,uuid,text,text,integer,jsonb) to service_role;
