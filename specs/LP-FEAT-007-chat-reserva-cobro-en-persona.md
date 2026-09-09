---
id: LP-FEAT-007
type: FEATURE
status: VERIFIED
priority: P1
requested_at: 2026-09-09
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/21
related_specs: [LP-FEAT-001, LP-FEAT-002, LP-FEAT-006]
dependencies: []
cross_cutting_concerns: []
---

# LP-FEAT-007 · Chat en reserva y confirmación de cobro en persona por el vendedor

## 1. Solicitud original

> El chat entre comprador y vendedor deberia abrirse una vez el artículo ya está reservado, ya que deben ponerse de acuerdo de cómo va a ser el pago, en persona, a través de la plataforma , con envío, en persona, etc. Como el pago puede ser en persona el vendedor debe poder tener una opción de pago recibido , para poder finalizar el ciclo de vida del articulo y darlo por vendido. (Pasaría de reservado a vendido y dejaría de estar disponible)

## 2. Contexto y problema

- **Problema u oportunidad:** Con la regla anterior, el chat privado del pedido solo se habilitaba una vez confirmado el pago vía Stripe o simulación (`paid`). Esto impedía que comprador y vendedor se comunicasen tras la reserva para acordar si pagarían en mano, el punto de encuentro físico o el método de entrega. Asimismo, no existía mecanismo para que el vendedor confirmase que había recibido el cobro en efectivo/en mano, imposibilitando completar pedidos fuera de la pasarela online.
- **Personas afectadas:** Compradores y vendedores que eligen entrega en mano o pago en persona tras reservar el producto.
- **Impacto actual:** Imposibilidad de coordinar la transacción durante el periodo de reserva de 48 horas y bloqueo del ciclo de vida del producto cuando el pago no es online.
- **Evidencia disponible:** Solicitud explícita del usuario y restricciones en `lp_send_message`, `canMessage` y `src/app/orders/[id]/page.tsx`.

## 3. Resultado esperado

- El chat del pedido se habilita de inmediato una vez creado el pedido en estado reservado (`pending_payment`), permitiendo el diálogo exclusivo entre comprador y vendedor para coordinar el pago (en persona o por plataforma) y la entrega.
- El vendedor dispone de un botón y flujo de confirmación explícito para marcar el pago como recibido en persona.
- Al confirmar el cobro en persona, el pedido pasa a estado `completed` con modo de pago `in_person` y el artículo pasa a estado `sold`, finalizando su ciclo de vida y quedando no disponible para otros usuarios.

## 4. Alcance

### Incluido

- Actualización de la regla de mensajería `canMessage` para incluir pedidos en estado `pending_payment`.
- Modificación de la función de base de datos `lp_send_message` para autorizar el envío en `pending_payment`.
- Creación de la función SQL transaccional `lp_confirm_in_person_payment(p_order uuid, p_actor uuid)` en PostgreSQL.
- Actualización de la restricción de comprobación `lp_orders_payment_mode_check` para admitir el valor `'in_person'`.
- Endpoint `POST /api/market/pay-in-person/:id` en `src/controllers/marketplace.ts`.
- Interfaz en `/orders/[id]`:
  - Activación del chat durante la reserva con texto explicativo para coordinar pago y entrega.
  - Sección para el vendedor con botón "Marcar pago recibido en persona" y diálogo de confirmación interactivo.
  - Visualización del estado final completado con aviso de pago en persona.

### Excluido

- Modificación de los flujos de disputa o cancelaciones automáticas tras 48h (que continúan gestionados por `maintain()` / `lp_release()`).

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Una vez reservado el artículo (`pending_payment`), tanto el comprador como el vendedor pueden enviar y recibir mensajes en el chat del pedido.
- `RF-02`: Los usuarios no participantes en el pedido no pueden leer ni enviar mensajes en el chat de la reserva.
- `RF-03`: El vendedor dispone en la pantalla del pedido de la acción de confirmar el cobro en persona mientras el pedido permanezca en `pending_payment`.
- `RF-04`: Al confirmar el pago en persona, el pedido se actualiza a `completed` con `payment_mode = 'in_person'` y el anuncio se marca como `sold`.
- `RF-05`: Un comprador no puede ejecutar la acción de confirmar cobro en persona.

### Requisitos no funcionales

- `RNF-01`: La confirmación de cobro en persona debe ser atómica e idempotente en PostgreSQL mediante `lp_confirm_in_person_payment`.
- `RNF-02`: El chat debe actualizarse reactivamente o mediante sondeo periódico como en el resto de estados del pedido.

### Reglas de negocio

- `RN-01`: El chat solo está disponible entre el comprador y el vendedor del pedido específico.
- `RN-02`: Solo el vendedor asignado al pedido puede dar fe de la recepción del dinero en mano.
- `RN-03`: Una vez confirmado el pago en persona, el artículo no puede volver a estar disponible ni reservarse por otro usuario.

## 6. Criterios de aceptación

- [x] `AC-01` Dado un pedido en estado `pending_payment`, cuando el comprador o el vendedor acceden a `/orders/[id]`, entonces el chat de mensajes está habilitado y permite enviar mensajes.
- [x] `AC-02` Dado un usuario ajeno al pedido, cuando intenta enviar un mensaje a dicho pedido reservado mediante `lp_send_message` o API, entonces la operación es denegada con error de autorización.
- [x] `AC-03` Dado un pedido en estado `pending_payment`, cuando el vendedor pulsa en "Marcar pago recibido en persona" y confirma la acción, entonces el pedido pasa a `completed`, el modo de pago se guarda como `in_person` y el artículo pasa a `sold`.
- [x] `AC-04` Dado un comprador en un pedido en estado `pending_payment`, cuando accede al pedido, entonces no se le muestra el botón de confirmar cobro en persona y no puede ejecutar la acción vía API.

## 7. Experiencia y estados

- Pantalla de pedido (`/orders/[id]`):
  - Estado `pending_payment`: aviso de reserva activa y chat abierto con indicación: "Coordina el método de pago (en persona o por la plataforma) y los detalles de la entrega".
  - Vista vendedor: botón secundario/primario "Marcar pago recibido en persona" con panel de confirmación ("¿Has cobrado el importe en mano?").
  - Pedido completado por cobro en persona: banner "Pago en persona recibido · Venta finalizada" y artículo reflejado como vendido.

## 8. Datos, API, seguridad y operación

- Base de datos:
  - Migración `supabase/migrations/202609090002_chat_on_reservation_and_in_person_pay.sql`.
  - Actualización de `lp_orders.payment_mode` para incluir `'in_person'`.
  - Nueva función `lp_confirm_in_person_payment(uuid, uuid)`.
  - Actualización de `lp_send_message(uuid, uuid, text)`.
- API:
  - Ruta POST `api/market/pay-in-person/[id]` (o `action==='pay-in-person'`).

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Invariante SQL de chat en reserva | Comprador y vendedor envían mensajes en `pending_payment`; ajenos bloqueados | Migración `202609090002` aplicada; `tests/database/marketplace.sql` ejecutado con éxito en Supabase | 2026-09-09 |
| Invariante SQL de cobro en persona | Vendedor confirma cobro en persona; pedido `completed`, listing `sold` | Verificado en `tests/database/marketplace.sql` (bloqueo a comprador y terceros, pedido `completed`, listing `sold`) | 2026-09-09 |
| Pruebas unitarias de reglas | `canMessage` devuelve true para `pending_payment` | `src/lib/__tests__/rules-order-chat.test.ts` (4/4 pruebas superadas) | 2026-09-09 |
| Pruebas de componente Order | Chat accesible y botón de confirmación para vendedor | `src/app/orders/[id]/__tests__/Order.test.tsx` (2/2 pruebas superadas) | 2026-09-09 |
| `npm run specs:check` | Ficha registrada y gobernanza documental correcta | 15 fichas registradas y 26 documentos enlazados | 2026-09-09 |
| `npm run build` | Compilación sin errores | 26 rutas compiladas con éxito en Next.js 15.5 | 2026-09-09 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:**
  - El pago en persona transiciona el pedido directamente a `completed`, ya que la entrega y el cobro se realizan simultáneamente en el encuentro físico.
  - Se amplía el enum check de `payment_mode` con `'in_person'`.
- **Riesgos y límites:**
  - Transacciones fuera de plataforma: la plataforma advierte de que el pago en persona se realiza bajo responsabilidad mutua de las partes y finaliza la responsabilidad de intermediación al confirmarse por el vendedor.

## 11. Implementación y trazabilidad

- **Archivos o módulos:**
  - `specs/LP-FEAT-007-chat-reserva-cobro-en-persona.md`
  - `SPEC_REGISTRY.md`
  - `PROJECT_CONTEXT.md`
  - `supabase/migrations/202609090002_chat_on_reservation_and_in_person_pay.sql`
  - `tests/database/marketplace.sql`
  - `src/lib/rules.ts`
  - `src/controllers/marketplace.ts`
  - `src/app/orders/[id]/page.tsx`
  - `src/lib/__tests__/rules-order-chat.test.ts`
  - `src/app/orders/[id]/__tests__/Order.test.tsx`
- **Migraciones/configuración:** `202609090002_chat_on_reservation_and_in_person_pay.sql` aplicada en Supabase
- **Commit o despliegue:** Rama `gemini/lp-feat-007-chat-reserva-cobro-en-persona`
- **Notas de implementación:** Rama `gemini/lp-feat-007-chat-reserva-cobro-en-persona`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-09 | `IN_PROGRESS` | Creación de especificación e inicio de implementación | Gemini |
| 2026-09-09 | `VERIFIED` | Implementación completa, migraciones remotas aplicadas y suites de pruebas superadas | Gemini |
