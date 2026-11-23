---
id: LP-FEAT-023
type: FEATURE
status: IMPLEMENTED
priority: P1
requested_at: 2026-11-23
requested_by: usuario
source: revisión del piloto
owner: ingeniería
github_issue: https://github.com/jorgeluquerubia/lapela/issues/96
related_specs: [LP-INFRA-007]
dependencies: [LP-INFRA-007]
cross_cutting_concerns: [accesibilidad, responsive]
---

# LP-FEAT-023 · Diseño y recorridos de la beta

La auditoría del piloto pide adelantar productos y acciones, mejorar reflujo y teclado y mantener la identidad de la peseta. La rama parte del PR combinado #95.

- [ ] `AC-01` La cabecera, los avisos y las secciones de actividad son utilizables desde 320 px.
- [ ] `AC-02` Compra y puja muestran precio, entrega y acción antes de la información extensa, con confirmación accesible y retorno tras iniciar sesión.
- [ ] `AC-03` El catálogo distingue portada, búsqueda y subastas, conserva filtros y ofrece controles móviles claros.
- [ ] `AC-04` Publicación, perfiles, actividad y pedidos destacan las acciones y los estados.
- [ ] `AC-05` Se verifican escritorio, móvil, teclado y rutas representativas en varios motores.

## Implementación

- Cabecera compacta, novedades agrupadas por pedido y recorrido por teclado.
- Filtros compartibles, resultados específicos para cada ruta y fotos ampliables.
- Ficha de compra y puja con confirmaciones nativas. Retorno al anuncio después del acceso.
- Orden de fotografías en publicación, métricas públicas del vendedor, actividad en curso e historial, y progreso del pedido.
- Instrument Sans alojada con la aplicación, Georgia en titulares y contraste reforzado en texto secundario y enlaces.

La pull request se prepara sobre la rama del PR #95 para revisar el rediseño sobre el piloto integrado. Quedan pendientes la validación con personas invitadas, la revisión en dispositivos físicos y la integración posterior en main.
