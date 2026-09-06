begin;

create table if not exists public.lp_questions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.lp_listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id),
  seller_id uuid not null references auth.users(id),
  question text not null check(length(trim(question)) between 5 and 1000),
  answer text check(answer is null or length(trim(answer)) between 2 and 1000),
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  seller_notified boolean not null default false,
  buyer_notified boolean not null default false,
  check (buyer_id <> seller_id)
);

create index if not exists lp_questions_listing_idx on public.lp_questions(listing_id, created_at desc);
create index if not exists lp_questions_seller_pending_idx on public.lp_questions(seller_id, created_at desc) where answer is null;
create index if not exists lp_questions_buyer_idx on public.lp_questions(buyer_id, created_at desc);

alter table public.lp_questions enable row level security;
revoke all on public.lp_questions from anon, authenticated;
grant all on public.lp_questions to service_role;

create or replace function public.lp_ask_question(
  p_listing uuid,
  p_actor uuid,
  p_question text
) returns public.lp_questions language plpgsql security definer set search_path=public as $$
declare
  l public.lp_listings;
  q public.lp_questions;
  clean_question text;
begin
  clean_question := trim(p_question);
  if length(clean_question) < 5 or length(clean_question) > 1000 then
    raise exception 'La pregunta debe tener entre 5 y 1000 caracteres';
  end if;

  select * into l from lp_listings where id = p_listing for update;
  if not found then
    raise exception 'Artículo no encontrado';
  end if;

  if l.seller_id = p_actor then
    raise exception 'No puedes hacer preguntas en tu propio anuncio';
  end if;

  if l.status not in ('available', 'reserved') then
    raise exception 'Este artículo ya no admite preguntas';
  end if;

  insert into lp_questions(listing_id, buyer_id, seller_id, question)
  values(l.id, p_actor, l.seller_id, clean_question)
  returning * into q;

  return q;
end $$;

create or replace function public.lp_answer_question(
  p_question_id uuid,
  p_actor uuid,
  p_answer text
) returns public.lp_questions language plpgsql security definer set search_path=public as $$
declare
  q public.lp_questions;
  clean_answer text;
begin
  clean_answer := trim(p_answer);
  if length(clean_answer) < 2 or length(clean_answer) > 1000 then
    raise exception 'La respuesta debe tener entre 2 y 1000 caracteres';
  end if;

  select * into q from lp_questions where id = p_question_id for update;
  if not found then
    raise exception 'Pregunta no encontrada';
  end if;

  if q.seller_id <> p_actor then
    raise exception 'Solo el vendedor del producto puede responder a esta pregunta';
  end if;

  update lp_questions
  set answer = clean_answer,
      answered_at = now(),
      seller_notified = true
  where id = q.id
  returning * into q;

  return q;
end $$;

revoke execute on function public.lp_ask_question(uuid, uuid, text), public.lp_answer_question(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.lp_ask_question(uuid, uuid, text), public.lp_answer_question(uuid, uuid, text) to service_role;

commit;
