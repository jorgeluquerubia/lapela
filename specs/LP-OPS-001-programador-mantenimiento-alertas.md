---
id: LP-OPS-001
type: OPS
status: IN_PROGRESS
priority: P2
requested_at: 2026-09-13
requested_by: usuario
source: conversación
owner: operaciones
github_issue: https://github.com/jorgeluquerubia/lapela/issues/59
related_specs: [LP-FEAT-018, LP-FEAT-010, LP-FIX-006]
dependencies: [LP-FEAT-018]
cross_cutting_concerns: [mantenimiento, notificaciones, observabilidad, seguridad]
---

# LP-OPS-001 · Programador periódico de mantenimiento y alertas de favoritos

## 1. Solicitud original

> LP-FEAT-018 — Favoritos: interfaz y privacidad básica correctas, pero falta el programador real de alertas. La PR #58 corrige adecuadamente el corazón en anuncios propios/demo.
> Correcciones solicitadas:
> 1. Corrige runMaintenance() para que no convierta los errores de las RPC en cero.
> 2. Si falla lp_close_auctions, lp_process_favorite_alerts, la consulta de pedidos o lp_release, el endpoint debe responder HTTP 500 controlado.
> 3. No incrementes métricas si una operación falló o no llegó a ejecutarse.
> 4. Añade pruebas donde cada operación de mantenimiento falle por separado y confirma que el endpoint devuelve 500.
> 5. Configura el mismo CRON_SECRET en Vercel y GitHub Actions.
> 6. Corrige el workflow: la ausencia de CRON_SECRET debe fallar, un HTTP 401 o 500 debe fallar, elimina curl ... || echo, registra únicamente información no sensible.
> 7. Ejecuta manualmente el workflow y conserva evidencia de una respuesta 200 real.
> 8. Verifica con una subasta controlada que se genera una sola alerta de última hora y que los reintentos no la duplican.
> 9. Revisa la colisión de versión en migraciones sin renombrar migraciones ya aplicadas.

## 2. Contexto y problema

- **Problema u oportunidad:** La plataforma contaba con la lógica transaccional en PostgreSQL (`lp_close_auctions`, `lp_process_favorite_alerts`, expiración de órdenes pendientes), pero su ejecución estaba acoplada exclusivamente a peticiones HTTP oportunistas al visitar el catálogo o la ficha de un artículo. Si no existía tráfico continuado de usuarios en un intervalo de tiempo, las alertas de la última hora de subastas favoritas no se emitían a tiempo y el cierre de subastas o liberación de reservas quedaba retrasado hasta la siguiente visita.
- **Personas afectadas:** Compradores que siguen subastas en favoritos (pudiendo perder avisos de cierre próximo), vendedores esperando el cierre formal de sus subastas vencidas y usuarios esperando liberación de artículos con reservas impagadas caducadas.
- **Impacto actual:** Dependencia del tráfico web para tareas críticas del dominio que deben ejecutarse con periodicidad garantizada.
- **Evidencia disponible:** Observación del agente de QA en la revisión de `LP-FEAT-018` y mención explícita como limitación técnica en `PROJECT_CONTEXT.md` (línea 280).

## 3. Resultado esperado

1. Disponer de un endpoint dedicado y seguro (`/api/cron/maintain`) que ejecute de forma atómica y completa las operaciones de mantenimiento del marketplace (cierre de subastas, generación de alertas de favoritos y liberación de reservas expiradas con cancelación de sesiones Stripe).
2. Proteger el endpoint mediante autorización obligatoria por token secreto (`CRON_SECRET`), denegando cualquier acceso no autorizado con HTTP 401.
3. Configurar la tarea programada en `vercel.json` para que el servicio de hosting invoque el endpoint de forma autónoma e independiente del tráfico de usuarios.
4. Preservar la ejecución oportunista en el backend como mecanismo de contingencia (*fallback*), asegurando resiliencia incluso ante interrupciones del programador.
5. Propagar cualquier fallo en las operaciones RPC o de base de datos a un HTTP 500 controlado sin enmascarar errores ni incrementar métricas erróneamente.
6. Garantizar mediante pruebas automatizadas y ejecuciones reales observables la confiabilidad del programador y la no duplicación de alertas.

## 4. Alcance

### Incluido

- Endpoint seguro de mantenimiento en Next.js (`src/app/api/cron/maintain/route.ts`).
- Modularización de la lógica en `src/controllers/marketplace.ts` mediante la función `runMaintenance()`, con propagación estricta de errores.
- Habilitación del prefijo `/api/cron/` en `src/middleware.ts` frente a las restricciones de rutas obsoletas (410).
- Configuración de tareas programadas en `vercel.json` (`crons`) compatible con plan Hobby.
- Flujo de GitHub Actions (`.github/workflows/maintenance.yml`) ejecutado cada 15 minutos con comprobación estricta de HTTP 200 y sanitización de registros.
- Protección de acceso mediante validación de cabecera `Authorization: Bearer <CRON_SECRET>`.
- Configuración sincronizada de `CRON_SECRET` en Vercel (Production y Preview) y GitHub Actions Secrets.
- Documentación de la variable `CRON_SECRET` en `.env.example`.
- Retorno de resumen con métricas agregadas de ejecución (`closedAuctions`, `processedAlerts`, `expiredOrders`) sin exponer datos privados ni credenciales.
- Pruebas unitarias completas de autorización, ejecución exitosa y tratamiento de fallos aislados con HTTP 500.
- Verificación en entorno de base de datos real con subasta controlada de no duplicación de alertas en reintentos sucesivos.
- Comprobación manual del workflow de GitHub Actions contra producción con respuesta HTTP 200 verificable.

### Excluido

- Configuración de workers persistentes en servidores dedicados (se utiliza el modelo serverless de Vercel y Supabase).
- Nuevos canales externos de alerta como notificaciones push o SMS (mantiene la campana interna).

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: El sistema debe ofrecer una ruta HTTP `/api/cron/maintain` accesible mediante métodos GET y POST que desencadene el ciclo completo de mantenimiento.
- `RF-02`: El ciclo de mantenimiento debe ejecutar el cierre de subastas (`lp_close_auctions`), la generación de alertas para seguidores de favoritos (`lp_process_favorite_alerts`) y la liberación de pedidos pendientes expirados (`lp_release`) con expiración de sesiones Stripe si aplica.
- `RF-03`: La respuesta exitosa debe devolver un código HTTP 200 y un JSON con el resultado agregado (`ok: true`, timestamp, `closedAuctions`, `processedAlerts`, `expiredOrders`).
- `RF-04`: Si cualquiera de las etapas de mantenimiento falla (`lp_close_auctions`, `lp_process_favorite_alerts`, consulta de pedidos pendientes o `lp_release`), la función `runMaintenance()` debe propagar el error y el endpoint debe responder HTTP 500 controlado sin registrar métricas de operaciones fallidas.

### Requisitos no funcionales

- `RNF-01`: La ruta debe exigir la presencia de la cabecera `Authorization: Bearer <CRON_SECRET>` cuando la variable esté configurada en el entorno, respondiendo con HTTP 401 a peticiones sin token o con token erróneo.
- `RNF-02`: La respuesta y los registros de ejecución no deben exponer identificadores de usuario, credenciales ni detalles internos sensibles. Los workflows deben sanitizar las salidas.
- `RNF-03`: La ejecución repetida o concurrente de la tarea debe ser totalmente idempotente gracias a las garantías transaccionales de PostgreSQL.
- `RNF-04`: El flujo de CI/CD debe fallar explícitamente (código de salida 1) si `CRON_SECRET` no está configurado o si el endpoint responde con un código distinto de HTTP 200.

### Reglas de negocio

- `RN-01`: Las subastas que hayan superado su hora de finalización deben cerrarse independientemente de si hay tráfico de visitantes.
- `RN-02`: Los avisos de subastas favoritas en su última hora deben procesarse periódicamente para llegar a la campana del usuario de forma puntual y exactamente una sola vez por usuario y anuncio.

## 6. Criterios de aceptación

- [x] `AC-01` Una petición a `/api/cron/maintain` sin cabecera de autorización o con un token inválido devuelve un código HTTP 401 `No autorizado`.
- [x] `AC-02` Una petición con la cabecera `Authorization: Bearer <CRON_SECRET>` ejecuta el mantenimiento y devuelve HTTP 200 con `{ ok: true, timestamp, closedAuctions, processedAlerts, expiredOrders }`.
- [x] `AC-03` La configuración `vercel.json` define una invocación periódica diaria compatible con las restricciones del plan Hobby de Vercel y el proyecto incluye un flujo de GitHub Actions (`.github/workflows/maintenance.yml`) para ejecuciones recurrentes cada 15 minutos.
- [x] `AC-04` El middleware de la aplicación no bloquea las rutas `/api/cron/` con el código de error de versión anterior (410).
- [x] `AC-05` Si ocurre un fallo en una operación de mantenimiento (`lp_close_auctions`, `lp_process_favorite_alerts`, pedidos expirados, `lp_release`), el endpoint responde con HTTP 500 controlado y las métricas no se incrementan erróneamente.
- [x] `AC-06` La suite de pruebas unitarias, el build de producción y la validación de specs (`npm run specs:check`) finalizan con éxito.
- [x] `AC-07` En una subasta controlada en su última hora, se genera exactamente 1 alerta y las ejecuciones posteriores no la duplican.
- [x] `AC-08` El workflow de GitHub Actions se ejecuta con éxito contra producción (`https://lapela-nine.vercel.app`) y devuelve HTTP 200 comprobable con métricas en el registro.

## 7. Experiencia y estados

- **Petición autorizada:** HTTP 200 con payload JSON de confirmación y contadores numéricos.
- **Petición no autorizada:** HTTP 401 `{"error": "No autorizado"}`.
- **Fallo interno:** HTTP 500 con mensaje controlado de error.

## 8. Datos, API, seguridad y operación

- **Seguridad:** Autenticación Bearer compatible con el estándar de invocación de Vercel Cron.
- **Idempotencia:** Las funciones RPC subyacentes (`lp_close_auctions`, `lp_process_favorite_alerts`, `lp_release`) son estrictamente transaccionales e idempotentes.
- **Observabilidad:** Salida estructurada de cantidades procesadas por ciclo. En GitHub Actions los logs sanitizan tokens (`***`).

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Seguridad y autorización | HTTP 401 en peticiones no autorizadas | Test unitario Jest en `src/app/api/cron/maintain/__tests__/route.test.ts` | 2026-09-13 |
| Ejecución exitosa | HTTP 200 y métricas agregadas correctas | Test unitario Jest en `src/app/api/cron/maintain/__tests__/route.test.ts` | 2026-09-13 |
| Configuración de hosting | Vercel Cron configurado adecuadamente para plan Hobby | Archivo `vercel.json` con frecuencia diaria (`0 5 * * *`) | 2026-09-13 |
| Middleware | Sin bloqueos 410 en `/api/cron/*` | Verificación de `src/middleware.ts` | 2026-09-13 |
| Tolerancia y propagación de fallos | HTTP 500 en fallos de `lp_close_auctions`, alertas, query de pedidos o `lp_release` | 4 tests dedicados de fallos aislados en `route.test.ts` (8/8 tests passed) | 2026-09-13 |
| Desduplicación de alertas | Exactamente 1 alerta generada en primera ejecución y 0 en reintentos | Test PL/pgSQL en base remota con subasta de prueba (`first_run_alerts: 1`, `second_run_alerts: 1`, `final_total_alerts: 1`) | 2026-09-13 |
| Ejecución real en producción | HTTP 200 en ejecución manual de GitHub Actions | Run ID `34748089646`, log `Response HTTP Status: 200`, `{"ok":true,"timestamp":"2026-09-13T08:36:09.856Z","closedAuctions":0,"processedAlerts":1,"expiredOrders":0}` | 2026-09-13 |
| Build y gobernanza | Build de Next.js y specs válidas | `npm run build` y `npm run specs:check` exitosos | 2026-09-13 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:**
  1. Vercel impone en cuentas Hobby un límite estricto de ejecuciones cron de máximo una vez al día (`Hobby accounts are limited to daily cron jobs`). Para evitar fallos en el despliegue de Vercel manteniendo un programador de alta frecuencia independiente del tráfico, se adoptó una arquitectura dual: `vercel.json` con frecuencia diaria (`0 5 * * *`) y `.github/workflows/maintenance.yml` como programador recurrente en GitHub Actions cada 15 minutos mediante token `CRON_SECRET`.
  2. En `runMaintenance()`, se eliminaron los `.catch(() => 0)` silenciosos y la supresión de errores en `lp_release`. Toda excepción se propaga al endpoint HTTP, devolviendo un HTTP 500 controlado sin incrementar contadores espurios.
  3. En `.github/workflows/maintenance.yml`, se exige `CRON_SECRET` saliendo con código 1 si falta, se comprueba que el código HTTP sea 200 estricto saliendo con código 1 si no lo es, y se eliminó el encadenamiento `|| echo`.
  4. Respecto a la colisión de versiones de migración (`202609120001_favorites_and_alerts.sql` y `202609120001_featured_auctions.sql`): se comprobó la base de datos remota de Supabase (`supabase_migrations.schema_migrations`), verificando que ambas migraciones fueron aplicadas con éxito mediante SQL directo y coexisten de manera compatible (`lp_favorites` y `lp_auction_editions`). No se renombran los archivos para preservar la trazabilidad estricta de las specs existentes.

## 11. Implementación y trazabilidad

- **Archivos o módulos:**
  - `specs/LP-OPS-001-programador-mantenimiento-alertas.md`
  - `SPEC_REGISTRY.md`
  - `PROJECT_CONTEXT.md`
  - `.env.example`
  - `vercel.json`
  - `.github/workflows/maintenance.yml`
  - `src/middleware.ts`
  - `src/controllers/marketplace.ts`
  - `src/app/api/cron/maintain/route.ts`
  - `src/app/api/cron/maintain/__tests__/route.test.ts`
- **Commit o despliegue:** PR #65 fusionada en `main`. Despliegue en producción `https://lapela-nine.vercel.app`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-13 | `IN_PROGRESS` | Creación de especificación, configuración de Vercel Cron y endpoint seguro | Gemini |
| 2026-09-13 | `IN_PROGRESS` | Propagación de errores 500 en RPCs, pruebas de fallos aislados, endurecimiento de workflow, comprobación de desduplicación | Gemini |
| 2026-09-13 | `VERIFIED` | PR #65 integrada en `main`, despliegue en Vercel y ejecución manual exitosa de GitHub Actions (HTTP 200 comprobado) | Gemini |
