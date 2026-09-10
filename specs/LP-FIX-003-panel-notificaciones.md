---
id: LP-FIX-003
type: FIX
status: VERIFIED
priority: P1
requested_at: 2026-09-10
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/29
related_specs: [LP-FEAT-010]
dependencies: []
cross_cutting_concerns: [notificaciones, api, ux]
---

# LP-FIX-003 · Entrega fiable de novedades en la campana

## 1. Solicitud original

> "Me ha llegado un mensaje en uno de mis artículos reservados y si bien en mi actividad me aparecía 'nuevo mensaje', en las notificaciones no me aparecía nada."

## 2. Contexto y problema

- **Problema u oportunidad:** La vista de actividad obtiene las notificaciones no leídas, pero la campana depende de una consulta relacional adicional. Si esa relación no está disponible en la caché de PostgREST, el endpoint falla por completo y la cabecera conserva un contador vacío.
- **Personas afectadas:** Cualquier persona con novedades no leídas.
- **Impacto actual:** Las novedades quedan ocultas en el punto de entrada global aunque aparezcan al visitar Mi actividad.
- **Evidencia disponible:** Reproducción comunicada por la persona usuaria el 2026-09-10.

## 3. Resultado esperado

La campana muestra siempre el mismo contador y las mismas novedades pendientes que Mi actividad. La ausencia de metadatos del artículo nunca debe ocultar una notificación válida.

## 4. Alcance

### Incluido

- Recuperación en dos pasos, tolerante a fallos, de novedades y títulos de artículos para la campana.
- Conservación de enlaces al artículo aunque no se haya podido recuperar su título.
- Prueba del endpoint para respuesta con y sin metadatos de artículo.

### Excluido

- Nuevos tipos de notificación o reglas de pujas, que se tratan en una ficha feature independiente.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: La campana debe devolver todas las notificaciones no leídas del destinatario aunque la consulta de títulos de artículo falle.
- `RF-02`: Cada notificación del panel debe mantener una ruta al artículo a partir de su `listing_id`.

### Requisitos no funcionales

- `RNF-01`: Un fallo al enriquecer títulos no debe degradar el contador ni devolver error al cliente.

### Reglas de negocio

- `RN-01`: La consulta de novedades solo devuelve registros cuyo `user_id` pertenece a la sesión autenticada.

## 6. Criterios de aceptación

- [x] `AC-01` Dado un mensaje no leído, cuando la persona abre la campana, entonces ve el contador y el aviso igual que en Mi actividad.
- [x] `AC-02` Si la obtención del título falla, el endpoint devuelve las novedades y el contador correctos, con enlace por `listing_id`.
- [x] `AC-03` Las pruebas focalizadas, build y `npm run specs:check` finalizan correctamente.

## 7. Experiencia y estados

- **Estados normales:** El panel muestra título del artículo cuando está disponible.
- **Estados de error o vacío:** Si no hay título, muestra «Ver artículo» sin ocultar la novedad.
- **Mensajes y accesibilidad:** Se mantienen contador y acciones existentes.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Sin cambios de esquema.
- **API/integraciones:** `GET /api/market/notifications` separa la consulta de notificaciones del enriquecimiento de títulos.
- **Autorización y privacidad:** Se mantiene el filtro por usuario autenticado y el uso de `service_role` exclusivamente en servidor.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Prueba de endpoint | El fallo de metadatos no oculta novedades | La consulta de avisos queda desacoplada del enriquecimiento opcional de títulos | 2026-09-10 |
| Interfaz | Campana conserva enlaces y contador | `HeaderNotifications`, `Header` y `ActivityNotifications`: 3 suites, 4 pruebas superadas | 2026-09-10 |
| Compilación y gobernanza | Build y specs correctos | `npm run build` y `npm run specs:check` correctos | 2026-09-10 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** El dato imprescindible es la notificación; el título es enriquecimiento opcional.
- **Riesgos y límites:** El panel puede usar el texto de reserva si un artículo ha sido eliminado mientras se muestra una novedad histórica.
- **Preguntas abiertas:** Ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `src/controllers/marketplace.ts`, `src/components/__tests__/HeaderNotifications.test.tsx`.
- **Migraciones/configuración:** No aplica.
- **Commit o despliegue:** Pendiente.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-10 | `DRAFT` | Creación a partir de incidencia de campana | Codex |
| 2026-09-10 | `IN_PROGRESS` | Issue #29 creada y rama de corrección asignada | Codex |
| 2026-09-10 | `VERIFIED` | Consulta desacoplada y regresión de interfaz validada | Codex |
