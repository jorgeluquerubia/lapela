---
id: LP-INFRA-004
type: INFRA
status: VERIFIED
priority: P1
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/15
related_specs: [LP-INFRA-003]
dependencies: [Git worktree]
cross_cutting_concerns: [OPS, DOC]
---

# LP-INFRA-004 · Worktrees dentro del workspace autorizado

## 1. Solicitud original

> Modificar el comportamiento para que la próxima vez el agente cree su worktree sin salir del workspace predeterminado y sin pedir permisos continuamente.

## 2. Contexto y problema

El aislamiento introducido en `LP-INFRA-003` usó `/Users/jorgeluque/lapela-next-worktrees/<spec>`, una carpeta hermana de la raíz autorizada. Gemini siguió ese ejemplo para `LP-FEAT-005`, pero su entorno consideró cada acceso fuera del workspace y solicitó permisos reiteradamente.

## 3. Resultado esperado

Los agentes mantienen el aislamiento por rama y directorio, pero crean los nuevos worktrees bajo `/Users/jorgeluque/lapela-next/.worktrees/<spec-id>`, dentro del workspace autorizado y excluidos del repositorio principal.

## 4. Alcance

### Incluido

- Cambiar la ubicación canónica a `.worktrees/<spec-id>` dentro de la raíz.
- Ignorar `.worktrees/` en Git.
- Incluir comandos concretos y comprobaciones en las instrucciones de agentes.
- Validar automáticamente que `AGENTS.md` conserva la ubicación canónica y no recomienda la carpeta externa anterior.
- Crear esta mejora desde la nueva ubicación como prueba real.

### Excluido

- Mover `lp-feat-005` mientras su sesión pueda seguir activa.
- Borrar los worktrees externos existentes.
- Cambiar el aislamiento por rama, la política de PR o la protección de `main`.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: todo nuevo worktree debe crearse en `<raíz>/.worktrees/<spec-id-en-minúsculas>`.
- `RF-02`: las instrucciones deben proporcionar el comando de creación desde `origin/main`.
- `RF-03`: el validador debe detectar si desaparece la ubicación canónica o reaparece como recomendación la carpeta externa.

### Requisitos no funcionales

- `RNF-01`: el worktree debe permanecer dentro del workspace autorizado del agente.
- `RNF-02`: `.worktrees/` no debe aparecer como contenido versionable ni interferir con búsquedas normales de Git.

### Reglas de negocio

- `RN-01`: cada spec mantiene rama y worktree exclusivos aunque el directorio esté bajo la raíz principal.
- `RN-02`: no se mueve un worktree que otro agente pueda estar utilizando.
- `RN-03`: los worktrees antiguos se retiran únicamente después de confirmar que sus tareas terminaron.

## 6. Criterios de aceptación

- [x] `AC-01` `.gitignore` contiene `/.worktrees/`.
- [x] `AC-02` `AGENTS.md` establece `.worktrees/<spec-id>` como única ubicación por defecto.
- [x] `AC-03` Las instrucciones explican que la ubicación evita solicitudes por salir del workspace.
- [x] `AC-04` El validador comprueba la ubicación canónica y rechaza la recomendación anterior.
- [x] `AC-05` Este cambio se realiza en `/Users/jorgeluque/lapela-next/.worktrees/lp-infra-004`.
- [x] `AC-06` `PROJECT_CONTEXT.md` refleja la nueva ubicación y la excepción temporal de worktrees anteriores.
- [x] `AC-07` Specs, rama y workflow superan la validación automática.

## 7. Experiencia y estados

- El agente crea su directorio aislado sin abandonar la raíz autorizada.
- La carpeta permanece oculta para Git y no se añade accidentalmente a un commit.
- La tarea activa conserva el mismo flujo de issue, rama y pull request.

## 8. Datos, API, seguridad y operación

- No afecta a datos, autenticación, API ni producción.
- `.worktrees/` contiene copias de trabajo completas y debe permanecer ignorada.
- Los secretos locales continúan excluidos por las reglas existentes de `.env`.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Worktree real | La ruta está dentro de la raíz y usa la rama correcta | `git worktree list` | 2026-09-06 |
| Exclusión | `.worktrees/` no aparece en `git status` | `git check-ignore` confirma la exclusión local; `.gitignore` la hace permanente | 2026-09-06 |
| Instrucciones | La ubicación antigua no aparece como recomendación | 11 fichas y 22 documentos válidos | 2026-09-06 |
| Fallo controlado | La ausencia de la ubicación canónica se rechaza | El validador devuelve el error específico esperado | 2026-09-06 |
| GitHub | Rama, PR e issue quedan enlazadas y validadas | PR `#16`; workflow `validate` correcto | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** usar una carpeta oculta dentro de la raíz en vez de ampliar permisos particulares de cada agente.
- **Riesgo:** herramientas que recorran archivos ignorados podrían entrar en `.worktrees`; Git y los agentes deben limitar búsquedas a archivos versionados o excluirla expresamente.
- **Preguntas abiertas:** ninguna.

## 11. Implementación y trazabilidad

- **Rama:** `codex/lp-infra-004-worktree-location`.
- **Worktree:** `/Users/jorgeluque/lapela-next/.worktrees/lp-infra-004`.
- **Issue:** `https://github.com/jorgeluquerubia/lapela/issues/15`.
- **Pull request:** `https://github.com/jorgeluquerubia/lapela/pull/16`.
- **Archivos:** `.gitignore`, `AGENTS.md`, `PROJECT_CONTEXT.md` y `tools/validate-specs.mjs`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `IN_PROGRESS` | Corrección registrada e iniciada en la nueva ubicación | Codex |
| 2026-09-06 | `IMPLEMENTED` | Ubicación, exclusión, instrucciones y control automático incorporados | Codex |
| 2026-09-06 | `VERIFIED` | Rama y ubicación canónicas aceptadas en GitHub Actions | Codex |
