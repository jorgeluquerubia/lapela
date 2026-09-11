---
id: LP-FIX-005
type: FIX
status: VERIFIED
priority: P1
requested_at: 2026-09-11
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/37
related_specs: [LP-FEAT-010, LP-FIX-003, LP-FIX-004]
dependencies: []
cross_cutting_concerns: [notificaciones, api, navegación]
---

# LP-FIX-005 · Lectura de notificaciones desde la campana

## 1. Solicitud original

> "ya sí sale, pero cuando abro las notificaciones y pincho en alguna de ellas, no se quita la notificación, sigue el numero en la campanita"

## 2. Contexto y problema

- **Problema u oportunidad:** La cabecera muestra novedades no leídas, pero sus enlaces solo cierran el panel y navegan. No se registra que la persona haya abierto la novedad, por lo que reaparece y el contador no baja.
- **Personas afectadas:** Personas autenticadas que abren una novedad de artículo, pedido o chat desde la campana.
- **Impacto actual:** El contador deja de representar novedades pendientes y obliga a la persona a interpretar como no leídas novedades ya consultadas.
- **Evidencia disponible:** Revisión de `Header.tsx`: los manejadores de enlace solo ejecutan `setOpen(false)`.

## 3. Resultado esperado

Al abrir una novedad desde la campana, esa novedad se marca como leída, desaparece del panel y el contador disminuye de inmediato antes de llevar a la persona al artículo o al chat relacionado.

## 4. Alcance

### Incluido

- Endpoint autenticado para marcar una novedad concreta como leída solo para su destinatario.
- Actualización optimista y navegación tras confirmar la operación desde cualquiera de los enlaces de una novedad.
- Pruebas del endpoint solicitado, el contador y la navegación.

### Excluido

- Marcar todas las novedades como leídas de una vez.
- Cambios en la creación, tipos o retención de notificaciones.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Al pulsar una novedad o cualquiera de sus destinos, el cliente debe solicitar marcar como leída exactamente esa notificación.
- `RF-02`: Tras una respuesta correcta, la novedad debe desaparecer del panel y el distintivo debe disminuir sin esperar al sondeo periódico.
- `RF-03`: La navegación al artículo, pedido o chat debe conservarse después de la lectura.

### Requisitos no funcionales

- `RNF-01`: La API debe impedir marcar como leída una notificación perteneciente a otra persona usuaria.

### Reglas de negocio

- `RN-01`: Solo la persona destinataria puede modificar el estado de lectura de su notificación.
- `RN-02`: La lectura de una novedad no debe marcar otras novedades del mismo artículo o pedido.

## 6. Criterios de aceptación

- [x] `AC-01` Al abrir una notificación de chat, pedido o artículo, deja de figurar como no leída y el contador se reduce.
- [x] `AC-02` La solicitud de lectura identifica la notificación concreta y requiere sesión autenticada.
- [x] `AC-03` Los enlaces continúan llevando al artículo o al chat/pedido correspondiente.
- [x] `AC-04` Pruebas focalizadas, build y `npm run specs:check` correctos.

## 7. Experiencia y estados

- **Estados normales:** El panel se cierra y el distintivo se actualiza antes de mostrar el destino.
- **Estados de error o vacío:** Si la lectura falla, se mantiene la novedad en el panel al refrescar la cabecera; la persona puede seguir entrando en el destino.
- **Mensajes y accesibilidad:** Se conservan los nombres accesibles y el comportamiento nativo de enlaces.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Actualización de `read` y `read_at` en la fila ya existente de `lp_notifications`.
- **API/integraciones:** `POST /api/market/mark-notification-read/:id`.
- **Autorización y privacidad:** El controlador restringe la actualización por `id` y `user_id` autenticado.
- **Migración/rollback:** No requiere migración; el endpoint es aditivo.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Prueba de cabecera | Marca una fila concreta, actualiza distintivo y navega | `HeaderNotifications` (3 pruebas) correcto | 2026-09-11 |
| Build y gobernanza | Comprobaciones correctas | `npm run build` con configuración pública simulada y `npm run specs:check` correctos | 2026-09-11 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Se marca la fila concreta, no todas las notificaciones del artículo o pedido, para no ocultar novedades independientes.
- **Riesgos y límites:** Una interrupción de red puede impedir la confirmación antes de navegar; la pantalla de destino conserva sus marcados contextuales y el siguiente sondeo refleja el estado real.
- **Preguntas abiertas:** Ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `src/components/Header.tsx`, `src/controllers/marketplace.ts`, pruebas de cabecera.
- **Migraciones/configuración:** No aplica.
- **Commit o despliegue:** [PR #39](https://github.com/jorgeluquerubia/lapela/pull/39) preparada para `main`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-11 | `DRAFT` | Ficha creada tras detectar la ausencia de marcado desde la campana | Codex |
| 2026-09-11 | `IN_PROGRESS` | Issue #37 creada y rama de corrección asignada | Codex |
| 2026-09-11 | `VERIFIED` | Lectura individual, contador optimista, navegación y pruebas verificados | Codex |
| 2026-09-11 | `VERIFIED` | PR #39 preparada contra `main` | Codex |
