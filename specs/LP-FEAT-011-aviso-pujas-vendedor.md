---
id: LP-FEAT-011
type: FEATURE
status: VERIFIED
priority: P1
requested_at: 2026-09-10
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/31
related_specs: [LP-FEAT-009, LP-FEAT-010]
dependencies: []
cross_cutting_concerns: [notificaciones, subastas]
---

# LP-FEAT-011 · Aviso de nuevas pujas al vendedor

## 1. Solicitud original

> "Además he publicado un artículo, alguien ha pujado y tampoco me ha llegado ninguna notificación."

## 2. Contexto y problema

- **Problema u oportunidad:** Las reglas anteriores alertaban solo al pujador superado. Una puja válida no generaba ningún aviso al propietario de la subasta.
- **Personas afectadas:** Vendedores de artículos en modalidad subasta.
- **Impacto actual:** El vendedor puede desconocer que su subasta ha recibido actividad hasta entrar manualmente a revisarla.

## 3. Resultado esperado

Cada puja válida de otra persona crea para el vendedor una novedad persistente «Nueva puja», visible en la campana y en Mi actividad, con enlace a la subasta.

## 4. Alcance

### Incluido

- Tipo `bid_received` de notificación.
- Registro transaccional al aceptar una puja válida.
- Badge y enlace a la subasta desde las superficies de notificaciones existentes.
- Pruebas SQL e interfaz de regresión.

### Excluido

- Alertas por correo o push.
- Agrupación o preferencias de frecuencia de pujas.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Una puja válida debe crear una notificación no leída para el vendedor de la subasta.
- `RF-02`: La novedad debe mostrar «Nueva puja» y permitir abrir el artículo subastado.

### Requisitos no funcionales

- `RNF-01`: La notificación se crea en la misma transacción que la puja, sin exponer un estado de puja aceptada sin aviso.

### Reglas de negocio

- `RN-01`: Solo una puja que supera el mínimo y queda registrada crea el aviso; intentos inválidos no lo hacen.
- `RN-02`: El vendedor no puede pujar en su propio artículo y nunca recibe una notificación causada por sí mismo.

## 6. Criterios de aceptación

- [x] `AC-01` Una puja válida genera exactamente una notificación `bid_received` no leída para el vendedor.
- [x] `AC-02` Una puja inválida no genera aviso para el vendedor.
- [x] `AC-03` La campana y Mi actividad muestran «Nueva puja» con enlace a la subasta.
- [x] `AC-04` SQL, pruebas focalizadas, build y comprobación de specs finalizan correctamente.

## 7. Experiencia y estados

- **Estados normales:** La campana muestra «Nueva puja» y el artículo; Mi actividad mantiene su badge en Mis anuncios.
- **Estados vacíos:** Sin pujas no se añade ningún badge.
- **Mensajes y accesibilidad:** El enlace describe el artículo asociado.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** La restricción de tipos de `lp_notifications` incorpora `bid_received`.
- **API/integraciones:** Sin rutas nuevas; las rutas de actividad y campana devuelven el tipo existente.
- **Autorización y privacidad:** La función SQL fija como destinatario al `seller_id` bloqueado de la subasta.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| SQL de pujas | Aviso único para puja válida y ninguno para inválida | Migración aplicada en Supabase; consulta transaccional `PASS LP-FEAT-011` | 2026-09-10 |
| Interfaz | Etiqueta de nueva puja visible | `ActivityNotifications` y `HeaderNotifications`: 2 suites, 3 pruebas superadas | 2026-09-10 |
| Build y specs | Comprobaciones correctas | `npm run build` y `npm run specs:check` correctos | 2026-09-10 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Se conserva una novedad por puja para ofrecer trazabilidad inmediata en la beta.
- **Riesgos y límites:** Subastas con mucha actividad pueden acumular avisos; la agrupación queda para una iteración futura.
- **Preguntas abiertas:** Ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `supabase/migrations/202609100002_seller_bid_notifications.sql`, `src/app/my-products/page.tsx`, `src/app/globals.css`, `src/components/__tests__/ActivityNotifications.test.tsx` y `tests/database/marketplace.sql`.
- **Migraciones/configuración:** `202609100002_seller_bid_notifications.sql`, aplicada en Supabase el 2026-09-10.
- **Commit o despliegue:** Pendiente.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-10 | `DRAFT` | Creación de la ficha | Codex |
| 2026-09-10 | `IN_PROGRESS` | Issue #31 creada y rama de implementación asignada | Codex |
| 2026-09-10 | `VERIFIED` | Migración, transacción, interfaz y compilación validadas | Codex |
