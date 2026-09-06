-- Retire legacy access paths; retain every old row for audit/recovery.
begin;
revoke all on public.products,public.orders,public.bids,public.questions,public.messages,public.shipping_addresses from anon,authenticated;
revoke all on public.profiles from anon,authenticated;
do $$ declare f record; begin
for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('buy_product','get_conversations_for_user','create_order_and_reserve_product','pay_order_and_update_product') loop
 execute format('revoke execute on function %s from public, anon, authenticated',f.signature);
end loop;
end $$;
-- Public product images contain no private shipment data. New uploads are service-only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
commit;
