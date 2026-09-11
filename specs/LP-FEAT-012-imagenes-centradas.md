---
id: LP-FEAT-012
type: FEATURE
status: IMPLEMENTED
priority: P2
requested_at: 2026-09-11
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/35
related_specs: [LP-FEAT-001]
dependencies: [Canvas del navegador, Supabase Storage]
cross_cutting_concerns: [UX, responsive]
---

# LP-FEAT-012 · Escalado y centrado de imágenes en anuncios

## 1. Solicitud original

> quiero que al subir las imagenes, se escalen de tal forma que se vean bien y centras en los anuncios despues de subirlas

## 2. Contexto y problema

- **Problema u oportunidad:** Las fotografías se muestran con tratamientos distintos según la superficie. En particular, las tarjetas del catálogo y algunas vistas de actividad usan `object-fit: cover`, por lo que una foto vertical u horizontal puede recortarse y perder el objeto principal.
- **Personas afectadas:** Vendedores que publican fotografías con formatos variados y compradores que consultan anuncios desde móvil o escritorio.
- **Impacto actual:** El artículo puede aparecer parcialmente cortado, descentrado o con una composición diferente entre catálogo, detalle, actividad y pedido.

## 3. Resultado esperado

Las fotos subidas se normalizan conservando su proporción dentro de un lienzo estable, con el contenido centrado. Todas las superficies que muestran imágenes de anuncios respetan la imagen completa y la mantienen centrada, sin depender del formato original.

## 4. Alcance

### Incluido

- Normalización en navegador de las fotos del flujo de publicación mediante escalado proporcional y centrado en un lienzo 4:3.
- Conversión del resultado normalizado a una imagen JPG compatible con la validación actual del backend.
- Presentación centrada y sin recorte en catálogo, detalle, miniaturas, actividad y pedido.
- Texto de ayuda en la pantalla de publicación para hacer visible el comportamiento.

### Excluido

- Cambios en los formatos admitidos, el límite de seis fotos o el máximo de 5 MB por archivo.
- Recorte manual, edición fotográfica o selección de un punto focal por parte de la persona usuaria.
- Transformación retroactiva de fotografías ya almacenadas.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Al seleccionar una foto válida para publicar, la aplicación debe escalarla proporcionalmente y centrarla dentro de un lienzo 4:3 sin recortar su contenido.
- `RF-02`: La foto normalizada debe subirse y utilizarse en el anuncio como la imagen que verá quien lo consulte.
- `RF-03`: Catálogo, detalle, miniaturas, actividad y pedido deben mostrar la imagen completa y centrada dentro de su marco.

### Requisitos no funcionales

- `RNF-01`: La normalización no debe bloquear la publicación indefinidamente si el navegador no puede decodificar una imagen; en ese caso se conserva el archivo original para que el backend aplique su validación.
- `RNF-02`: El resultado debe mantener el límite vigente de 5 MB y los formatos de entrada JPG, PNG y WebP.
- `RNF-03`: El contenido de la fotografía no debe ampliarse más allá de lo necesario para ocupar el lienzo; se debe evitar una pérdida visible de calidad en imágenes grandes.

### Reglas de negocio

- `RN-01`: La foto se conserva completa; no se permite que el ajuste automático elimine partes del artículo.
- `RN-02`: La normalización no modifica ninguna otra información del anuncio ni sus reglas de publicación.

## 6. Criterios de aceptación

- [x] `AC-01` Una imagen horizontal, vertical o cuadrada seleccionada para un anuncio se escala proporcionalmente, queda centrada y se muestra completa en la vista previa.
- [x] `AC-02` El archivo normalizado se envía al endpoint de subida y el anuncio conserva la URL devuelta por el backend.
- [x] `AC-03` Las imágenes de catálogo, detalle, miniaturas, actividad y pedido se muestran centradas sin recortar.
- [x] `AC-04` Siguen funcionando la validación de JPG, PNG y WebP, el máximo de 5 MB y el límite de seis imágenes.
- [x] `AC-05` Las pruebas focalizadas, la compilación y `npm run specs:check` terminan correctamente.

## 7. Experiencia y estados

- **Selección:** La ayuda del campo de fotos indica que las imágenes se ajustan automáticamente para verse completas y centradas.
- **Procesamiento:** Se mantiene el estado existente «Subiendo fotos…» mientras se normaliza y sube cada imagen.
- **Error:** Si la subida o la validación falla, se conserva el mensaje de error existente y no se añade una URL incompleta a la lista.
- **Responsive:** La composición se mantiene en tarjetas y marcos de escritorio y móvil sin desplazamiento horizontal.

## 8. Datos, API, seguridad y operación

- **Datos:** No requiere cambios en `lp_listings`; solo cambia el contenido binario que se guarda en la URL de `images`.
- **API:** Se mantiene `POST /api/market/upload`. El servidor sigue comprobando autenticación, MIME, firma y tamaño del archivo recibido.
- **Seguridad:** La normalización ocurre en el navegador y no relaja las validaciones del backend ni la restricción de rutas por usuario.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Pruebas de normalización | Escalado proporcional, lienzo 4:3, centrado y fallback si no se puede decodificar | `PASS src/lib/__tests__/image-processing.test.ts` (3 tests) | 2026-09-11 |
| Prueba de publicación | La URL devuelta por `/api/market/upload` se usa al publicar | Flujo de publicación conserva `data.url` y la pasa a `api('publish', ...)`; build correcto | 2026-09-11 |
| Revisión responsive | Catálogo, detalle, actividad y pedido no recortan el contenido | Revisión visual local en escritorio y viewport móvil 390×844; imágenes de ejemplo completas y centradas | 2026-09-11 |
| Build y specs | Comprobaciones correctas | `npm run build` con configuración sintética y `npm run specs:check` correctos | 2026-09-11 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** Se usa un lienzo 4:3 con fondo de superficie del producto para estabilizar la composición y permitir que las superficies usen `contain` sin recortar.
- **Riesgo:** La conversión a JPG elimina transparencia; el fondo estable evita que un PNG transparente quede visualmente impredecible en las tarjetas.
- **Preguntas abiertas:** Ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `src/lib/image-processing.ts`, `src/app/publish-ad/page.tsx`, `src/app/globals.css` y pruebas focalizadas.
- **Rama:** `codex/lp-feat-012-imagenes-centradas`.
- **Issue:** https://github.com/jorgeluquerubia/lapela/issues/35.
- **Pull request:** Pendiente de publicación.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-11 | `IN_PROGRESS` | Creación de la ficha, issue #35 y rama de implementación | Codex |
| 2026-09-11 | `IMPLEMENTED` | Normalización de imágenes, estilos centrados y validación focalizada | Codex |
