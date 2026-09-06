# Instrucciones para agentes de IA de La Pela

Este archivo es el punto de entrada para cualquier IA que trabaje en el repositorio.

## Antes de cambiar nada

1. Lee [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) para conocer el producto, las funcionalidades vigentes y la infraestructura real.
2. Lee [`SPEC_REGISTRY.md`](SPEC_REGISTRY.md), que es el registro canónico de solicitudes y decisiones de producto.
3. Abre la especificación relacionada dentro de [`specs/`](specs/). Si no existe, crea una antes de implementar.
4. Crea o localiza su GitHub Issue y anota la URL en `github_issue`. Si GitHub no está disponible, usa temporalmente `pending` y no marques la ficha como `VERIFIED`.
5. Clasifica la petición como `FEATURE`, `FIX`, `INFRA`, `SECURITY`, `TECH-DEBT`, `EXPERIMENT`, `OPS` o `DOC`.
6. Comprueba el estado, el alcance, las dependencias y los criterios de aceptación. No mezcles objetivos distintos en una sola especificación.

## Aislamiento obligatorio por rama y worktree

No implementes una solicitud directamente en `main` o `master`. No cambies de rama ni uses `git stash` en una copia de trabajo que tenga cambios ajenos. Cada spec activa necesita una rama y un worktree exclusivos antes de modificar archivos.

1. Comprueba `git status`, `git worktree list` y las ramas existentes sin alterar cambios.
2. Actualiza referencias con `git fetch origin`.
3. Desde el repositorio principal, crea un worktree nuevo basado en `origin/main`: `git worktree add <directorio-aislado> -b <rama> origin/main`.
4. Usa la rama `<agente>/<id-de-spec-en-minúsculas>-<slug>`, por ejemplo `gemini/lp-feat-004-seo` o `codex/lp-fix-002-login`.
5. Trabaja, valida, confirma y publica únicamente los archivos de esa spec. No incluyas cambios encontrados en otro worktree.
6. Abre una pull request hacia `main`. La descripción debe enlazar spec e issue, incluir la evidencia y declarar si `PROJECT_CONTEXT.md` necesitó actualización.

Si la rama o el worktree ya existen, reutilízalos tras comprobar que corresponden a la misma spec. Si otro agente los está usando, no escribas en ellos: coordina el relevo o crea un worktree distinto sobre la misma rama solo después de que deje de estar activa.

### Estado de la issue durante el ciclo

- **Inicio:** deja la issue abierta, aplica `status:in-progress` y anota el nombre de la rama.
- **Pull request preparada:** enlaza la PR, actualiza la spec con evidencia y usa `status:implemented` mientras falte alguna comprobación.
- **Lista para integrar:** marca `VERIFIED` y `status:verified` únicamente con todos los `AC-XX` comprobados y la PR preparada para `main`.
- **Integración:** usa `Closes #<issue>` en la PR para que GitHub cierre la issue al fusionarla. Si se cancela, documenta el motivo en ficha e issue y ciérrala como no planificada.
- **Bloqueo:** mantén la issue abierta con `status:blocked` y documenta la dependencia concreta.

Antes de terminar, verifica que ficha, registro, issue, rama y PR muestran el mismo estado. Una implementación sin commit, una rama sin publicar o una issue desactualizada no es una entrega completa.

## Cómo interpretar una petición

La clasificación de la ficha y la clase de requisito son dos conceptos diferentes:

- La **ficha de trabajo** explica por qué se realiza el cambio y usa un ID `LP-<PREFIJO>-<NÚMERO>`. Los prefijos son `FEAT`, `FIX`, `INFRA`, `SEC`, `DEBT`, `EXP`, `OPS` y `DOC`; el frontmatter conserva el nombre completo del tipo.
- Un **RF** es un requisito funcional: una conducta observable que el producto debe permitir. No implica por sí solo que la ficha sea una `FEATURE`; un `FIX` también puede corregir el incumplimiento de un RF.
- Un **RNF** es un requisito no funcional: una condición medible de seguridad, rendimiento, accesibilidad, compatibilidad, fiabilidad u operación.
- Una **RN** es una regla de negocio: una restricción o decisión del dominio que se cumple con independencia de la pantalla o solución técnica.

Si el usuario pide “un RF”, localiza primero la ficha que contiene ese objetivo o crea una, clasifícala por la naturaleza del trabajo y registra dentro el requisito como `RF-01`, `RF-02`, etc. Las referencias externas usan `<ID-DE-SPEC>/RF-01`. Consulta la guía completa en [`specs/REQUIREMENTS_GUIDE.md`](specs/REQUIREMENTS_GUIDE.md).

## Regla de trabajo

Cada petición del usuario que cambie el producto, el comportamiento, los datos, la seguridad, la operación o la documentación debe tener una especificación con ID estable. La ficha se crea o actualiza antes de escribir código. Durante la implementación se mantienen al día el estado, las decisiones, los enlaces a cambios y la validación.

La misma petición debe tener una GitHub Issue con el título `[ID] Título`, las etiquetas `type:*`, `priority:*` y `status:*`, y un enlace a la spec. La issue sirve para seguimiento, asignación y conversación; la spec conserva el alcance, los requisitos, criterios, decisiones y evidencia. Al cambiar el estado de la ficha se actualiza su etiqueta. Las fichas `VERIFIED` y `CANCELLED` se cierran en GitHub con el motivo correspondiente.

Una respuesta de implementación solo está completa cuando:

- la especificación tiene criterios de aceptación verificables;
- el código, la configuración o la documentación reflejan esos criterios;
- las comprobaciones realizadas están anotadas en la ficha;
- las preguntas abiertas y los riesgos restantes están explícitos;
- `SPEC_REGISTRY.md` enlaza la ficha y muestra su estado actual.
- la GitHub Issue está enlazada, etiquetada y en un estado coherente con la ficha.

## Convenciones obligatorias

- Usa IDs con el formato `LP-<PREFIJO>-<NÚMERO>`, por ejemplo `LP-FEAT-004` o `LP-FIX-002`.
- No reutilices un ID ni borres una especificación histórica. Si una petición cambia de alcance, crea una nueva ficha o deja constancia de la decisión.
- Escribe las fichas en español y conserva los nombres de código, rutas y estados técnicos tal como aparecen en el proyecto.
- Distingue siempre el problema de producto, la solución aceptada y la implementación técnica. La implementación no sustituye a los criterios de aceptación.
- No marques una ficha como `VERIFIED` sin indicar cómo se comprobó.
- No incluyas secretos, tokens, contraseñas ni datos personales en las fichas, los logs o los commits.
- No dupliques la spec completa en GitHub: incluye el enlace, un resumen operativo y las novedades que faciliten coordinar el trabajo.
- Si una spec cambia una funcionalidad, servicio, variable, ruta, estado o limitación transversal, actualiza también `PROJECT_CONTEXT.md`.
- Ejecuta `npm run specs:check` antes de dar por terminada una solicitud. Si la comprobación falla, corrige la ficha, el registro o los enlaces antes de continuar.

## Archivos de referencia rápida

- Contexto vigente de producto e infraestructura: [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
- Registro e índice: [`SPEC_REGISTRY.md`](SPEC_REGISTRY.md)
- Plantilla: [`specs/SPEC_TEMPLATE.md`](specs/SPEC_TEMPLATE.md)
- Guía de RF, RNF y reglas de negocio: [`specs/REQUIREMENTS_GUIDE.md`](specs/REQUIREMENTS_GUIDE.md)
- Fichas individuales: [`specs/`](specs/)
- Análisis funcional histórico: [`ANALISIS_FUNCIONAL.md`](ANALISIS_FUNCIONAL.md)
- Arquitectura y estado del portal: [`README.md`](README.md)
- Variables de entorno sin secretos: [`.env.example`](.env.example)
