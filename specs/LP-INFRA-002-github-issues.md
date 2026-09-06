---
id: LP-INFRA-002
type: INFRA
status: VERIFIED
priority: P1
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/1
related_specs: [LP-DOC-001, LP-INFRA-001]
dependencies: [GitHub Issues]
cross_cutting_concerns: [DOC, OPS]
---

# LP-INFRA-002 · Trazabilidad de specs mediante GitHub Issues

## 1. Solicitud original

> Añadir una instrucción para que los agentes incluyan cada tarea en GitHub Issues igual que se incluye en las specs, habilitarlo y añadir unas cuantas tareas de prueba ya completadas.

## 2. Contexto y problema

Las specs conservan bien el contexto dentro del repositorio, pero no ofrecen por sí solas una vista operativa cómoda de trabajo abierto, responsables, prioridades y progreso. GitHub Issues ya está habilitado en el repositorio y no contiene tareas.

## 3. Resultado esperado

Cada solicitud registrada como spec tiene una issue enlazada. Los agentes usan la spec como fuente de verdad y la issue como representación operativa, sin mantener dos copias completas del mismo contenido. Las specs históricas aparecen como ejemplos cerrados.

## 4. Alcance

### Incluido

- Contrato obligatorio de creación, actualización y cierre de issues.
- Campo `github_issue` en todas las fichas y en la plantilla.
- Etiquetas de tipo, prioridad y estado gestionadas en GitHub.
- Plantilla de issue para altas manuales.
- Backfill de las specs existentes mediante issues cerradas.
- Validación de que una ficha verificada tiene una URL de issue válida.

### Excluido

- Jira, Linear u otra plataforma externa.
- Sincronización bidireccional de todo el texto de las specs.
- GitHub Projects y planificación por sprints.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: cada spec debe indicar su issue mediante `github_issue`.
- `RF-02`: una IA debe crear o localizar la issue después de asignar el ID y antes de implementar.
- `RF-03`: una ficha `VERIFIED` o `CANCELLED` debe tener su issue cerrada.
- `RF-04`: las specs existentes deben quedar representadas mediante issues históricas cerradas.

### Requisitos no funcionales

- `RNF-01`: la issue debe permitir identificar tipo, prioridad, estado y spec sin duplicar toda la documentación.
- `RNF-02`: la validación local no debe necesitar acceso de red a GitHub.

### Reglas de negocio

- `RN-01`: la spec es la fuente de verdad para alcance, requisitos, criterios, decisiones y evidencia.
- `RN-02`: la issue es la fuente operativa para asignación, conversación y visibilidad del estado.
- `RN-03`: si GitHub no está disponible, se admite temporalmente `github_issue: pending`, pero la ficha no puede pasar a `VERIFIED`.

## 6. Criterios de aceptación

- [x] `AC-01` `AGENTS.md` ordena crear o localizar una issue para toda solicitud con spec.
- [x] `AC-02` La plantilla y todas las fichas incluyen `github_issue`.
- [x] `AC-03` GitHub dispone de etiquetas coherentes de tipo, prioridad y estado.
- [x] `AC-04` Cada spec histórica tiene una issue enlazada y cerrada.
- [x] `AC-05` Existe una plantilla de issue que exige el ID y el enlace a la spec.
- [x] `AC-06` El validador rechaza una ficha verificada sin URL válida de GitHub Issue.
- [x] `AC-07` Esta solicitud tiene su propia issue y queda cerrada al verificarse.
- [x] `AC-08` `PROJECT_CONTEXT.md` documenta el sistema operativo de seguimiento.

## 7. Experiencia y estados

- El título de la issue usa `[ID] Título de la spec`.
- Una issue abierta representa una ficha no terminada; `VERIFIED` y `CANCELLED` se cierran.
- Las etiquetas facilitan buscar por tipo, prioridad y estado sin alterar el registro canónico.

## 8. Datos, API, seguridad y operación

- Solo se publica información ya versionable; no se copian secretos ni datos personales.
- La comprobación local valida el formato de la URL, no consulta GitHub.
- La URL esperada pertenece a `github.com/jorgeluquerubia/lapela/issues/`.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Issues habilitadas | El repositorio acepta y lista issues | Consulta de configuración de GitHub | 2026-09-06 |
| Backfill | Todas las fichas tienen URL y estado coherente | 9 issues enlazadas; las 7 specs históricas están cerradas | 2026-09-06 |
| Fallo controlado | Una spec verificada con `pending` es rechazada | El validador devuelve el error específico esperado | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** usar GitHub Issues porque el código y las specs ya viven en GitHub.
- **Decisión:** crear una issue por spec, no una issue por cada RF.
- **Riesgo:** GitHub y el registro pueden divergir en su estado; las instrucciones exigen actualizarlos juntos.
- **Preguntas abiertas:** ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `AGENTS.md`, `SPEC_REGISTRY.md`, `PROJECT_CONTEXT.md`, `specs/`, `.github/ISSUE_TEMPLATE/` y `tools/validate-specs.mjs`.
- **Configuración:** GitHub Issues habilitado y catálogo de etiquetas del repositorio.
- **Commit o despliegue:** commit de esta entrega en `main`.
- **Notas de implementación:** 19 etiquetas creadas; issues históricas `#2` a `#8`, configuración `#1` y SEO en curso `#9`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `IN_PROGRESS` | Solicitud registrada; GitHub Issues confirmado como habilitado | Codex |
| 2026-09-06 | `VERIFIED` | Contrato, plantilla, etiquetas, backfill y validación completados | Codex |
