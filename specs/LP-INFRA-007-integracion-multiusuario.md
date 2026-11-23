---
id: LP-INFRA-007
type: INFRA
status: IMPLEMENTED
priority: P1
requested_at: 2026-11-22
requested_by: usuario
source: conversación
owner: ingeniería
github_issue: https://github.com/jorgeluquerubia/lapela/issues/85
related_specs: []
dependencies: []
cross_cutting_concerns: []
---

# LP-INFRA-007 · Pruebas de integración multiusuario de la beta

## Solicitud y alcance

Diseñar y ejecutar compras, pujas y posventa con varios usuarios y anuncios originales. Se usan dos vendedores, dos compradores, una observadora y una visita sin sesión. La matriz cruza categorías, estado, ubicación, descripción, historia, precio, modalidades, envío y recogida.

## Criterios de aceptación

- [x] `AC-01` Las cuentas ficticias usan sesiones distintas. Los anuncios se crean por las rutas normales con fotos originales y se comprueban desde el catálogo y el navegador.
- [x] `AC-02` La suite cubre reserva concurrente, cobro simulado, envío, recepción, recogida, valoraciones y caducidad.
- [x] `AC-03` La suite cubre pujas, mínimo, autopuja, sobrepuja, cierre y compra inmediata de subasta.
- [x] `AC-04` Se verifican permisos, visibilidad, validaciones de publicación, preguntas, favoritos y avisos.
- [x] `AC-05` La ejecución es repetible y se limita a una app y una base Supabase locales.

## Plan de pruebas

Véase [la matriz y cómo ejecutar la suite](../integration/README.md). El runner arranca aparte de las pruebas públicas de navegación. La cuenta de servicio se usa para preparar cuentas confirmadas y adelantar vencimientos de los registros de la ejecución. Las acciones de negocio pasan por las rutas de la app. La verificación de Checkout real en el sandbox de Stripe se registra aparte para mantener la suite repetible sin credenciales de Stripe.

## Evidencia

- 2026-11-22. Playwright ejecutó 13 escenarios y los 13 pasaron en el piloto de Ubuntu, con Chromium, Supabase local y Mailpit.
- Cinco cuentas nuevas ejercitaron el mercado con sesiones independientes y una visita anónima. Se creó una sexta cuenta mediante el formulario de registro y dos cuentas ficticias existentes participaron en Checkout. Se usaron seis diseños originales de producto.
- La app en modo `simulated` cubrió compraventa y subastas. El piloto `stripe_test` verificó rechazo, reintento y confirmación por webhook en un mismo pedido de 25 €. El pedido quedó pagado y el anuncio vendido.
- Se verificó sobre el piloto basado en `d28b8d1`, con la actualización a Accounts v2 del PR [#84](https://github.com/jorgeluquerubia/lapela/pull/84). La rama de la suite contiene pruebas y material de prueba.
- Pendiente de revisión e integración en GitHub. La comprobación abarcó Chromium. Quedan fuera de esta ejecución los reembolsos, las disputas y el pago con autenticación 3D Secure.

### Ampliación de integridad y notificaciones

Se añadieron dos escenarios automatizados para avisos durante el ciclo del pedido y deduplicación tras mantenimiento concurrente. La suite ampliada pasó 15 de 15 casos. La auditoría SQL de solo lectura comprueba invariantes y se complementó con un reenvío paralelo de webhook y pruebas de casos adversos. Los resultados y las incidencias abiertas están en [la auditoría de integridad](../integration/integrity-findings.md).

## Integración conjunta del 23 de noviembre de 2026

La rama codex/lp-infra-007-combined reúne Stripe sandbox y Accounts v2 del PR #84, las correcciones LP-FIX-013 a LP-FIX-016 y la suite del PR #86. También incorpora LP-FIX-012, necesario para que los filtros de precio vacíos de la búsqueda permitan encontrar los anuncios.

Se resolvieron los conflictos del controlador conservando el aislamiento sandbox de Stripe, la confirmación presencial atómica y los filtros de entorno en actividad y avisos. Se añadió una regresión E2E con registros live y sandbox de la misma identidad, y dos recorridos de Stripe para cobro presencial con Checkout abierto y rechazo de cobro presencial tras pago con tarjeta.

La validación usa una instancia Supabase local aislada, dos apps en loopback con modos simulated y stripe_test, y un receptor de webhooks firmado del sandbox de Stripe. Pasaron las cuatro regresiones SQL, 21 pruebas de controlador/webhook/modo de pago y TypeScript. La auditoría de 16 invariantes devolvió cero incidencias. La ejecución de navegador usa Chromium.

Resultado final del navegador en la integración conjunta del 23 de noviembre de 2026 — 18 de 18 escenarios pasaron, sin omisiones ni reintentos inestables. Los tres recorridos de Stripe se ejecutaron contra su sandbox, con webhooks firmados recibidos por el piloto. La auditoría SQL posterior mantuvo las 16 comprobaciones a cero.
