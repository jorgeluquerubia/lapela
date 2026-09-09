---
id: LP-FEAT-009
type: FEATURE
status: VERIFIED
priority: P1
requested_at: 2026-09-09
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/25
related_specs: [LP-FEAT-006, LP-FEAT-007]
dependencies: []
cross_cutting_concerns: [notificaciones, ux, mensajeria]
---

# LP-FEAT-009 · Badges de novedades en artículos y ajustes informativos de reserva

## 1. Solicitud original

> "aplica estos cambios y ademas quiero que cuando un vendedor o comprador tiene alguna actualizacion de su pedido, le aparezca un badget de notificaciones en sus articulos que sea visible, y no desaparezca hasta que no entra a verlo. Uno por cada articulo que tiene alguna novedad. Por ejemplo soy un vendedor y me han comprado un articulo (una puja de subasta no cuenta). O soy un comprador y me han escrito por chat (o viceversa), o soy comprador y han sobrepasado mi puja, en definitiva cualquier cambio que afecte a uno de mis articulos ya sea como comprador o como vendedor"

## 2. Contexto y problema

- **Problema u oportunidad:** Tras habilitar el chat desde la reserva de 48 horas (LP-FEAT-007), los textos estáticos en la ficha del producto y en la página informativa conservaban la mención desactualizada de que el chat requiere confirmación de pago previa. Además, cuando un vendedor visita un anuncio propio reservado, no recibe indicación de cómo acceder al chat del pedido activo. Por otro lado, no existía un sistema visible de avisos en los artículos para alertar a compradores y vendedores de eventos críticos (ventas realizadas, nuevos mensajes de chat recibidos, pujas de subasta superadas o actualizaciones de estado del pedido).
- **Personas afectadas:** Compradores y vendedores del marketplace.
- **Impacto actual:** Pérdida de contexto, falta de respuesta rápida a mensajes de chat, desconocimiento de compras pendientes de entrega o cobro, y subastas perdidas sin enterarse a tiempo.
- **Evidencia disponible:** Mensajes de confusión del usuario al probar el flujo de compra y solicitud explícita de badges persistentes por artículo.

## 3. Resultado esperado

1. Los textos informativos reflejan con precisión que el chat privado se abre de forma inmediata al reservar el artículo por 48 horas.
2. Si un vendedor accede a la ficha pública de un artículo suyo reservado, se le muestra un banner con acceso directo al pedido para coordinar entrega y cobro.
3. Se implementa un modelo de notificaciones (`lp_notifications`) que registra eventos relevantes por artículo:
   - Al vendedor: cuando su artículo es comprado/reservado (`order_created`). Las pujas de subasta normales no generan notificación de venta.
   - A cualquiera de las dos partes: cuando la otra parte escribe un mensaje en el chat (`new_message`).
   - Al comprador en subasta: cuando otro usuario realiza una puja superior desbancando la suya (`outbid`).
   - A las partes: cuando el estado del pedido avanza (`status_changed`: pagado, enviado, completado, cancelado).
4. En **Mi actividad** (`/my-products`), cada fila de artículo o pedido con novedades muestra un badge visible (ej. *«Nueva venta»*, *«Nuevo mensaje»*, *«Puja superada»*), y las pestañas muestran el recuento de novedades pendientes.
5. El badge **no desaparece hasta que el usuario entra a ver el pedido o el artículo** (persistencia de estado no leído).
6. El enlace de cabecera a **Mi actividad** muestra un indicador visual cuando existen novedades sin leer.

## 4. Alcance

### Incluido

- Tabla de base de datos `lp_notifications` con RLS y persistencia de lectura (`read`, `read_at`).
- Disparadores en `lp_reserve`, `lp_send_message`, `lp_bid` y transiciones de pedido para generar las notificaciones pertinentes.
- Despacho y marcado de lectura automático al consultar el pedido (`GET /api/order/[id]`) o endpoint de lectura de notificaciones.
- Badges visuales en `/my-products` (pestañas y tarjetas/filas de compras, ventas y pujas).
- Indicador de novedades en la cabecera del portal (`Header`).
- Banner directo al pedido en `ProductDetailInteractive` para vendedores con artículo reservado.
- Actualización de textos estáticos en `ProductDetailInteractive` y `/como-funciona`.

### Excluido

- Notificaciones push o envío de correos electrónicos externos (fuera de alcance en esta fase beta).
- Notificaciones de pujas ordinarias dirigidas al vendedor mientras la subasta siga abierta sin ganador.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Cuando un comprador reserva un artículo, el sistema debe registrar una notificación no leída para el vendedor (`order_created`).
- `RF-02`: Cuando una de las partes envía un mensaje en el chat de un pedido, el sistema debe registrar una notificación no leída para la otra parte (`new_message`).
- `RF-03`: Cuando un usuario supera la puja más alta en una subasta, el sistema debe registrar una notificación no leída para el pujador desbancado (`outbid`). Una puja nueva no genera notificación para el vendedor.
- `RF-04`: En la pantalla de Mi actividad (`/my-products`), cada artículo con novedades no leídas debe mostrar un badge visible indicando la naturaleza de la novedad.
- `RF-05`: Las novedades no leídas deben mantenerse visibles hasta que el usuario entre efectivamente a ver el pedido (`/orders/[id]`) o el artículo/subasta correspondiente.
- `RF-06`: Si el vendedor entra a la ficha de su anuncio cuando se encuentra reservado, debe mostrarse un banner informativo con enlace para gestionar la venta y abrir el chat.
- `RF-07`: Los textos informativos de la ficha de detalle y de la página `/como-funciona` deben certificar que el chat se abre al reservar el artículo por 48 horas.

### Requisitos no funcionales

- `RNF-01`: El marcado de lectura de notificaciones debe realizarse de forma transparente sin bloquear la carga de la vista del pedido.
- `RNF-02`: Las políticas de RLS deben impedir que un usuario pueda consultar o manipular notificaciones pertenecientes a otro usuario.

### Reglas de negocio

- `RN-01`: Una puja intermedia en una subasta no se considera venta ni genera alerta al vendedor; solo la puja superada genera alerta al comprador anterior.
- `RN-02`: Las notificaciones de un pedido solo se limpian cuando el usuario destinatario accede a la pantalla de detalle de ese pedido concreto.

## 6. Criterios de aceptación

- [x] `AC-01` Una nueva compra/reserva crea una notificación no leída de venta para el vendedor y muestra un badge en su pestaña de "Ventas".
- [x] `AC-02` Un nuevo mensaje en el chat del pedido crea una notificación no leída para la contraparte y muestra un badge de mensaje en el artículo.
- [x] `AC-03` Al acceder a la página del pedido (`/orders/[id]`), las notificaciones de ese pedido para ese usuario se marcan como leídas y el badge desaparece al refrescar o volver a Mi actividad.
- [x] `AC-04` Una sobrepuja en subasta crea una notificación `outbid` para el pujador anterior superado, mostrando un badge en "Mis pujas".
- [x] `AC-05` En la ficha pública del producto, el vendedor de un artículo reservado ve un aviso con acceso directo a Mi actividad/pedido, y los textos informativos explican la apertura del chat desde la reserva.

## 7. Experiencia y estados

- **Estados normales:** Cada artículo con eventos pendientes muestra un distintivo (`badge`) claro (ej. `Nueva venta`, `Nuevo mensaje`, `Puja superada`). Las pestañas muestran el conteo de elementos con novedades.
- **Estados vacíos:** Sin novedades, las tarjetas se muestran limpias sin distintivos artificiales.
- **Mensajes y accesibilidad:** Los badges cuentan con etiquetas semánticas y contraste adecuado.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Tabla `public.lp_notifications` con columnas `(id, user_id, listing_id, order_id, type, title, body, read, read_at, created_at)`.
- **API:**
  - `GET /api/marketplace?action=activity` devuelve las notificaciones no leídas asociadas al usuario.
  - `GET /api/order/[id]` ejecuta `lp_mark_order_notifications_read(order_id, actor)`.
- **Autorización y privacidad:** RLS habilitado en `lp_notifications` asegurando que `auth.uid() = user_id`.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Migración SQL de notificaciones | Tabla, funciones y permisos aplicados en base de datos | `supabase/migrations/202609090003_notifications.sql` aplicada con HTTP 201 | 2026-09-09 |
| Pruebas de base de datos | Invariantes de reserva, chat, pujas superadas y marcado de lectura | `tests/database/marketplace.sql` superado con PASS | 2026-09-09 |
| Pruebas unitarias de componentes | Badges y contadores en Mi actividad y banner de reserva de vendedor | `ActivityNotifications.test.tsx` y `ProductDetailReservedBanner.test.tsx` superados | 2026-09-09 |
| Compilación de producción | Next.js build y validación de tipos | `npm run build` completado exitosamente (26 rutas) | 2026-09-09 |
| `npm run specs:check` | Ficha, registro y enlaces validados | Salida 0 errores | 2026-09-09 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Se opta por una tabla `lp_notifications` dedicada para garantizar persistencia y extensibilidad futura, integrando el marcado de lectura directamente en la llamada a la orden (`order/[id]`) y anuncio.
- **Riesgos:** La actualización de notificaciones en operaciones concurrentes de mensajería debe ser atómica y no ralentizar el envío del mensaje.

## 11. Implementación y trazabilidad

- **Archivos o módulos:**
  - `supabase/migrations/202609090003_notifications.sql`
  - `src/controllers/marketplace.ts`
  - `src/components/ProductDetailInteractive.tsx`
  - `src/app/my-products/page.tsx`
  - `src/components/Header.tsx`
  - `src/app/como-funciona/page.tsx`
  - `src/app/globals.css`
  - `tests/database/marketplace.sql`
  - `src/components/__tests__/ActivityNotifications.test.tsx`
  - `src/components/__tests__/ProductDetailReservedBanner.test.tsx`
- **Migraciones/configuración:** `202609090003_notifications.sql`
- **Commit o despliegue:** Pendiente

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-09 | `IN_PROGRESS` | Creación de especificación inicial y diseño | Gemini (Antigravity) |
| 2026-09-09 | `VERIFIED` | Implementación completa de notificaciones, persistencia de lectura y validación superada | Gemini (Antigravity) |
