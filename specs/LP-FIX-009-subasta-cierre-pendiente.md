---
id: LP-FIX-009
type: FIX
status: IMPLEMENTED
priority: P1
requested_at: 2026-09-13
requested_by: usuario
source: conversación
owner: codex
github_issue: https://github.com/jorgeluquerubia/lapela/issues/73
related_specs: [LP-FEAT-019, LP-FEAT-010]
dependencies: [LP-FEAT-019]
cross_cutting_concerns: [subastas, consistencia, accesibilidad]
---

# LP-FIX-009 · Bloquear pujas durante cierre pendiente

## 1. Solicitud original

> Cuando `ends_at` ya ha vencido pero el anuncio todavía conserva temporalmente el estado `available`, mostrar `Pendiente de cierre` y eliminar las acciones de puja imposibles.

## 2. Contexto y problema

- **Problema u oportunidad:** El cierre periódico puede tardar unos minutos en persistir `expired` o `reserved`. Durante esa ventana la interfaz infería que el anuncio seguía activo solo por su estado almacenado.
- **Personas afectadas:** Pujadores y visitantes de una edición finalizada.
- **Impacto actual:** Se muestra `Pujar ahora` aunque PostgreSQL rechazará la operación por haber vencido `ends_at`.
- **Evidencia disponible:** QA de `getItemAuctionOutcome`, `EditionDetailInteractive` y la ficha pública.

## 3. Resultado esperado

Una subasta con cierre real vencido queda inmediatamente sin acciones de puja, se identifica como pendiente de procesamiento y conserva su resultado definitivo para cuando finalice el mantenimiento.

## 4. Alcance

### Incluido

- Estado derivado `pending` para subastas `available` vencidas.
- Eliminación de CTA y formularios de puja en edición y ficha pública.
- Actualización reactiva al alcanzar `ends_at`.
- Pruebas de dominio y componentes.

### Excluido

- Cambiar la adjudicación o el programador.
- Inferir ganador antes de ejecutar `lp_close_auctions`.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: `ends_at <= now` debe impedir cualquier llamada visual a pujar aunque el estado siga siendo `available`.
- `RF-02`: La edición debe mostrar `Pendiente de cierre` hasta recibir el estado persistido definitivo.
- `RF-03`: La ficha debe sustituir el formulario o enlace de puja por un aviso no interactivo.

### Requisitos no funcionales

- `RNF-01`: La transición debe producirse en cliente sin recargar la página.
- `RNF-02`: El estado debe tener texto accesible y no depender del color.

### Reglas de negocio

- `RN-01`: El tiempo real de `ends_at` prevalece para aceptar acciones; el estado persistido prevalece para decidir el resultado definitivo.

## 6. Criterios de aceptación

- [x] `AC-01` Una subasta disponible y futura continúa mostrando `Pujar ahora`.
- [x] `AC-02` Al alcanzar `ends_at`, la edición muestra `Pendiente de cierre` y elimina `Pujar ahora`.
- [x] `AC-03` La ficha pública no muestra formulario ni enlace de puja después del cierre.
- [x] `AC-04` No se etiqueta como adjudicada ni sin venta hasta que el backend persista el resultado.
- [x] `AC-05` Pruebas dirigidas, build y `npm run specs:check` terminan correctamente.

## 7. Experiencia y estados

- **Estados normales:** En curso, pendiente de cierre y resultado definitivo.
- **Estados de error o vacío:** El estado pendiente explica que el cierre se está procesando.
- **Mensajes y accesibilidad:** Aviso con `role=status` y sin acción imposible.
- **Responsive o canales afectados:** Página de edición y ficha pública.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Sin cambios.
- **API/integraciones:** Sin cambios.
- **Autorización y privacidad:** Sin cambios.
- **Observabilidad y soporte:** El intervalo pendiente depende del mantenimiento existente.
- **Métricas o señales de éxito:** Cero intentos de puja originados después de `ends_at`.
- **Migración/rollback:** Reversión de UI y dominio.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Dominio | Estado pending sin adjudicación | Pruebas de `featured-auctions` | 2026-09-13 |
| Edición | Sin CTA tras vencimiento | Prueba de `EditionDetailInteractive` | 2026-09-13 |
| Ficha | Sin formulario tras vencimiento | Prueba de `ProductDetailInteractive` | 2026-09-13 |
| Build y specs | Sin errores | 48/48 pruebas; `npm run build`; `npm run specs:check` (35 fichas) | 2026-09-13 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Introducir un estado transitorio explícito separado de `active` y de los resultados finales.
- **Riesgos y límites:** La duración del estado depende del siguiente ciclo de mantenimiento.
- **Preguntas abiertas:** Ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** Dominio de subastas y componentes de edición/ficha.
- **Migraciones/configuración:** Ninguna.
- **Commit o despliegue:** Commit `a926746`; PR [#78](https://github.com/jorgeluquerubia/lapela/pull/78).
- **Notas de implementación:** El dominio deriva `pending` al vencer `ends_at`; la ficha actualiza un reloj local y sustituye las acciones por un aviso con `role=status`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-13 | `IN_PROGRESS` | Creación e inicio de implementación | Codex |
| 2026-09-13 | `IMPLEMENTED` | Estado transitorio y bloqueo de puja validados localmente | Codex |
