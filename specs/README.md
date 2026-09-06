# Especificaciones de producto

Las fichas de esta carpeta son el contrato de trabajo para producto, diseño, ingeniería, operaciones y agentes de IA.

- El índice canónico está en [`../SPEC_REGISTRY.md`](../SPEC_REGISTRY.md).
- Copia [`SPEC_TEMPLATE.md`](SPEC_TEMPLATE.md) para cada solicitud nueva.
- Usa [`REQUIREMENTS_GUIDE.md`](REQUIREMENTS_GUIDE.md) para distinguir `RF`, `RNF` y reglas de negocio del tipo de ficha.
- Una ficha debe tener un ID único, fecha de solicitud, tipo principal, alcance y criterios de aceptación numerados.
- Toda ficha debe guardar su GitHub Issue en `github_issue`; usa `pending` solo mientras GitHub no esté disponible.
- Actualiza la ficha durante la implementación y enlázala desde el registro raíz.
- Ejecuta `npm run specs:check` antes de cerrar el trabajo.

Los nombres de archivo siguen el patrón `<ID>-<slug>.md`.
