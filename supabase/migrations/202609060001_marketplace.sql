-- La Pela v2. New tables preserve all legacy data. Amounts are integer euro cents.
begin;
create table public.lp_listings (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references auth.users(id),
 title text not null check(length(title) between 5 and 100), description text not null check(length(description) between 30 and 4000),
 category text not null check(category in ('Tecnología','Hogar','Moda','Deporte','Coleccionismo','Otros')),
 condition text not null check(condition in ('Como nuevo','Buen estado','Con señales de uso')),
 location text not null check(length(location) between 2 and 80), images text[] not null check(cardinality(images) between 1 and 6),
 mode text not null check(mode in ('sale','auction')), price_cents integer not null check(price_cents between 100 and 1000000),
 buy_now_cents integer check(buy_now_cents between 100 and 1000000), shipping_cents integer not null default 0 check(shipping_cents between 0 and 10000),
 delivery text not null check(delivery in ('pickup','shipping')), ends_at timestamptz,
 status text not null default 'available' check(status in ('available','reserved','sold','expired','withdrawn')),
 bid_count integer not null default 0, highest_bidder uuid references auth.users(id), created_at timestamptz not null default now(),
 check((mode='auction' and ends_at is not null) or (mode='sale' and ends_at is null)), check(buy_now_cents is null or mode='auction')
);
create table public.lp_bids(id uuid primary key default gen_random_uuid(),listing_id uuid not null references public.lp_listings(id),bidder_id uuid not null references auth.users(id),amount_cents integer not null check(amount_cents>0),created_at timestamptz not null default now());
create table public.lp_orders(
 id uuid primary key default gen_random_uuid(),listing_id uuid not null references public.lp_listings(id),buyer_id uuid not null references auth.users(id),seller_id uuid not null references auth.users(id),
 amount_cents integer not null check(amount_cents>0),status text not null default 'pending_payment' check(status in ('pending_payment','paid','shipped','completed','cancelled','refunded','disputed')),
 expires_at timestamptz not null default now()+interval '31 minutes',stripe_session_id text unique,stripe_payment_id text unique,shipping_address jsonb,
 tracking text,created_at timestamptz not null default now(), check(buyer_id<>seller_id)
);
create unique index lp_one_active_order on public.lp_orders(listing_id) where status not in ('cancelled','refunded');
create table public.lp_messages(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.lp_orders(id),sender_id uuid not null references auth.users(id),content text not null check(length(content) between 1 and 2000),created_at timestamptz not null default now());
create table public.lp_accounts(user_id uuid primary key references auth.users(id),stripe_account_id text not null unique);
create table public.lp_reports(id uuid primary key default gen_random_uuid(),reporter_id uuid not null references auth.users(id),listing_id uuid references public.lp_listings(id),order_id uuid references public.lp_orders(id),reason text not null check(length(reason) between 10 and 2000),status text not null default 'open',created_at timestamptz not null default now(),check(listing_id is not null or order_id is not null));
create table public.lp_payment_events(id text primary key,created_at timestamptz not null default now());
create index lp_catalog on public.lp_listings(status,category,created_at desc);
create index lp_orders_buyer on public.lp_orders(buyer_id,created_at desc);
create index lp_orders_seller on public.lp_orders(seller_id,created_at desc);
create index lp_messages_order on public.lp_messages(order_id,created_at);
-- App servers validate Supabase users. Mutations are service-only, including RPCs.
alter table public.lp_listings enable row level security;
alter table public.lp_bids enable row level security;
alter table public.lp_orders enable row level security;
alter table public.lp_messages enable row level security;
alter table public.lp_accounts enable row level security;
alter table public.lp_reports enable row level security;
alter table public.lp_payment_events enable row level security;
revoke all on public.lp_listings,public.lp_bids,public.lp_orders,public.lp_messages,public.lp_accounts,public.lp_reports,public.lp_payment_events from anon,authenticated;
grant all on public.lp_listings,public.lp_bids,public.lp_orders,public.lp_messages,public.lp_accounts,public.lp_reports,public.lp_payment_events to service_role;

create function public.lp_bid(p_listing uuid,p_actor uuid,p_amount integer) returns public.lp_listings language plpgsql security definer set search_path=public as $$
declare l public.lp_listings; minimum integer;
begin
 select * into l from lp_listings where id=p_listing for update;
 if not found then raise exception 'Artículo no encontrado'; end if;
 if l.seller_id=p_actor then raise exception 'No puedes pujar por tu artículo'; end if;
 if l.mode<>'auction' or l.status<>'available' or l.ends_at<=now() then raise exception 'Esta subasta ya no admite pujas'; end if;
 minimum:=case when l.bid_count=0 then l.price_cents else l.price_cents+100 end;
 if p_amount<minimum or p_amount>1000000 then raise exception 'La puja no alcanza el mínimo permitido'; end if;
 if l.buy_now_cents is not null and p_amount>=l.buy_now_cents then raise exception 'Utiliza Comprar ahora para ese importe'; end if;
 insert into lp_bids(listing_id,bidder_id,amount_cents) values(p_listing,p_actor,p_amount);
 update lp_listings set price_cents=p_amount,bid_count=bid_count+1,highest_bidder=p_actor,
 ends_at=case when ends_at<now()+interval '2 minutes' then now()+interval '2 minutes' else ends_at end where id=p_listing returning * into l;
 return l;
end $$;
create function public.lp_reserve(p_listing uuid,p_actor uuid) returns public.lp_orders language plpgsql security definer set search_path=public as $$
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
 insert into lp_orders(listing_id,buyer_id,seller_id,amount_cents) values(l.id,p_actor,l.seller_id,amount+l.shipping_cents) returning * into o;
 update lp_listings set status='reserved' where id=l.id;
 return o;
end $$;
create function public.lp_close_auctions() returns integer language plpgsql security definer set search_path=public as $$
declare l public.lp_listings; n integer:=0;
begin
 for l in select * from lp_listings where mode='auction' and status='available' and ends_at<=now() for update skip locked loop
 if l.highest_bidder is null then update lp_listings set status='expired' where id=l.id;
 else
 insert into lp_orders(listing_id,buyer_id,seller_id,amount_cents,expires_at) values(l.id,l.highest_bidder,l.seller_id,l.price_cents+l.shipping_cents,now()+interval '24 hours');
 update lp_listings set status='reserved' where id=l.id;
 end if; n:=n+1;
 end loop; return n;
end $$;
create function public.lp_confirm_payment(p_event text,p_order uuid,p_session text,p_payment text,p_amount integer,p_address jsonb) returns void language plpgsql security definer set search_path=public as $$
declare o public.lp_orders;
begin
 if exists(select 1 from lp_payment_events where id=p_event) then return; end if;
 select * into o from lp_orders where id=p_order for update;
 if not found or o.stripe_session_id is distinct from p_session or o.amount_cents<>p_amount then raise exception 'El pago no coincide con el pedido'; end if;
 if o.status in ('paid','shipped','completed') and o.stripe_payment_id=p_payment then
 insert into lp_payment_events(id) values(p_event) on conflict do nothing; return; end if;
 if o.status<>'pending_payment' then raise exception 'Estado incompatible con el pago'; end if;
 update lp_orders set status='paid',stripe_payment_id=p_payment,shipping_address=p_address where id=o.id;
 update lp_listings set status='sold' where id=o.listing_id;
 insert into lp_payment_events(id) values(p_event);
end $$;
create function public.lp_transition(p_order uuid,p_actor uuid,p_action text,p_tracking text default null) returns public.lp_orders language plpgsql security definer set search_path=public as $$
declare o public.lp_orders;
begin
 select * into o from lp_orders where id=p_order for update;
 if not found then raise exception 'Pedido no encontrado'; end if;
 if p_action='ship' and o.seller_id=p_actor and o.status='paid' then
 update lp_orders set status='shipped',tracking=p_tracking where id=o.id returning * into o;
 elsif p_action='complete' and o.buyer_id=p_actor and o.status in ('paid','shipped') then
 update lp_orders set status='completed' where id=o.id returning * into o;
 else raise exception 'No puedes realizar esta acción en este pedido'; end if;
 return o;
end $$;
create function public.lp_release(p_order uuid) returns void language plpgsql security definer set search_path=public as $$
declare o public.lp_orders;
begin
 select * into o from lp_orders where id=p_order for update;
 if not found or o.status<>'pending_payment' then return; end if;
 update lp_orders set status='cancelled' where id=o.id;
 update lp_listings set status=case when mode='auction' and ends_at<=now() then 'expired' else 'available' end where id=o.listing_id and status='reserved';
end $$;
create function public.lp_send_message(p_order uuid,p_actor uuid,p_content text) returns public.lp_messages language plpgsql security definer set search_path=public as $$
declare o public.lp_orders; m public.lp_messages;
begin
 select * into o from lp_orders where id=p_order for update;
 if not found or p_actor not in(o.buyer_id,o.seller_id) or o.status not in ('paid','shipped','completed','disputed') then raise exception 'El chat se habilita solo después del pago y entre las partes del pedido'; end if;
 insert into lp_messages(order_id,sender_id,content) values(p_order,p_actor,trim(p_content)) returning * into m;
 return m;
end $$;
revoke execute on function public.lp_bid(uuid,uuid,integer),public.lp_reserve(uuid,uuid),public.lp_close_auctions(),public.lp_confirm_payment(text,uuid,text,text,integer,jsonb),public.lp_transition(uuid,uuid,text,text),public.lp_release(uuid),public.lp_send_message(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.lp_bid(uuid,uuid,integer),public.lp_reserve(uuid,uuid),public.lp_close_auctions(),public.lp_confirm_payment(text,uuid,text,text,integer,jsonb),public.lp_transition(uuid,uuid,text,text),public.lp_release(uuid),public.lp_send_message(uuid,uuid,text) to service_role;
commit;
