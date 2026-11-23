begin;

do $$
declare
 seller uuid := gen_random_uuid();
 buyer uuid := gen_random_uuid();
 listing uuid;
 reserved public.lp_orders;
 completed public.lp_orders;
 attached_session text := 'cs_test_' || gen_random_uuid()::text;
begin
 insert into auth.users(id,email)
 values(seller,seller||'@example.invalid'),(buyer,buyer||'@example.invalid');
 insert into public.lp_listings(seller_id,title,description,category,condition,location,images,mode,price_cents,delivery)
 values(seller,'Anuncio de prueba','Descripción para una compra de prueba.','Hogar','Buen estado','Madrid',
  array['https://example.invalid/item.jpg'],'sale',2500,'pickup') returning id into listing;
 reserved := public.lp_reserve(listing,buyer);
 update public.lp_orders set stripe_session_id=attached_session where id=reserved.id;

 begin
  perform public.lp_confirm_in_person_payment(reserved.id,buyer,attached_session);
  raise exception 'FAIL: buyer could confirm the seller payment';
 exception when raise_exception then
  if sqlerrm <> 'Solo el vendedor puede confirmar el pago en persona' then raise; end if;
 end;
 begin
  perform public.lp_confirm_in_person_payment(reserved.id,seller);
  raise exception 'FAIL: Checkout was not checked';
 exception when raise_exception then
  if sqlerrm <> 'El pedido tiene un Checkout activo o pendiente de verificar' then raise; end if;
 end;
 begin
  perform public.lp_confirm_in_person_payment(reserved.id,seller,'cs_test_different');
  raise exception 'FAIL: stale Checkout was accepted';
 exception when raise_exception then
  if sqlerrm <> 'El pedido tiene un Checkout activo o pendiente de verificar' then raise; end if;
 end;
 completed := public.lp_confirm_in_person_payment(reserved.id,seller,attached_session);
 if completed.status <> 'completed' or completed.payment_mode <> 'in_person'
    or completed.stripe_session_id is not null then raise exception 'FAIL: cash transition was not atomic'; end if;
 perform public.lp_confirm_in_person_payment(reserved.id,seller);
 if (select count(*) from public.lp_notifications where order_id=reserved.id and type='status_changed') <> 1
 then raise exception 'FAIL: cash retry emitted more than one notice'; end if;
 if (select status from public.lp_listings where id=listing) <> 'sold'
 then raise exception 'FAIL: cash did not close listing'; end if;
 if has_function_privilege('authenticated','public.lp_confirm_in_person_payment(uuid,uuid,text)','EXECUTE')
 then raise exception 'FAIL: privileged confirm exposed to browser'; end if;
end $$;

rollback;
select 'PASS: atomic cash transition, session comparison, owner, and retries' as result;
