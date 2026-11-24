---
id: LP-FIX-013
type: FIX
status: IMPLEMENTED
priority: P0
requested_at: 2026-11-22
requested_by: usuario
source: auditoría reproducible del PR #86
owner: codex
github_issue: https://github.com/jorgeluquerubia/lapela/issues/90
related_specs: [LP-FEAT-002, LP-FEAT-007, LP-FIX-008]
dependencies: []
cross_cutting_concerns: [stripe, integridad, concurrencia, pagos]
---

# LP-FIX-013 · Exclusión mutua entre Checkout y cobro en persona

## Solicitud y criterios

Corrige la carrera entre Checkout, cobro presencial y webhook. Una sesión Stripe `open` debe expirar antes del cobro en persona; una `complete` conserva Stripe; una `expired` o ausente permite `in_person`. Reintentos no duplican estado, eventos ni avisos. Ningún pedido `in_person` conserva Checkout. PR #84 (Accounts v2) no se incorpora; solo requerirá reconciliación si modifica este contrato. La integración GitHub devolvió 403 al crear la issue, por lo que permanece `pending`.

- [x] `AC-01` Sesión abierta se expira antes del cobro presencial.
- [x] `AC-02` Sesión completada conserva Stripe y rechaza cobro presencial.
- [x] `AC-03` Reintentos no duplican el resultado.

## Validación y publicación del 23 de noviembre de 2026

La revisión añadió autorización del vendedor antes de consultar Stripe, comparación de sesión y transición atómica en PostgreSQL. Checkout verifica que pudo asociar su sesión al pedido antes de devolver la URL y expira la sesión si el cobro presencial ganó la carrera. Cuatro regresiones de controlador y una prueba SQL pasaron.

Las cuatro migraciones se aplicaron juntas en una instancia Supabase aislada. Las siete pruebas de controlador y la comprobación TypeScript pasaron. La publicación se realiza desde el Mac con acceso autorizado a GitHub. La rama permanece IMPLEMENTED hasta completar la revisión.


## Verificación en producción del 24 de noviembre de 2026

Supabase reactivó `lapela-app`. Se aplicaron las cinco migraciones del PR #95 en una transacción y se conservaron sus versiones del repositorio en el historial remoto. Las regresiones transaccionales con rollback verificaron la exclusión entre Checkout y cobro presencial, el aislamiento de avisos y la caducidad. La auditoría de los datos existentes obtuvo cero casos en sus 16 comprobaciones.

Se alineó la suite SQL general con el contrato idempotente. Un reintento conserva el pedido completado y sigue habiendo un único aviso al comprador.
