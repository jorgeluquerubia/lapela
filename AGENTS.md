# Instrucciones para agentes de IA de La Pela

Este archivo es el punto de entrada para cualquier IA que trabaje en el repositorio.

## Antes de cambiar nada

1. Lee [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) para conocer el producto, las funcionalidades vigentes y la infraestructura real.
2. Lee [`SPEC_REGISTRY.md`](SPEC_REGISTRY.md), que es el registro canónico de solicitudes y decisiones de producto.
3. Abre la especificación relacionada dentro de [`specs/`](specs/). Si no existe, crea una antes de implementar.
4. Clasifica la petición como `FEATURE`, `FIX`, `INFRA`, `SECURITY`, `TECH-DEBT`, `EXPERIMENT`, `OPS` o `DOC`.
5. Comprueba el estado, el alcance, las dependencias y los criterios de aceptación. No mezcles objetivos distintos en una sola especificación.

## Cómo interpretar una petición

La clasificación de la ficha y la clase de requisito son dos conceptos diferentes:

- La **ficha de trabajo** explica por qué se realiza el cambio y usa un ID `LP-<PREFIJO>-<NÚMERO>`. Los prefijos son `FEAT`, `FIX`, `INFRA`, `SEC`, `DEBT`, `EXP`, `OPS` y `DOC`; el frontmatter conserva el nombre completo del tipo.
- Un **RF** es un requisito funcional: una conducta observable que el producto debe permitir. No implica por sí solo que la ficha sea una `FEATURE`; un `FIX` también puede corregir el incumplimiento de un RF.
- Un **RNF** es un requisito no funcional: una condición medible de seguridad, rendimiento, accesibilidad, compatibilidad, fiabilidad u operación.
- Una **RN** es una regla de negocio: una restricción o decisión del dominio que se cumple con independencia de la pantalla o solución técnica.

Si el usuario pide “un RF”, localiza primero la ficha que contiene ese objetivo o crea una, clasifícala por la naturaleza del trabajo y registra dentro el requisito como `RF-01`, `RF-02`, etc. Las referencias externas usan `<ID-DE-SPEC>/RF-01`. Consulta la guía completa en [`specs/REQUIREMENTS_GUIDE.md`](specs/REQUIREMENTS_GUIDE.md).

## Regla de trabajo

Cada petición del usuario que cambie el producto, el comportamiento, los datos, la seguridad, la operación o la documentación debe tener una especificación con ID estable. La ficha se crea o actualiza antes de escribir código. Durante la implementación se mantienen al día el estado, las decisiones, los enlaces a cambios y la validación.

Una respuesta de implementación solo está completa cuando:

- la especificación tiene criterios de aceptación verificables;
- el código, la configuración o la documentación reflejan esos criterios;
- las comprobaciones realizadas están anotadas en la ficha;
- las preguntas abiertas y los riesgos restantes están explícitos;
- `SPEC_REGISTRY.md` enlaza la ficha y muestra su estado actual.

## Convenciones obligatorias

- Usa IDs con el formato `LP-<PREFIJO>-<NÚMERO>`, por ejemplo `LP-FEAT-004` o `LP-FIX-002`.
- No reutilices un ID ni borres una especificación histórica. Si una petición cambia de alcance, crea una nueva ficha o deja constancia de la decisión.
- Escribe las fichas en español y conserva los nombres de código, rutas y estados técnicos tal como aparecen en el proyecto.
- Distingue siempre el problema de producto, la solución aceptada y la implementación técnica. La implementación no sustituye a los criterios de aceptación.
- No marques una ficha como `VERIFIED` sin indicar cómo se comprobó.
- No incluyas secretos, tokens, contraseñas ni datos personales en las fichas, los logs o los commits.
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
