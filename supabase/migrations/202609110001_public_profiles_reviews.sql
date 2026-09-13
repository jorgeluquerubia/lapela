-- Public identity and transaction-bound reputation. The app server remains the only caller.
begin;

create table public.lp_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 alias text not null unique check(alias ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
 alias_customized boolean not null default false,
 show_purchases boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.lp_reviews (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.lp_orders(id) on delete cascade,
 author_id uuid not null references auth.users(id),
 recipient_id uuid not null references auth.users(id),
 score smallint not null check(score between 1 and 5),
 comment text not null default '' check(length(comment) <= 500),
 created_at timestamptz not null default now(),
 check(author_id <> recipient_id),
 unique(order_id, author_id)
);

create index lp_profiles_alias on public.lp_profiles(alias);
create index lp_reviews_recipient_created on public.lp_reviews(recipient_id, created_at desc);
create index lp_reviews_order on public.lp_reviews(order_id);

-- Existing accounts get an opaque, stable fallback. It deliberately never uses email data.
insert into public.lp_profiles(id, alias)
select id, 'usuario-' || substring(replace(id::text, '-', '') from 1 for 12)
from auth.users
on conflict(id) do nothing;

alter table public.lp_profiles enable row level security;
alter table public.lp_reviews enable row level security;
revoke all on public.lp_profiles, public.lp_reviews from anon, authenticated;
grant all on public.lp_profiles, public.lp_reviews to service_role;

create or replace function public.lp_ensure_profile(p_actor uuid) returns public.lp_profiles
language plpgsql security definer set search_path=public as $$
declare p public.lp_profiles;
begin
 insert into lp_profiles(id, alias)
 values(p_actor, 'usuario-' || substring(replace(p_actor::text, '-', '') from 1 for 12))
 on conflict(id) do nothing;
 select * into p from lp_profiles where id=p_actor;
 return p;
end $$;

create or replace function public.lp_update_profile(p_actor uuid, p_alias text, p_show_purchases boolean)
returns public.lp_profiles language plpgsql security definer set search_path=public as $$
declare p public.lp_profiles; normalized text:=lower(trim(p_alias));
begin
 perform lp_ensure_profile(p_actor);
 select * into p from lp_profiles where id=p_actor for update;
 if normalized !~ '^[a-z0-9][a-z0-9_-]{2,29}$' or normalized like 'usuario-%' then
  raise exception 'El alias debe tener entre 3 y 30 caracteres: letras minúsculas, números, guiones o guiones bajos.';
 end if;
 if p.alias_customized and p.alias <> normalized then
  raise exception 'Tu alias ya está fijado. Contacta con soporte si necesitas cambiarlo.';
 end if;
 if exists(select 1 from lp_profiles where alias=normalized and id<>p_actor) then
  raise exception 'Ese alias ya está en uso.';
 end if;
 update lp_profiles
 set alias=normalized,
     alias_customized=true,
     show_purchases=coalesce(p_show_purchases, false),
     updated_at=now()
 where id=p_actor
 returning * into p;
 return p;
end $$;

create or replace function public.lp_create_review(p_order uuid, p_actor uuid, p_score smallint, p_comment text default '')
returns public.lp_reviews language plpgsql security definer set search_path=public as $$
declare o public.lp_orders; r public.lp_reviews; recipient uuid;
begin
 select * into o from lp_orders where id=p_order for update;
 if not found or o.status <> 'completed' then
  raise exception 'Solo puedes valorar un pedido completado.';
 end if;
 if p_actor=o.buyer_id then recipient:=o.seller_id;
 elsif p_actor=o.seller_id then recipient:=o.buyer_id;
 else raise exception 'No puedes valorar este pedido.';
 end if;
 if p_score not between 1 and 5 then raise exception 'Elige una puntuación entre 1 y 5 estrellas.'; end if;
 if length(trim(coalesce(p_comment,''))) > 500 then raise exception 'El comentario no puede superar 500 caracteres.'; end if;
 insert into lp_reviews(order_id, author_id, recipient_id, score, comment)
 values(p_order, p_actor, recipient, p_score, trim(coalesce(p_comment,'')))
 returning * into r;
 return r;
exception when unique_violation then
 raise exception 'Ya has valorado este pedido.';
end $$;

revoke execute on function public.lp_ensure_profile(uuid), public.lp_update_profile(uuid,text,boolean), public.lp_create_review(uuid,uuid,smallint,text) from public, anon, authenticated;
grant execute on function public.lp_ensure_profile(uuid), public.lp_update_profile(uuid,text,boolean), public.lp_create_review(uuid,uuid,smallint,text) to service_role;
commit;
