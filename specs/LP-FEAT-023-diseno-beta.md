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

- [x] `AC-01` La cabecera, los avisos y las secciones de actividad son utilizables desde 320 px.
- [x] `AC-02` Compra y puja muestran precio, entrega y acción antes de la información extensa, con confirmación accesible y retorno tras iniciar sesión.
- [x] `AC-03` El catálogo distingue portada, búsqueda y subastas, conserva filtros y ofrece controles móviles claros.
- [x] `AC-04` Publicación, perfiles, actividad y pedidos destacan las acciones y los estados.
- [x] `AC-05` Se verifican escritorio, móvil, teclado y rutas representativas en varios motores.

## Implementación

- Cabecera compacta, novedades agrupadas por pedido y recorrido por teclado.
- Filtros compartibles, resultados específicos para cada ruta y fotos ampliables.
- Ficha de compra y puja con confirmaciones nativas. Retorno al anuncio después del acceso.
- Orden de fotografías en publicación, métricas públicas del vendedor, actividad en curso e historial, y progreso del pedido.
- Instrument Sans alojada con la aplicación, Georgia en titulares y contraste reforzado en texto secundario y enlaces.

## Verificación

- Compilación de producción, TypeScript y registro de especificaciones correctos. Pasaron 92 pruebas de componentes e inicio de sesión.
- Pasaron 15 recorridos Playwright con pagos simulados, registro, publicación, compras, concurrencia, pujas, avisos y valoraciones. La auditoría de integridad de solo lectura devolvió cero casos en las 16 comprobaciones.
- Pasaron 103 comprobaciones de interfaz en Chromium, Firefox y WebKit. Se verificaron 9 rutas representativas a 320, 390, 768, 1024 y 1440 px en Chromium y a 390 y 1440 px en los otros dos motores. Se comprobaron el retorno al anuncio, el foco de los diálogos y de la campana, y el orden de fotos al publicar. Tab y Mayús+Tab recorren la confirmación sin salir del diálogo en los tres motores.
- La vuelta desde un artículo restauró el filtro y la posición de desplazamiento de 1.831 px. A 390 px, la primera foto del catálogo quedó a 546 px y el título de la ficha a 637 px.
- En tres cargas locales de producción a 390 px, la portada registró un LCP entre 0,65 y 0,78 s y un CLS de 0. Son mediciones de laboratorio.
- Se identificó un aviso preexistente de bloqueo de sesión de Supabase al recargar en Firefox. WebKit registró cancelaciones de peticiones anticipadas durante los cambios de ruta. Los recorridos funcionales se completaron.

El [PR #97](https://github.com/jorgeluquerubia/lapela/pull/97) se apoya en el PR #95 para revisar el rediseño sobre el piloto integrado. Quedan pendientes la validación con personas invitadas, la revisión en dispositivos físicos y la integración en `main`.
