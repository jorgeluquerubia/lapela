# La Pela v2 · modelo funcional

## Regla central

Un anuncio publica un importe vinculante. El vendedor decide entre `sale` y `auction`. No existen contraofertas ni preguntas públicas que abran un canal de contacto. El único canal de conversación es `lp_messages`, cuyo `order_id` debe pertenecer a una orden pagada y a una de sus dos partes.

## Flujo de precio cerrado

1. La persona compradora inicia checkout.
2. `lp_reserve` bloquea el anuncio y crea una orden pendiente de pago.
3. En producción Stripe crea una sesión con importe calculado en servidor.
4. El webhook firmado comprueba importe, sesión, moneda e idempotencia antes de ejecutar `lp_confirm_payment`.
5. La orden pasa a `paid`, el anuncio a `sold` y se habilita el chat.

En beta, el paso 3 se sustituye por `lp_simulate_payment` sobre anuncios `sandbox`; nunca se llama a Stripe ni se presenta como cargo real.

## Flujo de subasta

Las pujas se escriben en `lp_bid`, que bloquea el anuncio, comprueba propietario, estado, fecha de cierre e incremento mínimo y actualiza precio, contador y máximo pujador en la misma transacción. Una puja dentro de los últimos dos minutos amplía el cierre. `lp_close_auctions` adjudica una sola orden al máximo pujador o marca la subasta como vencida.

## Transiciones

```text
available → reserved → sold → shipped → completed
available → expired
reserved → cancelled → available
paid → disputed/refunded
```

Las transiciones de vendedor y comprador están autorizadas en `lp_transition`; no se confía en el estado enviado por el navegador.

## Seguridad

- RLS deshabilita acceso directo del cliente a las tablas nuevas; los controladores usan el service role después de validar la sesión.
- Las rutas heredadas están retiradas y sus tablas antiguas no tienen privilegios para `anon` ni `authenticated`.
- Las fotos se comprueban por extensión, MIME, tamaño y firma binaria antes de subirlas.
- Los anuncios bloquean teléfonos, emails, enlaces, redes y direcciones de contacto.
- El webhook de Stripe exige firma y registra cada evento una sola vez.
