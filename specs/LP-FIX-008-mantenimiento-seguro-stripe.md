---
id: LP-FIX-008
type: FIX
status: IMPLEMENTED
priority: P1
requested_at: 2026-09-13
requested_by: usuario
source: conversación
owner: codex
github_issue: https://github.com/jorgeluquerubia/lapela/issues/71
related_specs: [LP-OPS-001, LP-FEAT-018, LP-FEAT-006]
dependencies: [LP-OPS-001]
cross_cutting_concerns: [seguridad, stripe, mantenimiento, observabilidad]
---

# LP-FIX-008 · Endurecer errores y Stripe en mantenimiento programado

## 1. Solicitud original

> Impedir que el cron exponga errores internos y que un fallo al consultar o expirar una sesión de Stripe libere una reserva de forma incorrecta o quede oculto.

## 2. Contexto y problema

- **Problema u oportunidad:** El endpoint devolvía `error.message` al invocador y el workflow publicaba ese cuerpo en sus logs. Además, un fallo de lectura de Stripe se convertía en ausencia de sesión y permitía ejecutar `lp_release`.
- **Personas afectadas:** Compradores con pagos pendientes, vendedores con artículos reservados y operación.
- **Impacto actual:** Posible exposición de detalles internos y liberación incorrecta de una reserva ante una indisponibilidad temporal de Stripe.
- **Evidencia disponible:** QA sobre `src/app/api/cron/maintain/route.ts`, `.github/workflows/maintenance.yml` y `src/controllers/marketplace.ts`.

## 3. Resultado esperado

Los fallos internos producen un HTTP 500 genérico sin detalles en la respuesta ni en GitHub Actions. Una orden con sesión Stripe solo se libera después de verificar con éxito que la sesión no está completada y, si estaba abierta, después de expirar la sesión correctamente.

## 4. Alcance

### Incluido

- Respuesta pública genérica ante errores de mantenimiento.
- Propagación de configuración ausente y errores de consulta o expiración de Stripe.
- Prevención de `lp_release` cuando el estado de Stripe no se ha podido verificar.
- Pruebas de todos esos casos y sanitización del workflow.

### Excluido

- Activar pagos reales.
- Cambiar plazos de reserva o estados de pedido.
- Sustituir el proveedor de observabilidad.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: El endpoint debe responder HTTP 500 con un mensaje genérico ante cualquier fallo interno.
- `RF-02`: Una orden con `stripe_session_id` no puede liberarse si falta la configuración de Stripe o falla la consulta de la sesión.
- `RF-03`: Una sesión abierta debe expirar correctamente antes de ejecutar `lp_release`; un fallo al expirar impide la liberación.

### Requisitos no funcionales

- `RNF-01`: Respuestas y logs públicos no deben incluir mensajes de PostgreSQL, Stripe, identificadores de pedidos ni trazas.
- `RNF-02`: Los errores deben seguir produciendo un estado observable HTTP 500.

### Reglas de negocio

- `RN-01`: Una sesión Stripe completada nunca libera la reserva desde mantenimiento.
- `RN-02`: Solo una sesión verificada como `expired`, o una sesión `open` expirada con éxito, permite continuar con `lp_release`.

## 6. Criterios de aceptación

- [x] `AC-01` Los fallos de RPC, base de datos y Stripe devuelven el mismo mensaje genérico sin detalles internos.
- [x] `AC-02` Si falta `STRIPE_SECRET_KEY` para una orden con sesión Stripe, se devuelve 500 y no se llama a `lp_release`.
- [x] `AC-03` Si `retrieve` o `expire` falla, se devuelve 500 y no se llama a `lp_release`.
- [x] `AC-04` Una sesión `complete` conserva la reserva; una sesión `expired` y una `open` expirada correctamente permiten liberar.
- [x] `AC-05` GitHub Actions no imprime el cuerpo de una respuesta fallida.
- [x] `AC-06` Pruebas dirigidas, build y `npm run specs:check` finalizan correctamente.

## 7. Experiencia y estados

- **Estados normales:** HTTP 200 con métricas agregadas.
- **Estados de error o vacío:** HTTP 500 con mensaje estable y no sensible.
- **Mensajes y accesibilidad:** No aplica a interfaz visual.
- **Responsive o canales afectados:** Endpoint y workflow.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Sin migraciones.
- **API/integraciones:** Stripe Checkout y `/api/cron/maintain`.
- **Autorización y privacidad:** Se conserva Bearer `CRON_SECRET`; se sanitiza la salida.
- **Observabilidad y soporte:** El detalle puede registrarse únicamente en los logs privados de Vercel.
- **Métricas o señales de éxito:** Ninguna liberación tras fallos de Stripe; fallos visibles como HTTP 500.
- **Migración/rollback:** Reversión de código; sin cambios persistentes.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Respuesta segura | HTTP 500 genérico | Suite de ruta: 13/13 pruebas | 2026-09-13 |
| Stripe | Sin liberación en fallos/configuración ausente | Casos de clave ausente, `retrieve`, `expire`, estado no verificable, `complete` y `expired` cubiertos | 2026-09-13 |
| Workflow | Sin cuerpo de error en log público | Revisión de `.github/workflows/maintenance.yml` | 2026-09-13 |
| Build y specs | Sin errores | `npm run build`; `npm run specs:check` (35 fichas) | 2026-09-13 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Fallar de forma segura ante cualquier estado de Stripe no verificable.
- **Riesgos y límites:** Un fallo externo retrasa una liberación hasta el siguiente ciclo, priorizando no liberar una compra posiblemente pagada.
- **Preguntas abiertas:** Ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `src/controllers/marketplace.ts`, `src/app/api/cron/maintain/route.ts`, pruebas y workflow.
- **Migraciones/configuración:** Ninguna.
- **Commit o despliegue:** Rama `codex/lp-fix-008-mantenimiento-seguro-stripe`.
- **Notas de implementación:** Los errores se registran en observabilidad del servidor y el cliente recibe un mensaje estable. Toda incertidumbre de Stripe interrumpe el ciclo antes de liberar.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-13 | `IN_PROGRESS` | Creación de ficha e inicio de corrección | Codex |
| 2026-09-13 | `IMPLEMENTED` | Corrección y validación local completadas; pendiente de integración | Codex |
