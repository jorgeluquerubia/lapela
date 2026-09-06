# Guía de requisitos de La Pela

Esta guía evita mezclar la clase de trabajo con lo que el producto debe cumplir. Toda solicitud vive en una ficha `LP-<PREFIJO>-<NÚMERO>` y puede contener requisitos de varias clases. Los prefijos de ID definidos en `SPEC_REGISTRY.md` son `FEAT`, `FIX`, `INFRA`, `SEC`, `DEBT`, `EXP`, `OPS` y `DOC`.

## Dos niveles de clasificación

### 1. Tipo de ficha

Explica la naturaleza del trabajo: `FEATURE`, `FIX`, `INFRA`, `SECURITY`, `TECH-DEBT`, `EXPERIMENT`, `OPS` o `DOC`. Solo hay un tipo principal por ficha.

### 2. Tipo de requisito

| Clase | Significado | Forma de comprobarlo | Ejemplo |
|---|---|---|---|
| `RF` | Conducta o capacidad observable del sistema | Flujo de usuario, respuesta de API o cambio de estado | `RF-01`: una cuenta puede solicitar restablecer su contraseña |
| `RNF` | Atributo medible de calidad o restricción técnica | Umbral, auditoría, prueba de carga, accesibilidad o compatibilidad | `RNF-01`: la respuesta no revela si el email está registrado |
| `RN` | Regla estable del negocio o del dominio | Casos permitidos y rechazados | `RN-01`: comprador y vendedor no pueden negociar el precio |

“Crear un RF” no determina el tipo de ficha. Una capacidad nueva suele registrarse en una `FEATURE`; un RF ya acordado que falla se atiende mediante un `FIX`; un RF que exige una migración puede tener una `INFRA` relacionada.

## Identificación y trazabilidad

- Los requisitos se numeran dentro de la ficha: `RF-01`, `RNF-01`, `RN-01`.
- No se reutiliza ni renumera un identificador publicado. Un requisito retirado se conserva y se marca como retirado con su motivo.
- Fuera de la ficha se cita el identificador completo, por ejemplo `LP-FEAT-004/RF-02`.
- Los criterios de aceptación `AC-XX` demuestran requisitos concretos. Un criterio puede cubrir más de un requisito, pero la relación debe quedar escrita si no es evidente.
- Una decisión de implementación, como elegir una librería, no es un RF. Se registra en “Decisiones” o como RNF si expresa una restricción verificable del producto.

## Proceso al recibir una petición

1. Conservar el enunciado y la fecha en la ficha.
2. Determinar si continúa una ficha existente o necesita una nueva.
3. Clasificar el tipo principal del trabajo.
4. Separar conductas (`RF`), cualidades medibles (`RNF`) y reglas del dominio (`RN`).
5. Añadir criterios de aceptación objetivos y el plan de validación.
6. Revisar si cambia el resumen transversal de `PROJECT_CONTEXT.md`.
7. Implementar, aportar evidencia y ejecutar `npm run specs:check`.

## Ejemplo breve

Una petición “añade un RF para cancelar una compra antes del pago” podría quedar así:

- Ficha: `LP-FEAT-004`, porque introduce una capacidad nueva.
- `RF-01`: el comprador puede cancelar un pedido `pending_payment`.
- `RN-01`: un pedido pagado no se cancela mediante este flujo.
- `RNF-01`: dos solicitudes repetidas producen el mismo estado final.
- `AC-01`: dado un pedido pendiente propio, cuando se confirma la cancelación, entonces el pedido queda cancelado y el artículo vuelve a estar disponible.
