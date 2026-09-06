# Instrucciones para agentes de IA de La Pela

Este archivo es el punto de entrada para cualquier IA que trabaje en el repositorio.

## Antes de cambiar nada

1. Lee [`SPEC_REGISTRY.md`](SPEC_REGISTRY.md), que es el registro canónico de solicitudes y decisiones de producto.
2. Abre la especificación relacionada dentro de [`specs/`](specs/). Si no existe, crea una antes de implementar.
3. Clasifica la petición como `FEATURE`, `FIX`, `INFRA`, `SECURITY`, `TECH-DEBT`, `EXPERIMENT`, `OPS` o `DOC`.
4. Comprueba el estado, el alcance, las dependencias y los criterios de aceptación. No mezcles objetivos distintos en una sola especificación.

## Regla de trabajo

Cada petición del usuario que cambie el producto, el comportamiento, los datos, la seguridad, la operación o la documentación debe tener una especificación con ID estable. La ficha se crea o actualiza antes de escribir código. Durante la implementación se mantienen al día el estado, las decisiones, los enlaces a cambios y la validación.

Una respuesta de implementación solo está completa cuando:

- la especificación tiene criterios de aceptación verificables;
- el código, la configuración o la documentación reflejan esos criterios;
- las comprobaciones realizadas están anotadas en la ficha;
- las preguntas abiertas y los riesgos restantes están explícitos;
- `SPEC_REGISTRY.md` enlaza la ficha y muestra su estado actual.

## Convenciones obligatorias

- Usa IDs con el formato `LP-<TIPO>-<NÚMERO>`, por ejemplo `LP-FEAT-004` o `LP-FIX-002`.
- No reutilices un ID ni borres una especificación histórica. Si una petición cambia de alcance, crea una nueva ficha o deja constancia de la decisión.
- Escribe las fichas en español y conserva los nombres de código, rutas y estados técnicos tal como aparecen en el proyecto.
- Distingue siempre el problema de producto, la solución aceptada y la implementación técnica. La implementación no sustituye a los criterios de aceptación.
- No marques una ficha como `VERIFIED` sin indicar cómo se comprobó.
- No incluyas secretos, tokens, contraseñas ni datos personales en las fichas, los logs o los commits.

## Archivos de referencia rápida

- Registro e índice: [`SPEC_REGISTRY.md`](SPEC_REGISTRY.md)
- Plantilla: [`specs/SPEC_TEMPLATE.md`](specs/SPEC_TEMPLATE.md)
- Fichas individuales: [`specs/`](specs/)
- Contexto funcional existente: [`ANALISIS_FUNCIONAL.md`](ANALISIS_FUNCIONAL.md)
- Arquitectura y estado del portal: [`README.md`](README.md)
