---
id: LP-FIX-015
type: FIX
status: IMPLEMENTED
priority: P1
requested_at: 2026-11-22
requested_by: usuario
source: conversación y auditoría del PR #86
owner: codex
github_issue: pending
related_specs: [LP-FEAT-010, LP-OPS-001]
dependencies: [LP-INFRA-007]
cross_cutting_concerns: [postgresql, notificaciones, mantenimiento]
---

# LP-FIX-015 · Corregir avisos al caducar reservas

## 1. Solicitud original

> Corregir el texto de los avisos `reservation_expired` para que, al caducar un pedido adjudicado una vez terminado el plazo de la subasta, no indiquen que el anuncio vuelve a estar disponible. Incluir pruebas de venta directa liberada, subasta reabrible y subasta finalizada, con estados, destinatarios e idempotencia.

## 2. Contexto y problema

- **Problema u oportunidad:** `lp_release` actualiza correctamente el pedido a `cancelled` y una subasta concluida a `expired`, pero siempre inserta el texto de disponibilidad para ambos destinatarios.
- **Personas afectadas:** Comprador y vendedor de reservas caducadas.
- **Impacto actual:** El aviso contradice el estado definitivo de una subasta ya cerrada.
- **Evidencia disponible:** Auditoría reproducible de `integration/integrity-findings.md` en el PR #86, 2026-11-22.

## 3. Resultado esperado

Cada aviso de caducidad describe el estado final del anuncio: disponible cuando la operación se libera, y finalizado sin venta cuando la subasta ya no puede reabrirse.

## 4. Alcance

### Incluido

- Texto específico de `reservation_expired` según el estado que `lp_release` acaba de persistir.
- Prueba SQL transaccional con datos ficticios para venta directa, subasta vigente y subasta acabada.

### Excluido

- Cambios de Stripe, despliegues, merge y modificación de datos de producción.
- Cambiar los estados de pedido o anuncio ya establecidos por `lp_release`.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Una reserva de venta directa caducada avisa a comprador y vendedor de que el anuncio vuelve a estar disponible.
- `RF-02`: Una reserva de subasta cuyo plazo sigue abierto avisa a ambas partes de que puede volver a estar disponible.
- `RF-03`: Una reserva adjudicada de una subasta ya terminada avisa a ambas partes de que ha finalizado sin venta y no de que vuelve a estar disponible.

### Requisitos no funcionales

- `RNF-01`: Repetir mantenimiento o `lp_release` no crea avisos duplicados ni cambia los estados finales.

### Reglas de negocio

- `RN-01`: Al caducar una reserva, el pedido queda `cancelled`.
- `RN-02`: Una subasta con plazo terminado queda `expired`; una venta directa o subasta con plazo vigente vuelve a `available`.

## 6. Criterios de aceptación

- [x] `AC-01` La venta directa liberada queda `available`, su pedido `cancelled` y genera exactamente un aviso para cada parte con disponibilidad.
- [x] `AC-02` La subasta aún vigente liberada queda `available`, su pedido `cancelled` y genera exactamente un aviso para cada parte con disponibilidad.
- [x] `AC-03` La subasta ya terminada queda `expired`, su pedido `cancelled` y genera exactamente un aviso para cada parte que indique finalización sin venta.
- [x] `AC-04` Una segunda llamada de mantenimiento no añade avisos ni altera los estados de los tres escenarios.
- [x] `AC-05` `npm run specs:check` y la prueba SQL aislada finalizan correctamente.

## 7. Experiencia y estados

- **Estados normales:** El título conserva `Reserva cancelada`; el cuerpo diferencia disponibilidad de finalización sin venta.
- **Canales afectados:** Campana de novedades y enlaces al pedido.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Nueva versión de la función `lp_release`; no hay tablas ni tipos nuevos.
- **API/integraciones:** Sin cambios de firma.
- **Autorización y privacidad:** Conserva ejecución exclusiva de `service_role`.
- **Migración/rollback:** Migración `20261122194009_reservation_expiry_notification_copy.sql`; su versión se comprobó frente a todos los worktrees activos antes de crearla.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| SQL aislado | Estados, dos destinatarios y textos correctos en los tres escenarios; reintento idempotente | PostgreSQL 16 Alpine temporal, migraciones relevantes y `tests/database/reservation-expiry-notices.sql`: PASS | 2026-11-22 |
| Gobernanza | Spec y registro válidos | `npm run specs:check`: 41 fichas y 52 documentos | 2026-11-22 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** El texto se decide después de persistir el estado y usa el `RETURNING` de la actualización para no recalcular una condición distinta.
- **Riesgos y límites:** La Issue no pudo crearse porque el conector GitHub devolvió 403; permanece `pending` y la ficha no se marcará `VERIFIED` hasta enlazarla.
- **Preguntas abiertas:** Ninguna de producto.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `supabase/migrations/20261122194009_reservation_expiry_notification_copy.sql`, `tests/database/reservation-expiry-notices.sql`, `SPEC_REGISTRY.md`.
- **Commit o despliegue:** `278ede1` (implementación); publicación de rama y PR pendientes por permisos remotos.
- **Notas de implementación:** Cambio limitado al texto condicionado por el estado final de `lp_release`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-11-22 | `IN_PROGRESS` | Creación y comienzo de implementación; Issue pendiente por error 403 del conector | Codex |
| 2026-11-22 | `IMPLEMENTED` | Migración y prueba SQL aislada correctas; pendiente enlazar Issue y PR | Codex |
