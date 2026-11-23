---
id: LP-FIX-014
type: FIX
status: IMPLEMENTED
priority: P1
requested_at: 2026-11-22
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/89
related_specs: [LP-FEAT-018, LP-FIX-006]
dependencies: [LP-FEAT-018]
cross_cutting_concerns: [notificaciones, privacidad, concurrencia, base de datos]
---

# LP-FIX-014 · Carrera en avisos de favoritos al vendedor

## 1. Solicitud original

> Corrige la carrera de avisos `favorite_received`. En dos operaciones simultáneas de `lp_set_favorite` sobre el mismo anuncio, se guardaron bien los dos favoritos, pero ambos intentos pasaron la comprobación antispam antes de insertar y el vendedor recibió dos avisos. Conserva un único aviso al vendedor por anuncio durante la ventana móvil de una hora y los dos favoritos. Valida con transacciones realmente simultáneas, repeticiones de la misma acción, un segundo intervalo después de la ventana y la privacidad de quien guarda el favorito. Mantén el alcance en `lp_set_favorite` y sus pruebas.

## 2. Contexto y problema

- **Problema u oportunidad:** La comprobación "no existe aviso reciente" y su inserción no son atómicas entre transacciones distintas de `lp_set_favorite`.
- **Personas afectadas:** Vendedores que reciben avisos duplicados y personas que guardan el mismo anuncio simultáneamente.
- **Impacto actual:** Un mismo evento agregado de interés puede generar varios avisos internos dentro de la ventana antispam.
- **Evidencia disponible:** Auditoría reproducible de PR #86, `integration/integrity-findings.md`, escenario de dos favoritos simultáneos.

## 3. Resultado esperado

Cada nuevo favorito persiste de forma independiente. Para cada vendedor y anuncio, solo se persiste un aviso `favorite_received` en cualquier intervalo móvil de una hora, sin revelar la identidad de quienes guardan el artículo.

## 4. Alcance

### Incluido

- Serializar atómicamente la comprobación e inserción del aviso dentro de `lp_set_favorite`.
- Mantener la idempotencia de `p_active = true` y del alta de favoritos.
- Pruebas de regresión SQL con sesiones/transacciones simultáneas, reintentos, segunda ventana y privacidad.

### Excluido

- Cambios de interfaz, campana, tarea `lp_process_favorite_alerts`, correos o push.
- Cambios de Stripe, pagos, despliegues, producción o servicios compartidos.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Dos actores distintos pueden guardar simultáneamente el mismo anuncio y se conservan ambos favoritos.
- `RF-02`: El vendedor recibe como máximo un aviso `favorite_received` por anuncio dentro de una ventana móvil de una hora.
- `RF-03`: Un nuevo favorito tras expirar la ventana puede generar el siguiente aviso.

### Requisitos no funcionales

- `RNF-01`: La decisión antispam y el alta del aviso deben ser segura ante transacciones concurrentes reales.
- `RNF-02`: Repetir `p_active = true` no crea favoritos ni avisos adicionales.
- `RNF-03`: El aviso no contiene ID, alias ni otra identidad del seguidor.

### Reglas de negocio

- `RN-01`: La ventana es móvil: un aviso bloquea otros del mismo vendedor y anuncio durante los 60 minutos posteriores a su creación.
- `RN-02`: La privacidad de favoritos definida en `LP-FEAT-018` permanece inalterada.

## 6. Criterios de aceptación

- [x] `AC-01` Dos transacciones realmente simultáneas de usuarios distintos guardan dos filas de `lp_favorites` para el mismo anuncio.
- [x] `AC-02` Esas transacciones dejan exactamente un `favorite_received` dirigido al vendedor.
- [x] `AC-03` Repetir `lp_set_favorite(..., true)` no crea otro favorito ni aviso.
- [x] `AC-04` Tras situar el único aviso fuera de la ventana móvil, un nuevo favorito genera exactamente un segundo aviso.
- [x] `AC-05` El contenido y las relaciones del aviso no revelan la identidad de quien guardó el anuncio; los permisos directos permanecen restringidos.
- [x] `AC-06` `npm run specs:check` y la prueba SQL de regresión terminan correctamente en una instancia local aislada con datos ficticios.

## 7. Experiencia y estados

- **Estados normales:** El vendedor sigue viendo el aviso agregado existente; cada comprador conserva su estado de favorito.
- **Estados de error o vacío:** Sin cambios de interfaz.
- **Mensajes y accesibilidad:** Sin cambios de interfaz.
- **Responsive o canales afectados:** Solo persistencia y aviso interno.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Migración que reemplaza únicamente `lp_set_favorite`; no modifica tablas ni expone datos.
- **API/integraciones:** La firma de la RPC permanece `lp_set_favorite(uuid, uuid, boolean)`.
- **Autorización y privacidad:** Se preserva el acceso exclusivo de `service_role`; el aviso sigue siendo agregado y anónimo.
- **Observabilidad y soporte:** La prueba de concurrencia deja evidencia reproducible y usa datos ficticios eliminables.
- **Métricas o señales de éxito:** Cero duplicados `favorite_received` por vendedor/anuncio dentro de 60 minutos bajo concurrencia.
- **Migración/rollback:** Aditiva y reversible restaurando la versión previa de la función; no se alteran favoritos existentes.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Concurrencia SQL aislada | 2 favoritos y 1 aviso tras dos sesiones simultáneas | `tests/database/favorite_notification_race.sql` (PASS) y `npm run specs:check` | 2026-11-22 |
| Reintento y nueva ventana | Sin duplicado idempotente; segundo aviso solo después de 60 minutos | `tests/database/favorite_notification_race.sql` (PASS) y `npm run specs:check` | 2026-11-22 |
| Privacidad y permisos | Aviso agregado sin identidad y sin privilegios directos | `tests/database/favorite_notification_race.sql` (PASS) y `npm run specs:check` | 2026-11-22 |
| Gobierno de specs | Registro y ficha válidos | `tests/database/favorite_notification_race.sql` (PASS) y `npm run specs:check` | 2026-11-22 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Se usa un bloqueo transaccional por vendedor/anuncio solo al decidir e insertar el aviso; el favorito no se descarta ni se identifica en el aviso.
- **Riesgos y límites:** Un bloqueo asesor puede colisionar de forma excepcional y retrasar otra clave, sin alterar la corrección; la ventana se mide con `created_at` de PostgreSQL.
- **Preguntas abiertas:** Ninguna bloqueante.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `supabase/migrations/20261122194008_favorite_notification_race.sql` y `tests/database/favorite_notification_race.sql`.
- **Migraciones/configuración:** `20261122194008_favorite_notification_race.sql`.
- **Commit o despliegue:** Commit actual de la rama `codex/lp-fix-014-favorite-notification-race`; sin despliegue. La publicación de rama, issue y PR están bloqueadas por autenticación GitHub no disponible.
- **Notas de implementación:** Inserción idempotente y bloqueo asesor transaccional por vendedor/anuncio para serializar la ventana antispam.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|
| 2026-11-22 | `IN_PROGRESS` | Ficha creada tras reservar worktree y revisar el hallazgo de auditoría | Codex |
| 2026-11-22 | `IMPLEMENTED` | Migración y regresión concurrente validadas en PostgreSQL temporal; issue y PR pendientes por falta de autenticación GitHub | Codex |

## Validación y publicación del 23 de noviembre de 2026

La prueba SQL de concurrencia pasó en Supabase local con PostgreSQL 17, usando supabase_admin para las conexiones dblink. Confirmó dos favoritos, un aviso, reintentos, ventana móvil y privacidad.

Las cuatro migraciones se aplicaron juntas en una instancia Supabase aislada. Las siete pruebas de controlador y la comprobación TypeScript pasaron. La publicación se realiza desde el Mac con acceso autorizado a GitHub. La rama permanece IMPLEMENTED hasta completar la revisión.
