---
id: LP-FEAT-022
type: FEATURE
status: IMPLEMENTED
priority: P1
requested_at: 2026-11-22
requested_by: usuario
source: conversación
owner: ingeniería
github_issue: https://github.com/jorgeluquerubia/lapela/issues/83
related_specs: [LP-FEAT-002, LP-FEAT-006, LP-FIX-008]
dependencies: []
cross_cutting_concerns: [aislamiento de datos, pagos, webhook]
---

# LP-FEAT-022 · Probar pagos con Stripe Connect en sandbox

## 1. Solicitud original

Simular los pagos con tarjeta y usar el entorno de pruebas de Stripe Connect para avanzar en la integración.

## 2. Contexto y problema

El simulador interno salta Stripe. El flujo existente de Connect y Checkout se ejecuta sobre los anuncios del entorno activo aunque la clave de Stripe sea de prueba. Hace falta validar el recorrido completo con el entorno oficial de Stripe y mantener los datos de prueba separados.

## 3. Resultado esperado

Un vendedor de prueba se da de alta en Connect, un comprador paga con una tarjeta de prueba en Checkout y la notificación firmada actualiza su pedido de prueba.

## 4. Alcance

Activar explícitamente Stripe de prueba, aislar anuncios y cuentas Connect, reutilizar Checkout y validar el webhook de pagos. Se conserva el simulador interno. El lanzamiento de cobros reales y la operación de reembolsos en La Pela se gestionan aparte.

## 5. Requisitos y reglas de negocio

- `RF-01` El modo `stripe_test` dirige el catálogo y las compras a datos de sandbox y admite el alta y Checkout de Stripe de prueba.
- `RN-01` Las cuentas Connect de prueba y las de producción se guardan por separado.
- `RN-02` El pedido se actualiza con un evento firmado de su modo y su entorno.
- `RNF-01` Las pantallas anuncian claramente el carácter de prueba cuando se usa Stripe sandbox.

## 6. Criterios de aceptación

- [x] `AC-01` Las claves activas se rechazan en modo `stripe_test`; la simulación interna se conserva.
- [ ] `AC-02` Un vendedor de prueba puede iniciar el alta Connect y un anuncio sandbox puede iniciar un Checkout con tarjeta de prueba.
- [x] `AC-03` Un webhook firmado y pagado puede actualizar el pedido correspondiente; se rechazan las firmas incorrectas, los eventos del otro modo y los pedidos del otro entorno.
- [x] `AC-04` El uso del sandbox se documenta con los pasos para ejecutar la prueba de punta a punta.

## 7. Experiencia y estados

Mostrar el aviso de sandbox en el portal y distinguir el pago con tarjeta de prueba del pago simulado interno.

## 8. Datos, API, seguridad y operación

Ejecutar las pruebas con una base aislada y credenciales Stripe de prueba. La migración conserva las cuentas Connect anteriores en el entorno activo. El webhook comprueba la firma y usa la confirmación idempotente existente.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia |
|---|---|---|
| Configuración | Selector de modo y guardas de claves | 45 pruebas focalizadas y comprobación de tipos en Ubuntu, 2026-11-22 |
| Checkout | Sesión de tarjeta abierta en Stripe sandbox | Creada en la API oficial con la versión del SDK de La Pela, 2026-11-22. El alta Connect externa requiere un sandbox vinculado. |
| Webhook y base de datos | Confirmación del pedido sandbox e idempotencia | HTTP contra Next.js y Supabase local, 2026-11-22. Un evento y un aviso persistidos. La firma incorrecta y el evento activo reciben HTTP 400, y el pedido activo de prueba queda pendiente. |
| Cuentas Connect | Aislamiento y compatibilidad con cuentas previas | La migración crea una tabla RLS separada para Stripe sandbox. SQL verificó que un vendedor conserva referencias independientes para ambos entornos, 2026-11-22. |

## 10. Decisiones, riesgos y preguntas abiertas

Se usa el sandbox oficial de Stripe para la comprobación externa y el simulador interno para pruebas sin red. La clave temporal del sandbox sin vincular permite crear Checkout pero devuelve HTTP 403 al crear cuentas Connect. Queda pendiente repetir el alta y el pago de un vendedor real de prueba en un sandbox con Connect habilitado.

## 11. Implementación y trazabilidad

Rama `codex/lp-feat-022-stripe-connect-sandbox`. Ficha e incidencia de GitHub `LP-FEAT-022`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-11-22 | `IN_PROGRESS` | Definir y preparar la integración Connect de prueba | Codex |
| 2026-11-22 | `IMPLEMENTED` | Validar Checkout oficial y confirmación firmada local con aislamiento | Codex |
