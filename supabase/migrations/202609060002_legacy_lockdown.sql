-- Retire legacy access paths; retain every old row for audit/recovery.
begin;
do $$
declare legacy_table text;
begin
  foreach legacy_table in array array['products', 'orders', 'bids', 'questions', 'messages', 'shipping_addresses', 'profiles'] loop
    if to_regclass(format('public.%I', legacy_table)) is not null then
      execute format('revoke all on table public.%I from anon, authenticated', legacy_table);
    end if;
  end loop;
end $$;
do $$ declare f record; begin
for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('buy_product','get_conversations_for_user','create_order_and_reserve_product','pay_order_and_update_product') loop
 execute format('revoke execute on function %s from public, anon, authenticated',f.signature);
end loop;
end $$;
-- Public product images contain no private shipment data. New uploads are service-only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
commit;
