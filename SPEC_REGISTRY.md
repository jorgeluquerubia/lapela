# Registro de especificaciones de La Pela

Este es el registro canónico de trabajo de producto para La Pela. Cualquier IA debe leer primero el estado vigente en [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) y después este registro antes de proponer, implementar o revisar un cambio. Las fichas completas viven en [`specs/`](specs/); la plantilla está en [`specs/SPEC_TEMPLATE.md`](specs/SPEC_TEMPLATE.md).

## Cómo se usa

Cada solicitud que afecte al producto se registra con una ficha propia antes de implementarse. El registro separa la intención de producto de la solución técnica y permite que otra IA retome el trabajo sin depender del historial de conversación.

Cada ficha tiene además una GitHub Issue. La spec es la fuente de verdad del producto; la issue es su vista operativa para responsables, estado y conversación. El campo `github_issue` conserva el enlace. Si GitHub no está disponible puede permanecer `pending` mientras se trabaja, pero nunca cuando el estado sea `VERIFIED` o `CANCELLED`.

Cuando una solicitud contiene varios resultados independientes, se divide en varias fichas y se relacionan mediante `related_specs`. Una corrección que nace al implementar una feature conserva su propio ID `FIX` si tiene un problema y criterios de aceptación distintos.

## Clasificación

| Tipo | Prefijo de ID | Se usa para | Ejemplo |
|---|---|---|---|
| `FEATURE` | `FEAT` | Capacidad nueva visible para una persona usuaria o para la operación del producto | Recuperar una contraseña |
| `FIX` | `FIX` | Corregir un comportamiento existente que no cumple lo esperado | No llega el correo de verificación |
| `INFRA` | `INFRA` | Hosting, despliegue, base de datos, configuración de servicios o entornos | Preparar un entorno de staging |
| `SECURITY` | `SEC` | Autenticación, autorización, privacidad, fraude o protección de datos | Restringir el chat hasta el pago |
| `TECH-DEBT` | `DEBT` | Reducir complejidad o riesgo técnico sin cambiar el objetivo de producto | Sustituir una ruta legacy |
| `EXPERIMENT` | `EXP` | Hipótesis que necesita validación antes de convertirse en producto | Probar una nueva ordenación |
| `OPS` | `OPS` | Soporte, monitorización, migraciones operativas o procedimientos | Revisar entregas pendientes |
| `DOC` | `DOC` | Documentación, gobierno del trabajo o contrato para agentes | Mantener este registro |

Una petición puede tener impacto en varias áreas, pero debe elegir un `type` principal. Los impactos secundarios se anotan en `cross_cutting_concerns`.

El tipo de ficha no sustituye al tipo de requisito. Dentro de cualquier ficha se usan `RF-XX` para conductas funcionales, `RNF-XX` para atributos medibles de calidad y `RN-XX` para reglas de negocio. Por ejemplo, corregir un RF incumplido sigue siendo una ficha `FIX`. La convención completa está en [`specs/REQUIREMENTS_GUIDE.md`](specs/REQUIREMENTS_GUIDE.md).

## Estados y prioridad

Estados permitidos: `DRAFT`, `READY`, `IN_PROGRESS`, `BLOCKED`, `IMPLEMENTED`, `VERIFIED`, `CANCELLED`.

- `DRAFT`: falta concretar alcance o criterios.
- `READY`: se puede implementar sin preguntas críticas abiertas.
- `IN_PROGRESS`: hay trabajo activo.
- `BLOCKED`: una dependencia externa impide avanzar y está documentada.
- `IMPLEMENTED`: el cambio está hecho, pero falta completar la validación.
- `VERIFIED`: los criterios de aceptación se han comprobado y la evidencia está anotada.
- `CANCELLED`: se decidió no realizarlo; conserva el motivo.

Prioridades: `P0` bloquea una operación esencial o implica un riesgo grave; `P1` afecta a un flujo importante; `P2` mejora una experiencia o reduce riesgo; `P3` es una mejora conveniente.

## Registro

| ID | Tipo | Título | Estado | Prioridad | Solicitado | Especificación |
|---|---|---|---|---|---|---|
| `LP-FEAT-001` | `FEATURE` | Reconstrucción del marketplace sin regateos | `VERIFIED` | `P1` | 2026-09-06 | [Abrir ficha](specs/LP-FEAT-001-marketplace-rebuild.md) |
| `LP-FEAT-002` | `FEATURE` | Pagos simulados durante la beta | `VERIFIED` | `P1` | 2026-09-06 | [Abrir ficha](specs/LP-FEAT-002-simulated-payments.md) |
| `LP-FIX-001` | `FIX` | Recuperación del correo de verificación | `VERIFIED` | `P1` | 2026-09-06 | [Abrir ficha](specs/LP-FIX-001-email-verification.md) |
| `LP-FEAT-003` | `FEATURE` | Recuperación de contraseña | `VERIFIED` | `P1` | 2026-09-06 | [Abrir ficha](specs/LP-FEAT-003-password-recovery.md) |
| `LP-DOC-001` | `DOC` | Registro de specs para agentes de IA | `VERIFIED` | `P1` | 2026-09-06 | [Abrir ficha](specs/LP-DOC-001-ai-spec-governance.md) |
| `LP-DOC-002` | `DOC` | Contexto canónico de producto e infraestructura | `VERIFIED` | `P1` | 2026-09-06 | [Abrir ficha](specs/LP-DOC-002-project-context.md) |
| `LP-INFRA-001` | `INFRA` | Controles automáticos para specs y acceso de agentes | `VERIFIED` | `P1` | 2026-09-06 | [Abrir ficha](specs/LP-INFRA-001-spec-guardrails.md) |
| `LP-INFRA-002` | `INFRA` | Trazabilidad de specs mediante GitHub Issues | `VERIFIED` | `P1` | 2026-09-06 | [Abrir ficha](specs/LP-INFRA-002-github-issues.md) |
| `LP-FEAT-004` | `FEATURE` | Optimización SEO y rutas semánticas | `VERIFIED` | `P2` | 2026-09-06 | [Abrir ficha](specs/LP-FEAT-004-seo-semantic-urls.md) |
| `LP-INFRA-003` | `INFRA` | Trabajo aislado por rama para agentes concurrentes | `VERIFIED` | `P1` | 2026-09-06 | [Abrir ficha](specs/LP-INFRA-003-agent-branches.md) |
| `LP-INFRA-004` | `INFRA` | Worktrees dentro del workspace autorizado | `VERIFIED` | `P1` | 2026-09-06 | [Abrir ficha](specs/LP-INFRA-004-worktree-location.md) |
| `LP-FIX-002` | `FIX` | Playwright funcional en pull requests | `VERIFIED` | `P1` | 2026-09-06 | [Abrir ficha](specs/LP-FIX-002-playwright-ci.md) |
| `LP-FEAT-005` | `FEATURE` | Preguntas y respuestas públicas en producto | `VERIFIED` | `P2` | 2026-09-06 | [Abrir ficha](specs/LP-FEAT-005-preguntas-respuestas-producto.md) |
| `LP-FEAT-006` | `FEATURE` | Confirmación de compra, reserva de 48h y política de compras | `VERIFIED` | `P1` | 2026-09-09 | [Abrir ficha](specs/LP-FEAT-006-confirmacion-reserva-politica-compras.md) |
| `LP-FEAT-007` | `FEATURE` | Chat en reserva y confirmación de cobro en persona por el vendedor | `VERIFIED` | `P1` | 2026-09-09 | [Abrir ficha](specs/LP-FEAT-007-chat-reserva-cobro-en-persona.md) |
| `LP-FEAT-008` | `FEATURE` | Spinner de marca no bloqueante y mejoras en preguntas y respuestas | `VERIFIED` | `P2` | 2026-09-09 | [Abrir ficha](specs/LP-FEAT-008-spinner-marca-mejoras-qa.md) |
| `LP-FEAT-009` | `FEATURE` | Badges de novedades en artículos y ajustes informativos de reserva | `VERIFIED` | `P1` | 2026-09-09 | [Abrir ficha](specs/LP-FEAT-009-notificaciones-articulos.md) |
| `LP-FEAT-010` | `FEATURE` | Notificaciones contextuales y cierre de subastas | `VERIFIED` | `P1` | 2026-09-10 | [Abrir ficha](specs/LP-FEAT-010-notificaciones-contextuales.md) |
| `LP-FIX-003` | `FIX` | Entrega fiable de novedades en la campana | `VERIFIED` | `P1` | 2026-09-10 | [Abrir ficha](specs/LP-FIX-003-panel-notificaciones.md) |


## Flujo para una solicitud nueva

1. Capturar la petición con su fecha y fuente, sin reinterpretarla como una tarea técnica.
2. Elegir el tipo principal y asignar el siguiente ID disponible.
3. Crear o localizar la GitHub Issue `[ID] Título`, aplicar sus etiquetas y guardar la URL en la ficha.
4. Escribir problema, resultado esperado, alcance, reglas de negocio, dependencias y criterios de aceptación.
5. Resolver preguntas que bloqueen la decisión y marcar la ficha como `READY`.
6. Implementar manteniendo ficha, índice e issue actualizados.
7. Validar los criterios con pruebas, revisión visual, comprobaciones de API, despliegue u otra evidencia adecuada.
8. Marcar `VERIFIED` solo cuando no queden criterios sin comprobar; anotar riesgos, cerrar la issue y registrar deuda o trabajo futuro.

Antes de cerrar el trabajo se ejecuta `npm run specs:check`. En CI, la misma comprobación valida la estructura, los IDs, la sincronización del registro, los enlaces locales y que un cambio de implementación incluya una actualización de su ficha y del índice.

## Definition of Ready

Una ficha está lista cuando una IA que no conoce la conversación puede explicar qué problema se resuelve, para quién, qué queda dentro y fuera, qué dependencias existen y cómo se decidirá si está terminado.

## Definition of Done

Una ficha está terminada cuando el resultado desplegado o documentado cumple todos sus criterios, las comprobaciones tienen fecha y evidencia, los cambios relevantes están enlazados y el estado de este registro coincide con la ficha.
