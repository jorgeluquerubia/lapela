begin;

create table public.lp_saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  environment text not null check (environment in ('sandbox','live')),
  category text not null default '' check (length(category) <= 50),
  mode text not null default '' check (mode in ('','sale','auction')),
  location text not null default '' check (length(location) <= 80),
  min_cents integer not null default 0 check (min_cents >= 0),
  max_cents integer not null default 1000000 check (max_cents <= 1000000),
  created_at timestamptz not null default now(),
  check (min_cents <= max_cents),
  check (category <> '' or mode <> '' or location <> '' or min_cents > 0 or max_cents < 1000000),
  unique (user_id, environment, category, mode, location, min_cents, max_cents)
);

create index lp_saved_searches_environment_category_idx on public.lp_saved_searches(environment, category);
alter table public.lp_saved_searches enable row level security;
revoke all on public.lp_saved_searches from public, anon, authenticated;
grant select, insert, update, delete on public.lp_saved_searches to service_role;

alter table public.lp_notifications drop constraint lp_notifications_type_check;
alter table public.lp_notifications add constraint lp_notifications_type_check check (type in (
  'order_created', 'new_message', 'outbid', 'status_changed', 'auction_won',
  'auction_sold', 'auction_ended', 'payment_confirmed', 'reservation_expired', 'bid_received',
  'favorite_auction_closing_soon', 'favorite_auction_ended', 'favorite_unavailable',
  'favorite_received', 'saved_search_match'
));

create function public.lp_notify_saved_searches() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.status <> 'available' then return new; end if;

  insert into public.lp_notifications(user_id, listing_id, environment, type, title, body)
  select distinct s.user_id, new.id, new.environment, 'saved_search_match',
    'Nuevo artículo en tu búsqueda', new.title
  from public.lp_saved_searches s
  where s.environment = new.environment
    and s.user_id <> new.seller_id
    and s.created_at <= new.created_at
    and (s.category = '' or s.category = new.category)
    and (s.mode = '' or s.mode = new.mode)
    and (s.location = '' or strpos(lower(new.location), s.location) > 0)
    and new.price_cents between s.min_cents and s.max_cents;
  return new;
end;
$$;

revoke execute on function public.lp_notify_saved_searches() from public, anon, authenticated;
create trigger lp_notify_saved_searches after insert on public.lp_listings
for each row execute function public.lp_notify_saved_searches();

create table public.lp_order_support (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.lp_orders(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('shipping','delivery','condition')),
  details text not null check (length(details) between 10 and 1000),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  unique (order_id, reporter_id, reason)
);

alter table public.lp_order_support enable row level security;
revoke all on public.lp_order_support from public, anon, authenticated;
grant select, insert, update on public.lp_order_support to service_role;

commit;
