begin;

alter table public.lp_notifications add column if not exists environment text;

update public.lp_notifications n
set environment = coalesce(
  (select l.environment from public.lp_listings l where l.id = n.listing_id),
  (select l.environment from public.lp_orders o join public.lp_listings l on l.id = o.listing_id where o.id = n.order_id),
  'sandbox'
)
where n.environment is null;

alter table public.lp_notifications alter column environment set default 'sandbox';
alter table public.lp_notifications alter column environment set not null;
alter table public.lp_notifications drop constraint if exists lp_notifications_environment_check;
alter table public.lp_notifications add constraint lp_notifications_environment_check check (environment in ('sandbox', 'live'));
create index if not exists lp_notifications_user_environment_unread_idx on public.lp_notifications(user_id, environment, created_at desc) where read = false;

create or replace function public.lp_derive_notification_environment()
returns trigger language plpgsql security definer set search_path=public as $$
declare derived_environment text;
begin
  if new.listing_id is not null then
    select environment into derived_environment from public.lp_listings where id = new.listing_id;
  elsif new.order_id is not null then
    select l.environment into derived_environment from public.lp_orders o join public.lp_listings l on l.id = o.listing_id where o.id = new.order_id;
  end if;
  new.environment := coalesce(derived_environment, new.environment, 'sandbox');
  return new;
end $$;

drop trigger if exists lp_notifications_environment_derive on public.lp_notifications;
create trigger lp_notifications_environment_derive
before insert or update of listing_id, order_id, environment on public.lp_notifications
for each row execute function public.lp_derive_notification_environment();

create or replace function public.lp_mark_order_notifications_read(p_order uuid, p_actor uuid, p_environment text)
returns integer language plpgsql security definer set search_path=public as $$
declare updated_count integer;
begin
  if p_environment not in ('sandbox', 'live') then raise exception 'Entorno de notificación no válido'; end if;
  update public.lp_notifications
  set read = true, read_at = now()
  where order_id = p_order and user_id = p_actor and environment = p_environment and read = false;
  get diagnostics updated_count = row_count;
  return updated_count;
end $$;

create or replace function public.lp_mark_listing_notifications_read(p_listing uuid, p_actor uuid, p_environment text)
returns integer language plpgsql security definer set search_path=public as $$
declare updated_count integer;
begin
  if p_environment not in ('sandbox', 'live') then raise exception 'Entorno de notificación no válido'; end if;
  update public.lp_notifications
  set read = true, read_at = now()
  where listing_id = p_listing and order_id is null and user_id = p_actor and environment = p_environment and read = false;
  get diagnostics updated_count = row_count;
  return updated_count;
end $$;

revoke execute on function public.lp_mark_order_notifications_read(uuid,uuid,text), public.lp_mark_listing_notifications_read(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.lp_mark_order_notifications_read(uuid,uuid,text), public.lp_mark_listing_notifications_read(uuid,uuid,text) to service_role;

commit;
