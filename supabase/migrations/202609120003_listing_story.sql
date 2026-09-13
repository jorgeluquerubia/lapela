-- LP-FEAT-017: Historias de los objetos. Campo nullable opcional de hasta 1.000 caracteres.
begin;

alter table public.lp_listings
  add column if not exists story text check(story is null or (length(story) between 1 and 1000));

commit;
