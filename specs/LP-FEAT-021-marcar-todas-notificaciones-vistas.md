---
id: LP-FEAT-021
type: FEATURE
status: VERIFIED
priority: P2
requested_at: 2026-09-13
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/80
related_specs: [LP-FEAT-010, LP-FIX-003, LP-FIX-005]
dependencies: []
cross_cutting_concerns: [notificaciones, api, navegación, frontend]
---

# LP-FEAT-021 · Marcar todas las notificaciones como vistas desde el panel

## 1. Solicitud original

> "quiero que en el panel de notificaciones haya una opcion para marcar todas como vistas"

## 2. Contexto y problema

- **Problema u oportunidad:** Las personas usuarias con varias novedades acumuladas (mensajes, ofertas, pujas, compras o favoritos) solo podían marcarlas como vistas abriéndolas una a una. Se necesitaba una acción directa en el panel para marcar todas las notificaciones pendientes simultáneamente.
- **Personas afectadas:** Personas registradas con novedades pendientes en la campana de notificaciones.
- **Impacto actual:** Dificultad para limpiar notificaciones que el usuario ya conoce o no desea abrir individualmente, dejando el indicador numérico permanentemente activo.
- **Evidencia disponible:** Solicitud directa de usuario; en LP-FIX-005 se implementó la lectura individual y el marcado masivo quedó explícitamente excluido para una fase posterior.

## 3. Resultado esperado

Al abrir el panel de notificaciones desde la campana, si existen novedades pendientes, se muestra la acción "Marcar todas como vistas". Al pulsarla, todas las notificaciones pendientes del usuario se marcan como leídas en el servidor, el contador de la campana se restablece a cero y el panel pasa a mostrar el estado vacío ("No tienes novedades pendientes.") sin cerrarse bruscamente.

## 4. Alcance

### Incluido

- Acción "Marcar todas como vistas" en la cabecera del panel de notificaciones (`Header.tsx`) cuando existen novedades pendientes.
- Endpoint autenticado `POST /api/market/mark-all-notifications-read` en `src/controllers/marketplace.ts`.
- Limpieza optimista del panel y puesta a cero del indicador de novedades.
- Pruebas unitarias de frontend para el componente de cabecera y panel de notificaciones.
- Pruebas unitarias de backend para el endpoint del controlador de marketplace.
- Estilos visuales acordes con el diseño de La Pela en `src/app/globals.css`.

### Excluido

- Eliminación física de filas de notificaciones en base de datos (se conservan como leídas con `read = true` y `read_at`).
- Configuración de filtros o eliminación selectiva masiva por categorías o tipo.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Cuando la persona usuaria tiene al menos una notificación sin leer, el panel de notificaciones debe mostrar la opción "Marcar todas como vistas".
- `RF-02`: Al hacer clic en "Marcar todas como vistas", se debe enviar una petición `POST /api/market/mark-all-notifications-read`.
- `RF-03`: Al confirmarse la operación en el cliente, las notificaciones deben limpiarse de la vista, el contador de la campana debe reducirse a cero y el panel debe mostrar el mensaje "No tienes novedades pendientes.".
- `RF-04`: Cuando no haya notificaciones pendientes en la lista, la opción "Marcar todas como vistas" no debe mostrarse en el panel.

### Requisitos no funcionales

- `RNF-01`: El endpoint debe requerir autenticación y restringir la actualización estrictamente a las notificaciones pertenecientes al usuario de la sesión (`user_id = user.id`).

### Reglas de negocio

- `RN-01`: Solo la persona destinataria puede modificar el estado de lectura de sus propias notificaciones.

## 6. Criterios de aceptación

- [x] `AC-01` Con notificaciones pendientes, el panel desplegable de la campana muestra la opción "Marcar todas como vistas".
- [x] `AC-02` Al pulsar "Marcar todas como vistas", se envía `POST /api/market/mark-all-notifications-read`, el indicador de novedades desaparece y el panel muestra "No tienes novedades pendientes.".
- [x] `AC-03` El endpoint `POST /api/market/mark-all-notifications-read` rechaza accesos anónimos y solo actualiza las filas con `read = false` del usuario autenticado.
- [x] `AC-04` Sin notificaciones pendientes, la opción "Marcar todas como vistas" no se muestra.
- [x] `AC-05` Pruebas automatizadas, build y comprobación de specs (`npm run specs:check`) satisfactorias.

## 7. Experiencia y estados

- **Estados normales:** Al hacer clic en "Marcar todas como vistas", el botón muestra un estado transitorio ("Marcando...") y acto seguido el panel muestra "No tienes novedades pendientes.". El dot numérico de la campana se oculta.
- **Estados de error o vacío:** Si la petición falla, las notificaciones se mantienen en el panel y el usuario puede reintentar la acción.
- **Mensajes y accesibilidad:** El botón dispone de texto descriptivo y soporte para teclado y lectores de pantalla.
- **Responsive:** La cabecera del panel distribuye las acciones (`.notification-panel-actions`) adecuándose a pantallas móviles y de escritorio.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Actualización masiva de `read: true` y `read_at: new Date().toISOString()` en la tabla `lp_notifications` filtrada por `user_id` y `read = false`.
- **API/integraciones:** `POST /api/market/mark-all-notifications-read`.
- **Autorización y privacidad:** Protegido con `currentUser()`. No permite marcar notificaciones de otros usuarios.
- **Migración/rollback:** No requiere cambios en el esquema ni nuevas columnas en PostgreSQL; el endpoint es puramente aditivo.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Pruebas de cabecera | Visualización del botón, llamada a la API y actualización del contador y estado vacío | `HeaderNotifications.test.tsx` (5 pruebas pasando) | 2026-09-13 |
| Pruebas de endpoint | Control de autenticación y marcado masivo en base de datos | `marketplace-notifications.test.ts` (2 pruebas pasando) | 2026-09-13 |
| Build de producción | Compilación sin errores con configuración pública simulada | `npm run build` correcto (29 páginas estáticas y rutas dinámicas generadas) | 2026-09-13 |
| Gobernanza y specs | Estructura, registro y ramas validadas | `node tools/validate-specs.mjs` sin errores | 2026-09-13 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** El botón se ubica en la cabecera del panel junto a "Ver actividad", mostrándose solo cuando hay elementos pendientes. Al pulsarse, el panel se mantiene abierto mostrando el estado vacío en lugar de cerrarse bruscamente, confirmando visualmente el resultado.
- **Riesgos y límites:** Si falla la red durante la petición, el estado no se actualiza localmente y las notificaciones siguen visibles para reintento.
- **Preguntas abiertas:** Ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `src/controllers/marketplace.ts`, `src/components/Header.tsx`, `src/app/globals.css`, `src/components/__tests__/HeaderNotifications.test.tsx`, `src/controllers/__tests__/marketplace-notifications.test.ts`, `PROJECT_CONTEXT.md`, `SPEC_REGISTRY.md`.
- **Migraciones/configuración:** Ninguna.
- **Commit o despliegue:** Rama `gemini/lp-feat-021-marcar-todas-notificaciones-vistas` preparada para pull request hacia `main`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-13 | `IN_PROGRESS` | Creación de especificación e issue #80 tras solicitud de usuario | Gemini |
| 2026-09-13 | `VERIFIED` | Implementación en frontend, backend, estilos y pruebas verificados | Gemini |
