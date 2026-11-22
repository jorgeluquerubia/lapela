---
id: LP-INFRA-006
type: INFRA
status: IMPLEMENTED
priority: P1
requested_at: 2026-11-22
requested_by: usuario
source: conversación
owner: ingeniería
github_issue: pending
related_specs: [LP-FEAT-001, LP-FEAT-002, LP-FEAT-006, LP-FEAT-007, LP-OPS-001]
dependencies: [LP-FIX-012]
cross_cutting_concerns: [aislamiento de datos, operación de la beta]
---

# LP-INFRA-006 · Validar recorridos críticos del MVP de beta

## 1. Solicitud original

Preparar y ejecutar el plan de cierre del MVP de La Pela.

## 2. Contexto y problema

El build y las pruebas de navegación pública no acreditan que se pueda completar una venta. La beta desplegada devuelve HTTP 503 al consultar el catálogo y Supabase indica que su proyecto está inactivo. El flujo de mantenimiento de GitHub figura desactivado por inactividad.

## 3. Resultado esperado

Poder repetir una compra y una subasta con cuentas sintéticas y comprobar su resultado en la aplicación y en la base de datos. Registrar la evidencia necesaria para repetir la validación cuando se recupere la beta desplegada.

## 4. Alcance

Registro, confirmación y acceso, publicación con foto, compra directa, pago simulado, entrega, pujas, cierre, alertas y liberación de reservas. Las pruebas usan un proyecto local con migraciones versionadas. El arranque de cero admite que la base carezca de tablas antiguas. Stripe real, el lanzamiento público y los cambios de plan de Supabase se gestionan fuera de esta ficha.

## 5. Requisitos y reglas de negocio

- `RF-01` La persona vendedora puede publicar un anuncio con foto y la compradora puede encontrarlo y reservarlo.
- `RF-02` Las partes pueden completar el pedido simulado y ver sus cambios de estado.
- `RF-03` El mantenimiento cierra subastas y caduca reservas, con avisos para las partes.
- `RNF-01` Las pruebas usan servicios en loopback, datos sintéticos y el modo de pago simulado.
- `RN-01` La ejecución del mantenimiento es repetible y conserva un solo pedido ganador por subasta.

## 6. Criterios de aceptación

- [x] `AC-01` Las migraciones se aplican a un Supabase vacío y pasa la prueba SQL de invariantes.
- [x] `AC-02` Dos cuentas de prueba pueden confirmar su correo, entrar y completar una compra directa con foto, reserva, chat, pago simulado y recepción.
- [x] `AC-03` Una puja válida produce un único pedido ganador y los avisos previstos. Una reserva vencida se libera y la repetición del mantenimiento conserva el resultado.
- [x] `AC-04` Quedan documentados el arranque reproducible de la suite y los controles que deben repetirse al recuperar producción.

## 7. Experiencia y estados

Validar desde las pantallas de registro, publicación, catálogo, anuncio y pedido. Contrastar los estados persistidos después de las operaciones y de repetir el mantenimiento.

## 8. Datos, API, seguridad y operación

Supabase local separado, almacenamiento de prueba y captura de correo en Mailpit. La clave de servicio solo está disponible en el proceso de pruebas para preparar el vencimiento sintético y comprobar datos. El secreto del cron se genera para cada ejecución.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia |
|---|---|---|
| Arranque y migraciones | El esquema se aplica desde cero y pasa el SQL de invariantes | 16 migraciones, prueba de invariantes y comprobación de revocación con tablas antiguas presentes, 2026-11-22 |
| Prueba de navegador | Compra directa y subasta con cuentas de prueba | Chromium en Ubuntu, `1 passed`, 2026-11-22. Confirmación de correo, foto, búsqueda, reserva, chat, pago simulado y recepción. Puja, adjudicación, pago de la subasta y liberación de reserva con avisos y ejecución repetida del cron. |
| Jest | Reproducir la línea base y verificar la corrección de búsqueda | Cuatro pruebas nuevas en verde. La suite completa conserva 26 fallos preexistentes y pasa 230 pruebas, 2026-11-22. |
| Operación desplegada | Catálogo activo y cadencia comprobada del programador | Bloqueada por la restricción de la organización de Supabase |

### Orden de cierre de la beta

1. Recuperar el proyecto Supabase alojado. Confirmar catálogo con HTTP 200, acceso, buckets y versiones aplicadas. Comparar el inventario antes de aplicar migraciones pendientes.
2. Validar los recorridos de vendedor y comprador en un entorno aislado. Ejecutar en paralelo el build, la prueba SQL y las pruebas unitarias de las correcciones.
3. Verificar el mantenimiento con una subasta y una reserva sintéticas. Comprobar que la cadencia entrega los avisos a tiempo y que se puede detectar un fallo del programador.
4. Integrar las correcciones con sus evidencias. Repetir los recorridos críticos en la beta desplegada con pago simulado. Cerrar la validación cuando se cumplan sus criterios.

## 10. Decisiones, riesgos y preguntas abiertas

Se adopta el alcance de beta con pagos simulados. La restauración del proyecto alojado devolvió `PaymentRequiredException` por una restricción de la organización. A fecha de 2026-11-22, GitHub rechazó la creación de la issue con HTTP 403 para la integración y la referencia queda pendiente.

## 11. Implementación y trazabilidad

Rama `codex/lp-infra-006-validacion-mvp` sobre la corrección `LP-FIX-012`. La prueba usa los endpoints activos de la aplicación y la suite SQL existente. `202609060002_legacy_lockdown.sql` conserva la revocación de permisos en tablas antiguas existentes y permite arrancar instalaciones vacías. Se mantiene la versión de la migración ya registrada por Supabase.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-11-22 | `IN_PROGRESS` | Crear worktree aislado y preparar entorno de aceptación | Codex |
| 2026-11-22 | `IMPLEMENTED` | Reproducir el arranque local y completar la compra y la subasta en Chromium | Codex |
