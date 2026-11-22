---
id: LP-FIX-016
type: FIX
status: IMPLEMENTED
priority: P1
requested_at: 2026-11-22
requested_by: usuario
source: conversación y auditoría PR #86
owner: codex
github_issue: pending
related_specs: [LP-FEAT-010, LP-FIX-003, LP-FIX-004, LP-FIX-005, LP-FEAT-021]
dependencies: []
cross_cutting_concerns: [aislamiento-de-entornos, actividad, notificaciones, privacidad, base-de-datos]
---

# LP-FIX-016 · Aislamiento de entorno en actividad y notificaciones

## 1. Solicitud original

> Corrige la separación entre sandbox y live en Mi actividad y en la campana de notificaciones. En la auditoría, una misma cuenta con un pedido y un aviso de un anuncio ficticio live los veía desde sandbox, mientras que el detalle del pedido respondía 404. Revisa los datos derivados de anuncios y pedidos en esas vistas y las acciones de lectura individual o masiva de avisos. Prueba con una sola identidad que tenga registros en ambos entornos. Verifica tanto el filtrado en sandbox y live como que marcar avisos desde un entorno no cambie los del otro. Cubre avisos antiguos sin enlace directo a un anuncio o pedido conforme al modelo existente.

## 2. Contexto y problema

- **Problema u oportunidad:** El detalle de pedido ya verifica el entorno de su anuncio, pero `Mi actividad`, la campana y los marcados de lectura consultan avisos o datos derivados sin el mismo límite.
- **Personas afectadas:** Cuentas que participan en datos sandbox y live, en especial operadores de prueba antes de la activación real.
- **Impacto actual:** Se revelan metadatos de otro entorno, se ofrecen enlaces que terminan en 404 y una lectura desde sandbox puede alterar el contador de live.
- **Evidencia disponible:** Auditoría reproducible de [PR #86](https://github.com/jorgeluquerubia/lapela/pull/86), `integration/integrity-findings.md`.

## 3. Resultado esperado

Cada vista y acción de actividad usa exclusivamente el entorno activo. Una misma identidad puede tener registros en ambos entornos sin que una pantalla ni una lectura afecten al otro. Los avisos históricos sin relación a anuncio o pedido se conservan como avisos sandbox, que es el entorno histórico de la beta.

## 4. Alcance

### Incluido

- Persistencia y retrorelleno del entorno de `lp_notifications` a partir de su anuncio o pedido.
- Compatibilidad de avisos heredados sin `listing_id` ni `order_id` como `sandbox`.
- Filtros de entorno para actividad, campana y marcado individual, masivo y contextual.
- Regresiones de controlador y SQL con una identidad ficticia presente en ambos entornos.

### Excluido

- Despliegues, migración en producción, cambios de modo de pagos o uso de Stripe live.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Mi actividad debe mostrar solamente anuncios, pedidos y datos derivados del entorno activo.
- `RF-02`: La campana debe devolver únicamente avisos del entorno activo, incluidos sus títulos derivados de anuncios.
- `RF-03`: Marcar un aviso concreto, todos los avisos o los avisos contextuales de un pedido/anuncio solo puede cambiar filas del entorno activo.
- `RF-04`: Los avisos históricos sin relación directa se asignan a sandbox y siguen disponibles allí.

### Requisitos no funcionales

- `RNF-01`: Una prueba con una sola identidad y datos sandbox/live demuestra que ningún resultado ni contador cruza de entorno.
- `RNF-02`: La migración rellena el entorno sin borrar avisos existentes y crea un valor obligatorio para todos los nuevos avisos.

### Reglas de negocio

- `RN-01`: El entorno de un aviso vinculado es el entorno de su anuncio; el pedido hereda el entorno de su anuncio.
- `RN-02`: Los avisos heredados sin vínculo se tratan como sandbox por la compatibilidad con la beta histórica.
- `RN-03`: La lectura es un estado independiente por aviso y entorno.

## 6. Criterios de aceptación

- [ ] `AC-01` En sandbox, actividad y campana de una identidad con registros en ambos entornos solo devuelven los datos sandbox.
- [ ] `AC-02` En live, las mismas rutas solo devuelven los datos live.
- [ ] `AC-03` Los marcados individual, masivo y contextual no alteran avisos del otro entorno.
- [ ] `AC-04` Un aviso antiguo sin anuncio ni pedido se conserva, queda en sandbox y no aparece en live.
- [ ] `AC-05` Pruebas focalizadas, SQL aislado, `npm run specs:check` y build completan correctamente.

## 7. Experiencia y estados

- **Estados normales:** El contador, las filas de actividad y los enlaces representan exclusivamente el entorno activo.
- **Estados de error o vacío:** Si no hay avisos del entorno activo, la campana conserva su mensaje de vacío aunque existan avisos en el otro entorno.
- **Mensajes y accesibilidad:** Sin cambios de interfaz ni de nombres accesibles.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Nueva columna obligatoria `environment` en `lp_notifications`; trigger para derivarla de anuncio/pedido y retrorelleno seguro.
- **API/integraciones:** `GET /api/market/activity`, `GET /api/market/notifications` y las acciones de lectura aplican el entorno activo.
- **Autorización y privacidad:** Se mantiene la restricción por destinatario y se añade la restricción por entorno a lectura y consulta.
- **Observabilidad y soporte:** El aislamiento se documenta con la auditoría de PR #86 y regresiones reproducibles.
- **Métricas o señales de éxito:** Cero resultados y cero actualizaciones cruzadas en la prueba sandbox/live.
- **Migración/rollback:** La migración conserva filas y usa `sandbox` para avisos históricamente no atribuibles.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Controlador de avisos | Consultas y lecturas incluyen el entorno activo | pendiente | 2026-11-22 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** El entorno se materializa en el aviso para permitir filtrar y marcar sin depender de joins opcionales. Los avisos no atribuibles anteriores se conservan en sandbox, el único entorno histórico de beta.
- **Riesgos y límites:** La corrección no elimina datos erróneos ya vistos; solo evita futuras lecturas o mutaciones cruzadas.
- **Preguntas abiertas:** La issue no se pudo crear desde este entorno: el conector devolvió 403 y `gh` no está instalado. Se mantiene `pending` hasta contar con acceso.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `src/controllers/marketplace.ts`, pruebas del controlador y SQL de regresión.
- **Migraciones/configuración:** Nueva migración con versión única posterior a las existentes en `supabase/migrations`.
- **Commit o despliegue:** Pendiente; no se realizará despliegue ni merge en esta tarea.
- **Notas de implementación:** Rama `codex/lp-fix-016-activity-notifications-environment` en worktree aislado `.worktrees/lp-fix-016`.

## 12. Historial

