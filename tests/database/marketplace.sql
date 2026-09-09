begin;
-- Everything in this test is rolled back, including the synthetic accounts.
do $$
declare seller uuid:=gen_random_uuid(); buyer uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); item uuid; item2 uuid; auction uuid; ord public.lp_orders; ord2 public.lp_orders; l public.lp_listings; q public.lp_questions; blocked boolean;
begin
 insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data,aud,role,created_at,updated_at)
 values(seller,'lp-test-seller-'||seller||'@example.invalid','{}','{}','authenticated','authenticated',now(),now()),(buyer,'lp-test-buyer-'||buyer||'@example.invalid','{}','{}','authenticated','authenticated',now(),now()),(outsider,'lp-test-other-'||outsider||'@example.invalid','{}','{}','authenticated','authenticated',now(),now());
 insert into public.lp_listings(seller_id,title,description,category,condition,location,images,mode,price_cents,delivery) values(seller,'Artículo de prueba','Descripción completa de un artículo sintético para validación.','Hogar','Buen estado','Madrid',array['https://example.invalid/test.jpg'],'sale',2000,'pickup') returning id into item;
 blocked:=false;begin perform lp_ask_question(item,seller,'¿Puedo preguntarme a mí mismo?');exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL self question';end if;
 q:=lp_ask_question(item,buyer,'¿Incluye la caja original y accesorios?');
 if q.buyer_id<>buyer or q.seller_id<>seller or q.question<>'¿Incluye la caja original y accesorios?' or q.answer is not null then raise exception 'FAIL ask question';end if;
 blocked:=false;begin perform lp_answer_question(q.id,outsider,'Respuesta de tercero no autorizado');exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL outsider answer';end if;
 q:=lp_answer_question(q.id,seller,'Sí, incluye caja y cargador.');
 if q.answer<>'Sí, incluye caja y cargador.' or q.answered_at is null then raise exception 'FAIL seller answer';end if;
 blocked:=false;begin perform lp_reserve(item,seller);exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL self purchase';end if;
 ord:=lp_reserve(item,buyer);
 if ord.amount_cents<>2000 or ord.status<>'pending_payment' or ord.expires_at < now() + interval '47 hours' then raise exception 'FAIL reservation';end if;
 blocked:=false;begin perform lp_reserve(item,outsider);exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL double reservation';end if;
 perform lp_send_message(ord.id,buyer,'Mensaje durante la reserva');
 blocked:=false;begin perform lp_send_message(ord.id,outsider,'Intruso reserva');exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL outsider reservation chat';end if;
 update lp_orders set stripe_session_id='test_session_'||ord.id where id=ord.id;
 blocked:=false;begin perform lp_confirm_payment('bad_'||ord.id,ord.id,'test_session_'||ord.id,'test_payment_'||ord.id,1,null);exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL amount mismatch';end if;
 perform lp_confirm_payment('event_'||ord.id,ord.id,'test_session_'||ord.id,'test_payment_'||ord.id,2000,null);
 perform lp_confirm_payment('event_'||ord.id,ord.id,'test_session_'||ord.id,'test_payment_'||ord.id,2000,null);
 perform lp_send_message(ord.id,buyer,'¿Cuándo podemos organizar la recogida?');
 blocked:=false;begin perform lp_send_message(ord.id,outsider,'Acceso no permitido');exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL outsider chat';end if;
 blocked:=false;begin perform lp_transition(ord.id,buyer,'ship',null);exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL buyer ships';end if;
 perform lp_transition(ord.id,seller,'ship','Preparado');perform lp_transition(ord.id,buyer,'complete',null);
 insert into public.lp_listings(seller_id,title,description,category,condition,location,images,mode,price_cents,delivery) values(seller,'Artículo cobro en persona','Descripción válida para comprobar el cobro en persona.','Tecnología','Como nuevo','Madrid',array['https://example.invalid/ip.jpg'],'sale',1500,'pickup') returning id into item2;
 ord2:=lp_reserve(item2,buyer);
 blocked:=false;begin perform lp_confirm_in_person_payment(ord2.id,buyer);exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL buyer confirm in person';end if;
 blocked:=false;begin perform lp_confirm_in_person_payment(ord2.id,outsider);exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL outsider confirm in person';end if;
 ord2:=lp_confirm_in_person_payment(ord2.id,seller);
 if ord2.status<>'completed' or ord2.payment_mode<>'in_person' then raise exception 'FAIL in person order status';end if;
 if (select status from lp_listings where id=item2)<>'sold' then raise exception 'FAIL in person listing sold';end if;
 blocked:=false;begin perform lp_confirm_in_person_payment(ord2.id,seller);exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL in person already completed';end if;
 insert into public.lp_listings(seller_id,title,description,category,condition,location,images,mode,price_cents,delivery,ends_at) values(seller,'Subasta de prueba','Descripción completa de una subasta sintética para validación.','Hogar','Buen estado','Madrid',array['https://example.invalid/test.jpg'],'auction',1000,'pickup',now()+interval '60 seconds') returning id into auction;
 blocked:=false;begin perform lp_bid(auction,seller,1100);exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL self bid';end if;
 l:=lp_bid(auction,buyer,1000);if l.ends_at<now()+interval '119 seconds' then raise exception 'FAIL anti sniping';end if;
 blocked:=false;begin perform lp_bid(auction,outsider,1001);exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL minimum increment';end if;
 perform lp_bid(auction,outsider,1100);update lp_listings set ends_at=now()-interval '1 second' where id=auction;
 blocked:=false;begin perform lp_bid(auction,buyer,1200);exception when others then blocked:=true;end;if not blocked then raise exception 'FAIL expired bid';end if;
 perform lp_close_auctions();perform lp_close_auctions();
 if (select count(*) from lp_orders where listing_id=auction)<>1 then raise exception 'FAIL close idempotency';end if;
 if not exists(select 1 from lp_orders where listing_id=auction and buyer_id=outsider and amount_cents=1100) then raise exception 'FAIL winner';end if;
 if has_table_privilege('anon','lp_messages','SELECT') or has_table_privilege('authenticated','lp_orders','UPDATE') or has_function_privilege('authenticated','lp_confirm_payment(text,uuid,text,text,integer,jsonb)','EXECUTE') or has_function_privilege('authenticated','lp_confirm_in_person_payment(uuid,uuid)','EXECUTE') or has_table_privilege('anon','lp_questions','SELECT') or has_function_privilege('authenticated','lp_ask_question(uuid,uuid,text)','EXECUTE') then raise exception 'FAIL direct privilege';end if;
end $$;
rollback;
select 'PASS: ownership, questions, reservations, payment amount, payment idempotency, chat authorization, in-person payment, transitions, increments, expiry, anti-sniping, auction close, direct permissions' as result;

