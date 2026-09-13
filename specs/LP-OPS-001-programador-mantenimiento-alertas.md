---
id: LP-OPS-001
type: OPS
status: VERIFIED
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

## 4. Alcance

### Incluido

- Endpoint seguro de mantenimiento en Next.js (`src/app/api/cron/maintain/route.ts`).
- Modularización de la lógica en `src/controllers/marketplace.ts` mediante la función `runMaintenance()`.
- Habilitación del prefijo `/api/cron/` en `src/middleware.ts` frente a las restricciones de rutas obsoletas (410).
- Configuración de tareas programadas en `vercel.json` (`crons`).
- Protección de acceso mediante validación de cabecera `Authorization: Bearer <CRON_SECRET>`.
- Documentación de la variable `CRON_SECRET` en `.env.example`.
- Retorno de resumen con métricas agregadas de ejecución (`closedAuctions`, `processedAlerts`, `expiredOrders`) sin exponer datos privados ni credenciales.
- Pruebas unitarias completas de autorización, ejecución exitosa y tratamiento de errores internos.

### Excluido

- Configuración de workers persistentes en servidores dedicados (se utiliza el modelo serverless de Vercel y Supabase).
- Nuevos canales externos de alerta como notificaciones push o SMS (mantiene la campana interna).

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: El sistema debe ofrecer una ruta HTTP `/api/cron/maintain` accesible mediante métodos GET y POST que desencadene el ciclo completo de mantenimiento.
- `RF-02`: El ciclo de mantenimiento debe ejecutar el cierre de subastas (`lp_close_auctions`), la generación de alertas para seguidores de favoritos (`lp_process_favorite_alerts`) y la liberación de pedidos pendientes expirados (`lp_release`) con expiración de sesiones Stripe si aplica.
- `RF-03`: La respuesta exitosa debe devolver un código HTTP 200 y un JSON con el resultado agregado (`ok: true`, timestamp, `closedAuctions`, `processedAlerts`, `expiredOrders`).

### Requisitos no funcionales

- `RNF-01`: La ruta debe exigir la presencia de la cabecera `Authorization: Bearer <CRON_SECRET>` cuando la variable esté configurada en el entorno, respondiendo con HTTP 401 a peticiones sin token o con token erróneo.
- `RNF-02`: La respuesta y los registros de ejecución no deben exponer identificadores de usuario, credenciales ni detalles internos sensibles.
- `RNF-03`: La ejecución repetida o concurrente de la tarea debe ser totalmente idempotente gracias a las garantías transaccionales de PostgreSQL.

### Reglas de negocio

- `RN-01`: Las subastas que hayan superado su hora de finalización deben cerrarse independientemente de si hay tráfico de visitantes.
- `RN-02`: Los avisos de subastas favoritas en su última hora deben procesarse periódicamente para llegar a la campana del usuario de forma puntual.

## 6. Criterios de aceptación

- [x] `AC-01` Una petición a `/api/cron/maintain` sin cabecera de autorización o con un token inválido devuelve un código HTTP 401 `No autorizado`.
- [x] `AC-02` Una petición con la cabecera `Authorization: Bearer <CRON_SECRET>` ejecuta el mantenimiento y devuelve HTTP 200 con `{ ok: true, timestamp, closedAuctions, processedAlerts, expiredOrders }`.
- [x] `AC-03` La configuración `vercel.json` define la invocación periódica del endpoint `/api/cron/maintain`.
- [x] `AC-04` El middleware de la aplicación no bloquea las rutas `/api/cron/` con el código de error de versión anterior (410).
- [x] `AC-05` Si ocurre un fallo en una operación de mantenimiento, el endpoint responde con HTTP 500 sin filtrar trazas privadas.
- [x] `AC-06` La suite de pruebas unitarias, el build de producción y la validación de specs (`npm run specs:check`) finalizan con éxito.

## 7. Experiencia y estados

- **Petición autorizada:** HTTP 200 con payload JSON de confirmación y contadores numéricos.
- **Petición no autorizada:** HTTP 401 `{"error": "No autorizado"}`.
- **Fallo interno:** HTTP 500 con mensaje controlado de error.

## 8. Datos, API, seguridad y operación

- **Seguridad:** Autenticación Bearer compatible con el estándar de invocación de Vercel Cron.
- **Idempotencia:** Las funciones RPC subyacentes (`lp_close_auctions`, `lp_process_favorite_alerts`, `lp_release`) son estrictamente transaccionales e idempotentes.
- **Observabilidad:** Salida estructurada de cantidades procesadas por ciclo.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Seguridad y autorización | HTTP 401 en peticiones no autorizadas | Test unitario Jest en `src/app/api/cron/maintain/__tests__/route.test.ts` | 2026-09-13 |
| Ejecución exitosa | HTTP 200 y métricas agregadas correctas | Test unitario Jest en `src/app/api/cron/maintain/__tests__/route.test.ts` | 2026-09-13 |
| Configuración de hosting | Vercel Cron configurado adecuadamente | Archivo `vercel.json` válido | 2026-09-13 |
| Middleware | Sin bloqueos 410 en `/api/cron/*` | Verificación de `src/middleware.ts` | 2026-09-13 |
| Build y gobernanza | Build de Next.js y specs válidas | `npm run build` y `npm run specs:check` exitosos | 2026-09-13 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Utilizar Vercel Cron con cabecera `CRON_SECRET` estándar de la plataforma; modularizar `runMaintenance()` en `marketplace.ts` conservando la llamada oportunista en catálogo como fallback de seguridad.
- **Riesgos y límites:** En entornos de Vercel sin plan Pro, la frecuencia mínima de cron puede estar limitada por el plan de hosting; el fallback oportunista mitiga cualquier intervalo amplio.

## 11. Implementación y trazabilidad

- **Archivos o módulos:**
  - `specs/LP-OPS-001-programador-mantenimiento-alertas.md`
  - `SPEC_REGISTRY.md`
  - `PROJECT_CONTEXT.md`
  - `.env.example`
  - `vercel.json`
  - `src/middleware.ts`
  - `src/controllers/marketplace.ts`
  - `src/app/api/cron/maintain/route.ts`
  - `src/app/api/cron/maintain/__tests__/route.test.ts`
- **Commit o despliegue:** Rama `gemini/lp-ops-001-programador-mantenimiento-alertas`, PR hacia `main`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-13 | `IN_PROGRESS` | Creación de especificación, configuración de Vercel Cron y endpoint seguro | Gemini |
| 2026-09-13 | `VERIFIED` | Validación de endpoint cron, tests unitarios, build y configuración de hosting | Gemini |
