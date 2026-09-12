-- LP-FEAT-019: Subastas destacadas y coordinadas (La Subasta de la Pela)
begin;

-- Personal autorizado de operación
create table if not exists public.lp_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'operator' check(role in ('operator', 'admin')),
  created_at timestamptz not null default now()
);

-- Edición editorial con ventana y cierre de referencia
create table if not exists public.lp_auction_editions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9_-]{2,80}$'),
  title text not null check(length(trim(title)) between 3 and 120),
  description text not null default '' check(length(trim(description)) <= 1000),
  environment text not null default 'sandbox' check(environment in ('sandbox', 'live')),
  starts_at timestamptz not null,
  reference_ends_at timestamptz not null,
  status text not null default 'draft' check(status in ('draft', 'published', 'cancelled')),
  image_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reference_ends_at > starts_at)
);

-- Asociación de subastas a una edición (una subasta solo puede pertenecer a una edición a la vez)
create table if not exists public.lp_auction_edition_items (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.lp_auction_editions(id) on delete cascade,
  listing_id uuid not null references public.lp_listings(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(edition_id, listing_id),
  unique(listing_id)
);

create index if not exists lp_auction_editions_env_status on public.lp_auction_editions(environment, status, starts_at);
create index if not exists lp_auction_edition_items_edition on public.lp_auction_edition_items(edition_id, sort_order);
create index if not exists lp_auction_edition_items_listing on public.lp_auction_edition_items(listing_id);

alter table public.lp_operators enable row level security;
alter table public.lp_auction_editions enable row level security;
alter table public.lp_auction_edition_items enable row level security;

revoke all on public.lp_operators, public.lp_auction_editions, public.lp_auction_edition_items from anon, authenticated;
grant all on public.lp_operators, public.lp_auction_editions, public.lp_auction_edition_items to service_role;

commit;
