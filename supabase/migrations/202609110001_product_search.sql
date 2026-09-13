begin;

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function public.lp_unaccent(value text)
returns text
language plpgsql
immutable
strict
parallel safe
set search_path = extensions
as $$ begin return unaccent('unaccent', value); end; $$;

create or replace function public.lp_tags_text(value text[])
returns text
language plpgsql
immutable
strict
parallel safe
as $$ begin return array_to_string(value, ' '); end; $$;

alter table public.lp_listings
  add column if not exists tags text[] not null default '{}'::text[] check(cardinality(tags)<=5),
  add column if not exists search_title text not null default '',
  add column if not exists search_tags text not null default '',
  add column if not exists search_vector tsvector not null default ''::tsvector;

create or replace function public.lp_listings_refresh_search_document()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  new.search_title := public.lp_unaccent(lower(new.title));
  new.search_tags := public.lp_unaccent(lower(public.lp_tags_text(new.tags)));
  new.search_vector :=
    setweight(to_tsvector('spanish', public.lp_unaccent(new.title)), 'A') ||
    setweight(to_tsvector('spanish', public.lp_unaccent(public.lp_tags_text(new.tags))), 'B') ||
    setweight(to_tsvector('spanish', public.lp_unaccent(new.category)), 'C') ||
    setweight(to_tsvector('spanish', public.lp_unaccent(new.description)), 'D');
  return new;
end;
$$;

drop trigger if exists lp_listings_refresh_search_document on public.lp_listings;
create trigger lp_listings_refresh_search_document
before insert or update of title, tags, category, description on public.lp_listings
for each row execute function public.lp_listings_refresh_search_document();

update public.lp_listings
set
  search_title = public.lp_unaccent(lower(title)),
  search_tags = public.lp_unaccent(lower(public.lp_tags_text(tags))),
  search_vector =
    setweight(to_tsvector('spanish', public.lp_unaccent(title)), 'A') ||
    setweight(to_tsvector('spanish', public.lp_unaccent(public.lp_tags_text(tags))), 'B') ||
    setweight(to_tsvector('spanish', public.lp_unaccent(category)), 'C') ||
    setweight(to_tsvector('spanish', public.lp_unaccent(description)), 'D');

create table if not exists public.lp_search_aliases(
  alias text primary key check(alias=public.lp_unaccent(lower(trim(alias))) and length(alias) between 2 and 100),
  terms text[] not null check(cardinality(terms) between 1 and 8),
  created_at timestamptz not null default now()
);

insert into public.lp_search_aliases(alias,terms) values
  ('tele',array['tv','televisor','television']),
  ('tv',array['tele','televisor','television']),
  ('televisor',array['tele','tv','television']),
  ('television',array['tele','tv','televisor']),
  ('movil',array['telefono','smartphone']),
  ('telefono',array['movil','smartphone']),
  ('smartphone',array['movil','telefono']),
  ('bici',array['bicicleta']),
  ('cascos',array['auriculares']),
  ('zapas',array['zapatillas'])
on conflict(alias) do update set terms=excluded.terms;

create index if not exists lp_listings_search_vector_available_idx
  on public.lp_listings using gin(search_vector)
  where status='available';
create index if not exists lp_listings_search_title_available_idx
  on public.lp_listings using gin(search_title extensions.gin_trgm_ops)
  where status='available';
create index if not exists lp_listings_search_tags_available_idx
  on public.lp_listings using gin(search_tags extensions.gin_trgm_ops)
  where status='available';

create or replace function public.lp_search_listings(
  p_query text,
  p_environment text,
  p_category text default null,
  p_mode text default null,
  p_min_price_cents integer default null,
  p_max_price_cents integer default null,
  p_location text default null,
  p_sort text default 'relevance',
  p_limit integer default 12,
  p_offset integer default 0
) returns table(
  id uuid,
  title text,
  description text,
  category text,
  condition text,
  location text,
  images text[],
  tags text[],
  mode text,
  price_cents integer,
  buy_now_cents integer,
  shipping_cents integer,
  delivery text,
  ends_at timestamptz,
  status text,
  bid_count integer,
  created_at timestamptz,
  relevance real,
  total_count bigint
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  normalized_query text;
  alias_terms text;
  parsed_query tsquery;
begin
  normalized_query:=regexp_replace(public.lp_unaccent(lower(trim(coalesce(p_query,'')))), '\\s+', ' ', 'g');
  if normalized_query='' then return; end if;
  select string_agg(array_to_string(terms,' '),' ') into alias_terms
  from public.lp_search_aliases
  where alias=normalized_query or normalized_query=any(terms);
  parsed_query:=websearch_to_tsquery('spanish',normalized_query);
  if alias_terms is not null then
    parsed_query:=parsed_query||to_tsquery('spanish',regexp_replace(alias_terms,'\\s+',' | ','g'));
  end if;

  return query
  with ranked as (
    select l.*,
      (
        ts_rank_cd(l.search_vector,parsed_query,32)*4+
        case when l.search_title=normalized_query then 3
             when l.search_title like normalized_query||'%' then 1.5 else 0 end+
        case when normalized_query=any(l.tags) then 2 else 0 end+
        case when public.lp_unaccent(lower(l.category))=normalized_query then 1 else 0 end+
        case when char_length(normalized_query)>=3 then greatest(
          extensions.similarity(l.search_title,normalized_query),
          extensions.similarity(l.search_tags,normalized_query)
        )*.75 else 0 end
      )::real as score
    from public.lp_listings l
    where l.status='available'
      and l.environment=p_environment
      and (l.mode<>'auction' or l.ends_at>now())
      and (p_category is null or l.category=p_category)
      and (p_mode is null or l.mode=p_mode)
      and (p_min_price_cents is null or l.price_cents>=p_min_price_cents)
      and (p_max_price_cents is null or l.price_cents<=p_max_price_cents)
      and (p_location is null or public.lp_unaccent(lower(l.location)) like '%'||p_location||'%')
      and (
        l.search_vector@@parsed_query or
        (char_length(normalized_query)>=3 and (l.search_title%normalized_query or l.search_tags%normalized_query))
      )
  )
  select r.id,r.title,r.description,r.category,r.condition,r.location,r.images,r.tags,r.mode,r.price_cents,r.buy_now_cents,r.shipping_cents,r.delivery,r.ends_at,r.status,r.bid_count,r.created_at,r.score,count(*) over()
  from ranked r
  order by
    case when p_sort='price-asc' then r.price_cents end asc nulls last,
    case when p_sort='price-desc' then r.price_cents end desc nulls last,
    case when p_sort='ending' then r.ends_at end asc nulls last,
    case when p_sort='relevance' then r.score end desc nulls last,
    case when p_sort='recent' then r.created_at end desc nulls last,
    r.created_at desc
  offset greatest(p_offset,0) limit greatest(1,least(p_limit,24));
end;
$$;

alter table public.lp_search_aliases enable row level security;
revoke all on public.lp_search_aliases from public,anon,authenticated;
grant all on public.lp_search_aliases to service_role;
revoke all on function public.lp_search_listings(text,text,text,text,integer,integer,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.lp_search_listings(text,text,text,text,integer,integer,text,text,integer,integer) to service_role;

commit;
