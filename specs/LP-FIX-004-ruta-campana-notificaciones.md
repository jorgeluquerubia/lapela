---
id: LP-FIX-004
type: FIX
status: VERIFIED
priority: P0
requested_at: 2026-09-11
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/33
related_specs: [LP-FIX-003, LP-FEAT-010]
dependencies: []
cross_cutting_concerns: [notificaciones, api]
---

# LP-FIX-004 · Ruta correcta para la campana de notificaciones

## 1. Solicitud original

> "sigo sin ver las notificaciones en la campanita, no me sale ningún número cuando hay alguna notificación que debería mostrarse"

## 2. Contexto y problema

- **Problema u oportunidad:** La campana consulta `/api/marketplace?action=notifications`, pero la API vigente usa `/api/market/notifications`. La petición falla y el componente ignora el error, dejando el contador en cero.
- **Personas afectadas:** Todas las personas autenticadas con novedades pendientes.
- **Impacto actual:** La función principal de la campana no funciona aunque Mi actividad muestre las mismas notificaciones.

## 3. Resultado esperado

La campana consulta la ruta activa, recibe el contador de novedades y lo muestra al cargar la cabecera.

## 4. Alcance

### Incluido

- Sustituir la ruta obsoleta por la ruta activa de la API.
- Prueba que comprueba la URL solicitada y el contador resultante.

### Excluido

- Cambios de datos, esquema o tipos de notificación.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: La cabecera autenticada debe solicitar `GET /api/market/notifications` al montarse.
- `RF-02`: Un contador devuelto por esa ruta debe aparecer en la campana.

### Requisitos no funcionales

- `RNF-01`: La prueba de interfaz debe fallar si se vuelve a usar la ruta obsoleta.

### Reglas de negocio

- `RN-01`: La campana solo consulta novedades cuando existe sesión autenticada.

## 6. Criterios de aceptación

- [x] `AC-01` Con una novedad no leída, la campana muestra el número devuelto por `/api/market/notifications`.
- [x] `AC-02` La prueba comprueba explícitamente la ruta solicitada.
- [x] `AC-03` Pruebas focalizadas, build y `npm run specs:check` correctos.

## 7. Experiencia y estados

- **Estados normales:** El distintivo numérico aparece sobre la campana cuando `unreadCount > 0`.
- **Estados de error o vacío:** El contador permanece oculto solo cuando no hay novedades o no existe sesión.
- **Mensajes y accesibilidad:** Se mantiene la etiqueta accesible con el número de novedades.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Sin cambios.
- **API/integraciones:** La interfaz usa la ruta documentada `GET /api/market/notifications`.
- **Autorización y privacidad:** Sin cambios.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Prueba de cabecera | URL activa y contador visibles | `HeaderNotifications` verifica `/api/market/notifications` y el distintivo | 2026-09-11 |
| Build y gobernanza | Comprobaciones correctas | 2 suites/3 pruebas, `npm run build` y `npm run specs:check` correctos | 2026-09-11 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Se elimina la URL obsoleta en vez de mantener una ruta de compatibilidad inexistente.
- **Riesgos y límites:** Ninguno conocido.
- **Preguntas abiertas:** Ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `src/components/Header.tsx`, `src/components/__tests__/HeaderNotifications.test.tsx`.
- **Migraciones/configuración:** No aplica.
- **Commit o despliegue:** Pendiente.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-11 | `DRAFT` | Creación tras diagnóstico de ruta obsoleta | Codex |
| 2026-09-11 | `IN_PROGRESS` | Issue #33 creada y rama de corrección asignada | Codex |
| 2026-09-11 | `VERIFIED` | Ruta de API corregida y cubierta por prueba de regresión | Codex |
