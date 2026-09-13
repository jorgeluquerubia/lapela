---
id: LP-INFRA-005
type: INFRA
status: IMPLEMENTED
priority: P1
requested_at: 2026-09-13
requested_by: usuario
source: conversación
owner: codex
github_issue: https://github.com/jorgeluquerubia/lapela/issues/72
related_specs: [LP-FEAT-013, LP-FEAT-014, LP-FEAT-019]
dependencies: []
cross_cutting_concerns: [supabase, despliegue, base-de-datos, ci]
---

# LP-INFRA-005 · Versiones únicas de migraciones Supabase

## 1. Solicitud original

> Resolver de forma forward-only la colisión `202609110001` entre las migraciones de búsqueda y perfiles, reconciliando el historial remoto y protegiendo futuros despliegues.

## 2. Contexto y problema

- **Problema u oportunidad:** Supabase usa el prefijo numérico como versión y el repositorio contenía dos archivos ejecutables con `202609110001`.
- **Personas afectadas:** Desarrollo, operación y cualquier entorno nuevo.
- **Impacto actual:** `db push` o la creación de una base desde cero puede fallar o considerar aplicada una migración diferente.
- **Evidencia disponible:** `202609110001_product_search.sql` y `202609110001_public_profiles_reviews.sql` coexistían en `supabase/migrations`.

## 3. Resultado esperado

Cada migración ejecutable tiene una versión única. El SQL histórico de perfiles se conserva fuera de la carpeta ejecutable y una migración nueva, idempotente y forward-only reconcilia tanto producción como instalaciones limpias. La validación automática impide reintroducir colisiones.

## 4. Alcance

### Incluido

- Conservar el SQL histórico original en `supabase/migration-history`.
- Crear una migración de reconciliación única para perfiles y valoraciones.
- Actualizar la trazabilidad de LP-FEAT-013.
- Detectar versiones duplicadas en `npm run specs:check`.

### Excluido

- Revertir datos o funciones ya aplicadas.
- Alterar el comportamiento público de perfiles, valoraciones o búsqueda.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Una base limpia debe crear búsqueda en `202609110001` y perfiles/valoraciones en una versión posterior única.
- `RF-02`: Una base donde perfiles ya existen debe poder aplicar la reconciliación sin destruir datos.
- `RF-03`: La validación del repositorio debe fallar ante versiones duplicadas.

### Requisitos no funcionales

- `RNF-01`: La solución debe ser forward-only e idempotente sobre el esquema productivo actual.
- `RNF-02`: El SQL histórico debe seguir disponible para auditoría.

### Reglas de negocio

- `RN-01`: No se modifica ni elimina información de perfiles o valoraciones existente.

## 6. Criterios de aceptación

- [x] `AC-01` No existen dos archivos ejecutables con el mismo prefijo en `supabase/migrations`.
- [x] `AC-02` La reconciliación utiliza operaciones `if not exists`, `on conflict` y `create or replace` seguras para producción.
- [x] `AC-03` El SQL histórico original permanece versionado fuera de la carpeta ejecutable.
- [x] `AC-04` Un fixture temporal con versiones duplicadas hace fallar el validador o la lógica se cubre mediante prueba automatizada equivalente.
- [x] `AC-05` `npm run specs:check`, pruebas relevantes y build terminan correctamente.

## 7. Experiencia y estados

- **Estados normales:** Migraciones ordenadas y repetibles.
- **Estados de error o vacío:** Mensaje con versión y archivos en conflicto.
- **Mensajes y accesibilidad:** No aplica.
- **Responsive o canales afectados:** CI y despliegue de Supabase.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Perfiles y valoraciones existentes se preservan.
- **API/integraciones:** Supabase CLI.
- **Autorización y privacidad:** Sin exposición de datos.
- **Observabilidad y soporte:** Fallo temprano en `specs:check`.
- **Métricas o señales de éxito:** Cero versiones duplicadas.
- **Migración/rollback:** No se revierte el esquema; el rollback del control solo retira la validación.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Inventario | Versiones únicas | 14 migraciones ejecutables, 14 versiones únicas | 2026-09-13 |
| SQL | Reconciliación idempotente | Revisión de `202609130001_public_profiles_reviews.sql` | 2026-09-13 |
| Guardia | Colisiones detectadas | 2/2 pruebas de `migration-versions` | 2026-09-13 |
| Build y specs | Sin errores | 20/20 pruebas de perfiles; `npm run build`; `npm run specs:check` (35 fichas) | 2026-09-13 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Mantener búsqueda como la migración canónica `202609110001` y trasladar perfiles a `202609130001` mediante reconciliación.
- **Riesgos y límites:** El historial remoto debe conservar `202609110001`; la nueva versión vuelve a declarar de forma idempotente el esquema de perfiles.
- **Preguntas abiertas:** Ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** Migraciones, historial, validador y ficha LP-FEAT-013.
- **Migraciones/configuración:** `202609130001_public_profiles_reviews.sql`.
- **Commit o despliegue:** Commit `977d41f`; PR [#74](https://github.com/jorgeluquerubia/lapela/pull/74).
- **Notas de implementación:** La migración original queda como evidencia histórica; la versión nueva recrea de forma segura esquema, índices, funciones, permisos y datos base. El validador examina únicamente las migraciones ejecutables.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-13 | `IN_PROGRESS` | Creación e inicio de reconciliación | Codex |
| 2026-09-13 | `IMPLEMENTED` | Reconciliación forward-only y guardia automática validadas | Codex |
