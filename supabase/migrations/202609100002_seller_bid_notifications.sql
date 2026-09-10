begin;

alter table public.lp_notifications drop constraint if exists lp_notifications_type_check;
alter table public.lp_notifications add constraint lp_notifications_type_check check(type in (
  'order_created', 'new_message', 'outbid', 'status_changed', 'auction_won',
  'auction_sold', 'auction_ended', 'payment_confirmed', 'reservation_expired', 'bid_received'
));

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
 if previous_bidder is not null and previous_bidder <> p_actor then
   insert into public.lp_notifications(user_id,listing_id,type,title,body)
   values(previous_bidder,l.id,'outbid','Puja superada','Otro usuario ha realizado una puja superior en este artículo.');
 end if;
 insert into public.lp_notifications(user_id,listing_id,type,title,body)
 values(l.seller_id,l.id,'bid_received','Nueva puja','Un usuario ha realizado una puja válida en tu subasta.');
 return l;
end $$;

revoke execute on function public.lp_bid(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.lp_bid(uuid,uuid,integer) to service_role;

commit;
