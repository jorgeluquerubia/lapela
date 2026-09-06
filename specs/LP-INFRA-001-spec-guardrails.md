---
id: LP-INFRA-001
type: INFRA
status: VERIFIED
priority: P1
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
related_specs: [LP-DOC-001, LP-DOC-002]
dependencies: [GitHub Actions]
cross_cutting_concerns: [DOC, OPS]
---

# LP-INFRA-001 · Controles automáticos para specs y acceso de agentes

## 1. Solicitud original

> ¿Una IA que entra al proyecto sin contexto encontrará por sí sola la información, sabrá incluir un RF como spec y actualizar `PROJECT_CONTEXT.md` cuando sea necesario? ¿Cómo hacemos eso?

## 2. Contexto y problema

`AGENTS.md` ya conduce al contexto y al registro, pero “RF” no estaba definido y el cumplimiento dependía por completo de cada agente. Tampoco existía el control automático pendiente en `LP-DOC-001/AC-05`.

## 3. Resultado esperado

Los asistentes más habituales encuentran una entrada corta hacia las fuentes canónicas, distinguen el tipo de trabajo de RF/RNF/RN y reciben un error automático si rompen la estructura documental o modifican la implementación sin actualizar una spec.

## 4. Alcance

### Incluido

- Definición común de tipo de ficha, RF, RNF y regla de negocio.
- Plantilla actualizada y accesos para herramientas de IA habituales.
- Validador local de IDs, metadatos, criterios, registro y enlaces.
- Control de cambios que exige spec e índice al tocar implementación.
- Ejecución automática en GitHub Actions.

### Excluido

- Generar automáticamente el contenido de una ficha.
- Decidir mediante heurísticas si un cambio concreto es transversal.
- Impedir cambios locales antes de un commit.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: una IA debe encontrar desde su archivo de entrada las fuentes canónicas del proyecto.
- `RF-02`: el equipo debe poder validar las specs con un único comando.
- `RF-03`: CI debe rechazar una modificación de implementación que no actualice una ficha y el registro.

### Requisitos no funcionales

- `RNF-01`: el validador no debe requerir dependencias de ejecución adicionales.
- `RNF-02`: los errores deben identificar el archivo y el incumplimiento corregible.

### Reglas de negocio

- `RN-01`: RF, RNF y RN son clases de requisito dentro de una ficha, no tipos principales de ficha.
- `RN-02`: `PROJECT_CONTEXT.md` se actualiza cuando cambia información transversal; el agente debe justificar esa decisión en la spec.

## 6. Criterios de aceptación

- [x] `AC-01` La documentación define y ejemplifica la diferencia entre tipo de ficha, RF, RNF y RN.
- [x] `AC-02` La plantilla nueva contiene secciones separadas para RF, RNF y reglas de negocio.
- [x] `AC-03` Existen accesos concisos para AGENTS, Claude, Gemini, Cursor y GitHub Copilot sin duplicar la fuente de verdad.
- [x] `AC-04` `npm run specs:check` detecta IDs duplicados, metadatos inválidos, divergencias con el registro, ausencia de criterios y enlaces locales rotos.
- [x] `AC-05` El modo de control de cambios falla si se modifica implementación sin actualizar una ficha y el registro.
- [x] `AC-06` GitHub Actions ejecuta la validación estructural y el control de cambios.
- [x] `AC-07` `PROJECT_CONTEXT.md` documenta el mecanismo vigente.

## 7. Experiencia y estados

- En local, el comando termina con un resumen corto o con errores accionables.
- En una pull request o push, GitHub muestra un control independiente de las pruebas E2E.

## 8. Datos, API, seguridad y operación

- No procesa credenciales ni accede a servicios externos.
- Solo lee documentos y el listado de cambios de Git.
- No altera el comportamiento del marketplace.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Registro actual | Todas las fichas, estados, enlaces e IDs son consistentes | `npm run specs:check`: 7 fichas y 18 documentos válidos | 2026-09-06 |
| Fallos controlados | Se rechazan ID duplicado, enlace roto y cambio de `src/` sin trazabilidad | Ejecuciones aisladas del validador devuelven los errores esperados | 2026-09-06 |
| Integración | Workflow válido invoca ambos modos del validador | `.github/workflows/specs.yml` | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** los archivos específicos de herramientas solo remiten a `AGENTS.md`; no copian sus reglas.
- **Decisión:** la necesidad de actualizar el contexto transversal sigue siendo una decisión semántica documentada por el agente.
- **Riesgo:** un asistente que ignore tanto su archivo de entrada como el README todavía puede incumplir el proceso; CI detecta las omisiones estructurales al integrar el cambio.
- **Preguntas abiertas:** ninguna.

## 11. Implementación y trazabilidad

- `AGENTS.md`, `SPEC_REGISTRY.md`, `PROJECT_CONTEXT.md`, `specs/SPEC_TEMPLATE.md`, `specs/REQUIREMENTS_GUIDE.md`.
- `tools/validate-specs.mjs`, `package.json`, `.github/workflows/specs.yml`.
- Accesos: `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/la-pela-context.mdc` y `.github/copilot-instructions.md`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `VERIFIED` | Guía, accesos y controles automáticos incorporados y comprobados | Codex |
