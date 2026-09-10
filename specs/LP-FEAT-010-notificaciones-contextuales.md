---
id: LP-FEAT-010
type: FEATURE
status: VERIFIED
priority: P1
requested_at: 2026-09-10
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/27
related_specs: [LP-FEAT-009]
dependencies: []
cross_cutting_concerns: [notificaciones, subastas, pagos, mensajeria, accesibilidad]
---

# LP-FEAT-010 · Notificaciones contextuales y cierre de subastas

## 1. Solicitud original

> "quiero que hagas un refinement mejorado de esa feature añadiendo lo que te he dicho y lo que consideres que se podria mejorar de esa feature, y la lleves a main"

## 2. Contexto y problema

- **Problema u oportunidad:** LP-FEAT-009 registra novedades de reservas, mensajes, sobrepujas y algunas transiciones, pero no avisa al cerrar una subasta ni al confirmar un pago por plataforma. El acceso global solo muestra un número y las novedades de pedido no enlazan directamente a su artículo.
- **Personas afectadas:** Personas compradoras, pujadoras y vendedoras.
- **Impacto actual:** Una persona puede perder el resultado de una subasta, enterarse tarde de un pago confirmado o no distinguir rápidamente qué artículo originó una novedad.
- **Evidencia disponible:** Revisión funcional de LP-FEAT-009 solicitada por la persona usuaria el 2026-09-10.

## 3. Resultado esperado

La persona usuaria ve una campana con contador y una lista de novedades persistentes. Cada novedad identifica el artículo y permite llegar al contexto correcto: a la ficha del artículo para ventas y subastas, o al pedido y su conversación cuando se trata de un mensaje o estado operativo. El cierre de una subasta y la confirmación de un pago generan avisos para las partes afectadas.

## 4. Alcance

### Incluido

- Campana accesible en cabecera con contador y panel de novedades no leídas.
- Enlaces desde cada novedad a su artículo y, cuando proceda, al pedido o chat concreto.
- Avisos de adjudicación de subasta al ganador y al vendedor; aviso de finalización sin pujas al vendedor.
- Avisos al vendedor cuando el pago se confirma por simulación o Stripe.
- Aviso a las partes cuando una reserva caduca y se cancela.
- Marcado de lectura por contexto: las novedades de chat solo se leen al abrir el pedido; las de artículo/subasta al abrir el artículo.
- Cobertura SQL y de interfaz de los nuevos eventos y enlaces.

### Excluido

- Push, correo electrónico o SMS.
- Un cron nuevo para cerrar subastas; se conserva el mantenimiento oportunista vigente.
- Centro histórico de notificaciones leídas o preferencias configurables.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: La cabecera debe mostrar una campana con el número de novedades no leídas y un panel que identifique artículo, evento y momento.
- `RF-02`: Cada novedad debe ofrecer un enlace a la ficha del artículo; los mensajes y estados de pedido deben ofrecer además un acceso directo al pedido correspondiente.
- `RF-03`: Al cerrar una subasta con pujas, el ganador y el vendedor deben recibir una novedad no leída que les permita abrir el artículo y el pedido adjudicado.
- `RF-04`: Al cerrar una subasta sin pujas, el vendedor debe recibir una novedad no leída que lleve al artículo finalizado.
- `RF-05`: Al confirmar un pago simulado o Stripe, el vendedor debe recibir una novedad no leída de pago confirmado.
- `RF-06`: Al caducar una reserva, comprador y vendedor deben recibir una novedad no leída de cancelación y poder abrir el artículo.
- `RF-07`: Abrir un artículo no debe marcar como leído un mensaje de chat; ese aviso se marca al abrir su pedido.

### Requisitos no funcionales

- `RNF-01`: El panel de cabecera debe ser operable con teclado, anunciar el recuento con etiqueta accesible y cerrar al pulsar Escape.
- `RNF-02`: Ninguna ruta o marcado de lectura puede afectar a notificaciones de otra persona usuaria.

### Reglas de negocio

- `RN-01`: Un cierre de subasta solo notifica al mejor postor y al vendedor; las personas que perdieron por una sobrepuja siguen cubiertas por su propio aviso `outbid`.
- `RN-02`: Una notificación vinculada a un pedido solo se considera leída al entrar en ese pedido; la apertura de la ficha no debe ocultar un mensaje sin leer.
- `RN-03`: Los avisos de cierre y pago se crean una sola vez aunque las operaciones idempotentes se reintenten.

## 6. Criterios de aceptación

- [x] `AC-01` Una persona con novedades ve una campana con contador y puede abrir un panel con título, artículo y acciones contextuales.
- [x] `AC-02` Desde cada elemento del panel se puede abrir la ficha del artículo; en un mensaje o pedido también se puede abrir el pedido exacto.
- [x] `AC-03` Al cerrar una subasta con pujas se crean exactamente dos avisos: adjudicación para ganador y venta para vendedor; al no haber pujas se crea uno para vendedor.
- [x] `AC-04` La confirmación de un pago simulado o Stripe crea un aviso de pago confirmado para vendedor sin duplicarlo en reintentos.
- [x] `AC-05` Una reserva liberada por expiración deja un aviso de cancelación para comprador y vendedor sin duplicados.
- [x] `AC-06` Abrir una ficha de artículo no elimina un aviso de mensaje; abrir su pedido sí lo elimina.
- [x] `AC-07` Las pruebas SQL, las pruebas unitarias afectadas, `npm run build` y `npm run specs:check` finalizan correctamente.

## 7. Experiencia y estados

- **Estados normales:** La campana no se destaca sin novedades; con novedades muestra un contador limitado a `9+`, panel legible y acciones claras por artículo/pedido.
- **Estados de error o vacío:** Sin novedades el panel explica que no hay novedades pendientes. Un error de carga no bloquea la navegación.
- **Mensajes y accesibilidad:** Botón con `aria-expanded`, foco visible, cierre con Escape y acciones descritas.
- **Responsive o canales afectados:** Cabecera, Mi actividad, artículos, pedidos y vista móvil/escritorio.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Nuevos tipos de `lp_notifications` y datos de deduplicación mediante la transacción de cada evento.
- **API/integraciones:** `GET /api/market/notifications` devuelve contexto mínimo del artículo y pedido para el panel.
- **Autorización y privacidad:** Todas las consultas y funciones mantienen destinatario explícito y acceso exclusivamente `service_role`.
- **Migración/rollback:** Migración aditiva que redefine funciones transaccionales; el rollback conserva datos y puede desactivar la interfaz.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| SQL de eventos y lectura | Adjudicación, pago, expiración y lectura contextual correctos | Migración `202609100001_contextual_notifications.sql` aplicada en Supabase y consulta transaccional `PASS LP-FEAT-010` | 2026-09-10 |
| Pruebas de interfaz | Campana, enlaces y estados accesibles correctos | `HeaderNotifications`, `Header` y `ActivityNotifications`: 3 suites, 3 pruebas superadas | 2026-09-10 |
| Compilación | Build de producción correcto | `npm run build` superado con variables sintéticas no secretas para prerenderizado | 2026-09-10 |
| Gobernanza | Registro y ficha consistentes | `npm run specs:check`: 18 fichas y 29 documentos válidos | 2026-09-10 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Un aviso ofrece la ficha del artículo como destino principal y conserva un acceso explícito al pedido cuando el evento requiere actuar en chat o logística.
- **Riesgos y límites:** El mantenimiento oportunista puede retrasar el aviso de cierre hasta la siguiente consulta al backend.
- **Preguntas abiertas:** Ninguna para el alcance actual.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `supabase/migrations/202609100001_contextual_notifications.sql`, `src/components/Header.tsx`, `src/app/my-products/page.tsx`, `src/controllers/marketplace.ts`, `src/app/globals.css`, `tests/database/marketplace.sql` y `src/components/__tests__/HeaderNotifications.test.tsx`.
- **Migraciones/configuración:** `202609100001_contextual_notifications.sql`, aplicada en Supabase el 2026-09-10.
- **Commit o despliegue:** [PR #28](https://github.com/jorgeluquerubia/lapela/pull/28), commit `1084752`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-10 | `DRAFT` | Creación de la ficha a partir de la revisión de LP-FEAT-009 | Codex |
| 2026-09-10 | `IN_PROGRESS` | Issue #27 creada y rama de implementación asignada | Codex |
| 2026-09-10 | `VERIFIED` | Migración aplicada; eventos, enlaces, interfaz y compilación validados | Codex |
| 2026-09-10 | `VERIFIED` | PR #28 preparada para integrar en `main` | Codex |
