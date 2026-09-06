---
id: LP-DOC-001
type: DOC
status: IMPLEMENTED
priority: P1
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
related_specs: []
dependencies: []
cross_cutting_concerns: [OPS]
---

# LP-DOC-001 · Registro de specs para agentes de IA

## 1. Solicitud original

> Necesito specs para cualquier modelo de IA que trabaje sobre este proyecto. Cada vez que pida una funcionalidad debe distinguir entre feature, fix, infraestructura, etc. Cada cosa debe ir en un registro con ID, fecha de solicitud, enunciado, criterios de aceptación y toda la información necesaria, de forma que otra IA encuentre el archivo rápidamente.

## 2. Contexto y problema

El repositorio tenía documentación funcional, pero no un contrato de intake ni un registro trazable de solicitudes. Eso permite que distintos agentes mezclen problema de producto con implementación, pierdan decisiones o repitan trabajo.

## 3. Resultado esperado

Una IA nueva puede empezar por un archivo raíz, encontrar el índice, abrir la ficha de una solicitud y saber qué debe cambiar, qué no debe cambiar y cómo verificar el resultado.

## 4. Alcance

### Incluido

- Punto de entrada `AGENTS.md` con reglas para agentes.
- Índice raíz `SPEC_REGISTRY.md` con clasificación, estados, flujo y enlaces.
- Carpeta `specs/` con plantilla y fichas individuales.
- Registro retroactivo de las peticiones relevantes de esta reconstrucción.
- Enlace visible desde `README.md`.

### Excluido

- Sustituir la documentación funcional existente.
- Automatizar todavía la creación de IDs o validación en CI.

## 5. Requisitos y reglas de negocio

- `REQ-01`: Cada solicitud debe tener un ID único y un tipo principal.
- `REQ-02`: La ficha debe conservar fecha, enunciado, alcance, criterios y evidencia.
- `RULE-01`: Ninguna IA debe implementar un cambio no trivial sin localizar o crear su ficha.
- `RULE-02`: El índice y la ficha deben tener el mismo estado.

## 6. Criterios de aceptación

- [x] `AC-01` Existe un punto de entrada raíz que ordena leer el registro antes de trabajar.
- [x] `AC-02` El registro define tipos `FEATURE`, `FIX`, `INFRA`, `SECURITY`, `TECH-DEBT`, `EXPERIMENT`, `OPS` y `DOC`.
- [x] `AC-03` La plantilla exige fecha, solicitud original, alcance, criterios, validación, riesgos y trazabilidad.
- [x] `AC-04` Las solicitudes relevantes ya realizadas tienen IDs y fichas enlazadas.
- [ ] `AC-05` Añadir una validación automática en CI que detecte IDs duplicados y enlaces rotos.

## 7. Experiencia y estados

- El agente empieza en `AGENTS.md` y llega a `SPEC_REGISTRY.md` en un clic.
- El registro muestra estado y prioridad sin abrir cada ficha.
- Las fichas distinguen `DRAFT`, `READY`, `IN_PROGRESS`, `BLOCKED`, `IMPLEMENTED`, `VERIFIED` y `CANCELLED`.

## 8. Datos, API, seguridad y operación

- Es documentación versionada; no contiene secretos ni datos personales.
- Los nombres de archivo son deterministas: `<ID>-<slug>.md`.
- Las fichas enlazan módulos, migraciones, commits y validaciones sin copiar credenciales.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Descubribilidad | Los archivos se encuentran desde la raíz | `AGENTS.md`, `README.md` y `SPEC_REGISTRY.md` enlazados | 2026-09-06 |
| Completitud | Hay ficha por cada solicitud registrada | Cinco filas y cinco archivos | 2026-09-06 |
| Consistencia | IDs, enlaces y estados coinciden | Revisión de enlaces y frontmatter | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** El registro raíz es la fuente de verdad; `specs/` contiene el detalle.
- **Riesgo:** Sin un chequeo automático, una IA puede olvidar actualizar el índice.
- **Pregunta abierta:** Decidir si se añade un script de validación en CI en la próxima iteración.

## 11. Implementación y trazabilidad

- `AGENTS.md`, `SPEC_REGISTRY.md`, `specs/README.md`, `specs/SPEC_TEMPLATE.md` y fichas `LP-*.md`.
- `README.md` enlaza el punto de entrada en la misma entrega.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `IMPLEMENTED` | Contrato de trabajo, índice, plantilla y backfill creados | Codex |
