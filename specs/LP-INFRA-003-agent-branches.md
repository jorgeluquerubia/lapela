---
id: LP-INFRA-003
type: INFRA
status: VERIFIED
priority: P1
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/10
related_specs: [LP-INFRA-001, LP-INFRA-002]
dependencies: [Git, GitHub]
cross_cutting_concerns: [OPS, DOC]
---

# LP-INFRA-003 · Trabajo aislado por rama para agentes concurrentes

## 1. Solicitud original

> Dar instrucciones automáticas a los agentes para actualizar GitHub Issues al terminar y empezar a trabajar en ramas, porque varios agentes pueden modificar el proyecto en paralelo.

## 2. Contexto y problema

Un agente de Gemini completó `LP-FEAT-004` en la misma copia de trabajo que otros cambios. Aunque la regla de issues ya existía cuando terminó, había empezado antes de publicarse y no actualizó la issue. Compartir rama y directorio permite mezclar archivos, sobrescribir cambios o atribuir una implementación a la tarea equivocada.

## 3. Resultado esperado

Cada solicitud se desarrolla en una rama y un worktree propios. El agente enlaza rama y pull request en la issue, mantiene sus estados sincronizados y no toca una copia de trabajo que otro agente esté usando.

## 4. Alcance

### Incluido

- Flujo obligatorio desde `origin/main` hacia rama, worktree, commit, push y pull request.
- Convención de nombres con agente e ID de spec.
- Prohibición de implementar directamente en `main` o compartir un worktree entre tareas concurrentes.
- Lista de comprobación de inicio y cierre en `AGENTS.md`.
- Plantilla de pull request con trazabilidad de spec e issue.
- Validación automática del nombre de rama en pull requests.
- Corrección de la issue de `LP-FEAT-004` al verificar su entrega.

### Excluido

- Exigir aprobación de otra persona para cada merge.
- Elegir una herramienta externa de planificación.
- Reescribir o descartar cambios que ya estén sin commit en la copia principal.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: un agente debe crear una rama y un worktree exclusivos antes de modificar una tarea.
- `RF-02`: la rama debe identificar agente y spec mediante `<agente>/<id-en-minúsculas>-<slug>`.
- `RF-03`: la issue debe reflejar los estados de inicio, pull request y finalización.
- `RF-04`: toda pull request debe enlazar la spec y cerrar o relacionar su issue.
- `RF-05`: CI debe rechazar una pull request cuya rama no siga la convención.

### Requisitos no funcionales

- `RNF-01`: el flujo debe permitir varios agentes simultáneos sin compartir archivos modificables.
- `RNF-02`: ninguna instrucción debe exigir borrar o guardar temporalmente cambios ajenos.

### Reglas de negocio

- `RN-01`: `main` representa trabajo integrado y no se usa como rama de implementación.
- `RN-02`: una rama contiene una spec principal; los fixes descubiertos con alcance propio usan otra spec y, si pueden separarse, otra rama.
- `RN-03`: el prefijo identifica al agente (`codex`, `gemini`, `claude` u otro nombre estable).
- `RN-04`: `VERIFIED` requiere evidencia, criterios marcados, issue actualizada y una pull request preparada; la issue solo se cierra al integrar en `main`.

## 6. Criterios de aceptación

- [x] `AC-01` `AGENTS.md` contiene listas obligatorias de inicio, trabajo y cierre para ramas, worktrees e issues.
- [x] `AC-02` Las instrucciones prohíben trabajar directamente en `main` y compartir un worktree entre agentes concurrentes.
- [x] `AC-03` Existe una plantilla de pull request que exige ID, spec, issue, validación y actualización de contexto.
- [x] `AC-04` GitHub Actions valida la rama `<agente>/<id>-<slug>` en cada pull request.
- [x] `AC-05` La propia mejora se desarrolla en `codex/lp-infra-003-agent-branches` dentro de un worktree aislado.
- [x] `AC-06` `PROJECT_CONTEXT.md` describe el flujo operativo vigente.
- [x] `AC-07` La feature SEO se conserva sin mezclar sus archivos con esta rama y su issue queda sincronizada tras validarla.

## 7. Experiencia y estados

- Al comenzar, la issue cambia a `status:in-progress` y recibe el nombre de la rama.
- Al abrir la pull request, se enlazan issue y spec y se anotan las comprobaciones.
- Después de integrar y verificar, la spec pasa a `VERIFIED`, la etiqueta cambia y la issue se cierra.

## 8. Datos, API, seguridad y operación

- No cambia el producto ni sus datos.
- Las ramas se crean desde `origin/main` actualizado.
- Los worktrees viven fuera del directorio compartido principal y no contienen secretos versionados.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Aislamiento | La rama actual usa otro worktree y no incluye el diff SEO | `git worktree list`, rama y diff | 2026-09-06 |
| Documentación | Specs y enlaces internos son válidos | 10 fichas y 21 documentos válidos | 2026-09-06 |
| Rama inválida | El validador rechaza un nombre fuera de convención | `feature/seo` produce el error esperado | 2026-09-06 |
| Pull request | CI ejecuta los controles y la PR contiene trazabilidad | PR `#11`: gobernanza y Vercel correctos | 2026-09-06 |
| SEO | Build y criterios de `LP-FEAT-004` comprobados antes de cerrar su issue | 16 pruebas y build correctos; issue `#9` permanece abierta como `IMPLEMENTED` | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** usar worktrees además de ramas; dos ramas en el mismo directorio no evitan interferencias simultáneas.
- **Decisión:** permitir distintos prefijos de agente con un patrón común.
- **Riesgo:** los cambios anteriores sin commit siguen juntos en la copia principal y deben separarse con cuidado al integrar SEO.
- **Preguntas abiertas:** ninguna.

## 11. Implementación y trazabilidad

- **Rama:** `codex/lp-infra-003-agent-branches`.
- **Worktree:** `/Users/jorgeluque/lapela-next-worktrees/lp-infra-003`.
- **Issue:** `https://github.com/jorgeluquerubia/lapela/issues/10`.
- **Pull request:** `https://github.com/jorgeluquerubia/lapela/pull/11`.
- **Archivos:** `AGENTS.md`, `PROJECT_CONTEXT.md`, `.github/pull_request_template.md` y workflow de gobernanza.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `IN_PROGRESS` | Flujo concurrente registrado e iniciado en worktree aislado | Codex |
| 2026-09-06 | `IMPLEMENTED` | Instrucciones, plantilla de PR y validación de rama incorporadas | Codex |
| 2026-09-06 | `VERIFIED` | Rama real aceptada en CI y trabajo SEO separado y sincronizado | Codex |
