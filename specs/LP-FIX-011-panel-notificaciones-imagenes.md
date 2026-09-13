---
id: LP-FIX-011
type: FIX
status: VERIFIED
priority: P1
requested_at: 2026-09-13
requested_by: usuario
source: conversación
owner: frontend
github_issue: https://github.com/jorgeluquerubia/lapela/issues/79
related_specs: [LP-FIX-003, LP-FIX-005, LP-FEAT-008, LP-FEAT-012]
dependencies: []
cross_cutting_concerns: [ui, css, accesibilidad]
---

# LP-FIX-011 · Corrección de solapamiento del panel de notificaciones y carga robusta de imágenes

## 1. Solicitud original

> "ha habido alguna regresion en la aplicacion, a nivel de interfaz. Cuadno selecciono la campanita para ver notificaciones se abren las notificaciones en un panel blanco que queda por detras del componente grande donde pone El mercado de las cosas buenas. Segunda mano. Sin segundas negociaciones. Además ahora no consigo ver todas las imagenes, hay algunas imagenes de productos que no se carga nada."

## 2. Contexto y problema

- **Problema u oportunidad:**
  1. Al desplegar la campana de notificaciones, el panel flotante (`.notification-panel`) queda solapado y renderizado por detrás del bloque `.market-intro` (*El mercado de las cosas buenas. Segunda mano. Sin segundas negociaciones.*). Esto se debe a que `.site-header` tiene `backdrop-filter: blur(10px)`, lo que crea un nuevo contexto de apilamiento en CSS (*stacking context*). Al no tener `.site-header` una posición explícita (`position: relative`) con `z-index` configurado, los elementos posicionados posteriores en el DOM (`.market-intro`, con `position: relative; isolation: isolate;`) se pintan por encima de todo el subárbol de la cabecera, haciendo inaccesible o parcialmente invisible el panel de notificaciones.
  2. En el catálogo y fichas de producto, varios anuncios muestran un hueco vacío o un spinner persistente sin cargar imagen:
     - En frontend (`ProductCard.tsx`), el estado `imageLoaded` depende únicamente de `onLoad` sin considerar imágenes en caché ni manejar el evento `onError`, y carece de imagen de respaldo (*fallback*).
     - En datos del entorno sandbox, existen 6 anuncios recientes que apuntan a una imagen de prueba de 847 bytes consistente en un bloque uniforme sólido de color gris (`#f3f6f4`), prácticamente idéntico al fondo `--surface` (`#f1ede3`), aparentando que la imagen nunca carga.
- **Personas afectadas:** Compradores y vendedores navegando por el portal, consultando notificaciones y explorando el catálogo de artículos.
- **Impacto actual:** Dificultad para consultar notificaciones desde la cabecera en la página principal y percepción de catálogo roto por imágenes vacías.
- **Evidencia disponible:**
  - Inspección del árbol CSS y DOM: `.site-header` carece de `position: relative; z-index: 40;`, quedando por debajo de `.market-intro`.
  - Petición HTTP a `https://lapela-nine.vercel.app/api/products` confirmando 6 productos con imágenes de 847 bytes con hash idéntico `652dfd6ffaa6c58dc0b6b5605d3a1250`.

## 3. Resultado esperado

1. Al abrir la campanita de notificaciones en cualquier página (incluyendo la portada con `.market-intro`), el panel de novedades se muestra nítidamente superpuesto por encima de cualquier componente de la página sin quedar oculto ni cortado.
2. Todas las tarjetas de producto en el catálogo manejan adecuadamente imágenes cargadas, imágenes en caché, posibles errores de red o URLs vacías, mostrando una imagen fallback elegante en caso de fallo y cesando el estado de carga (spinner).
3. Los anuncios de demostración del entorno sandbox disponen de imágenes válidas y representativas.

## 4. Alcance

### Incluido

- Corrección del contexto de apilamiento de `.site-header`, `.notification-menu` y `.notification-panel` en `src/app/globals.css`.
- Manejo de `onError`, verificación de `complete` en cliente y fallback visual en `src/components/ProductCard.tsx` y `src/components/ProductDetailInteractive.tsx`.
- Imagen placeholder SVG para artículos sin foto o con foto rota.
- Actualización de los datos de imagen de los 6 anuncios sandbox con imágenes de prueba vacías.
- Pruebas unitarias para validar los estados de carga y error en tarjetas de producto.

### Excluido

- Modificación de la API transaccional de subida de imágenes (`/api/market/upload`).
- Cambios en el esquema de base de datos.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `LP-FIX-011/RF-01`: Al hacer clic en el botón de la campana de notificaciones, el panel de novedades debe desplegarse por encima de todos los elementos visuales de la página, sin solaparse por detrás de cabeceras de sección, banners o rejillas de productos.
- `LP-FIX-011/RF-02`: En caso de que una imagen de producto falle al cargarse o no esté disponible, la tarjeta de producto debe mostrar una imagen de respaldo (placeholder) y retirar el estado de carga (`BrandSpinner`).
- `LP-FIX-011/RF-03`: Las imágenes que ya se encuentren en la memoria caché del navegador deben detectarse de forma inmediata en el cliente sin quedar atrapadas en un estado de spinner permanente.

### Requisitos no funcionales

- `LP-FIX-011/RNF-01`: La corrección visual no debe causar saltos de layout (*Cumulative Layout Shift*) ni interferir con la navegación responsive en dispositivos móviles.
- `LP-FIX-011/RNF-02`: La solución debe ser compatible con todos los navegadores modernos estándar respetando el rendimiento de renderizado.

### Reglas de negocio

- `LP-FIX-011/RN-01`: Todos los artículos accesibles en el catálogo deben presentar una representación visual clara, ya sea su fotografía original o el indicador de imagen no disponible de la plataforma.

## 6. Criterios de aceptación

- [x] `AC-01` Dado un usuario en la portada `/` que pulsa la campana de notificaciones, el panel flotante `#notification-panel` se renderiza completamente visible por encima de `.market-intro` y cualquier otro elemento del DOM.
- [x] `AC-02` Dado un artículo con imagen en caché o cuya carga se completa inmediatamente, la tarjeta de producto muestra la imagen con opacidad completa y sin spinner bloqueante.
- [x] `AC-03` Dado un artículo con URL de imagen rota o con error de carga, la tarjeta conmuta limpiamente a la imagen placeholder y concluye la animación de carga.
- [x] `AC-04` Los anuncios sandbox de relojes y cámaras cuentan con imágenes válidas que se visualizan correctamente en el catálogo.
- [x] `AC-05` Las suites de tests automáticos (`npm test`) y la validación de gobernanza (`npm run specs:check`) pasan satisfactoriamente.

## 7. Experiencia y estados

- **Estados normales:** Cabecera con efecto blur; panel desplegado visible en primer plano; imágenes nítidas y centradas en el catálogo.
- **Estados de error o vacío:** En caso de error de imagen, se visualiza el placeholder SVG temático de La Pela.
- **Responsive:** Comportamiento consistente en resoluciones móviles (<650px), tablets y escritorio.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Sin cambios estructurales en tablas `lp_*`.
- **API/integraciones:** Sin cambios en firmas de endpoints.
- **Autorización y privacidad:** No aplica.
- **Migración/rollback:** Revertir los cambios en `globals.css` y `ProductCard.tsx`.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Revisión CSS `.site-header` | Contexto de apilamiento por encima de `.market-intro` | `.site-header` con `position: relative; z-index: 40;`, `.notification-panel` con `z-index: 50;` validado en `tests/ui-regressions.spec.ts` | 2026-09-13 |
| Test unitario `ProductCard` | Manejo de `onError` y fallback visual | 8/8 tests pasando en `src/components/__tests__/ProductCard.test.tsx` | 2026-09-13 |
| Test E2E Playwright | Apilamiento y carga de imágenes en Chromium | 3/3 tests pasando en `tests/ui-regressions.spec.ts` | 2026-09-13 |
| Validación de datos sandbox | Imágenes reales en los 6 anuncios sandbox | Actualizadas fotos Unsplash de cámaras y relojes en Supabase | 2026-09-13 |
| Validación de specs | `npm run specs:check` exitoso | Salida: 39 fichas registradas y 50 documentos enlazados | 2026-09-13 |
| Build del proyecto | `npm run build` sin errores | Next.js 15.5 compiló exitosamente 29 rutas estáticas y dinámicas | 2026-09-13 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:**
  - Establecer `position: relative; z-index: 40;` en `.site-header` para elevar el stacking context que introduce `backdrop-filter`.
  - Proporcionar un placeholder SVG estilizado para productos sin imagen o con imagen rota.
  - Actualizar los registros sandbox de Supabase que tenían imágenes grises de prueba con fotografías reales de Unsplash.
- **Riesgos y límites:** Ninguno relevante; cambios localizados en CSS y componentes de presentación.
- **Preguntas abiertas:** Ninguna.

## 11. Implementación y trazabilidad

- **Pull Request:** [PR #82](https://github.com/jorgeluquerubia/lapela/pull/82)
- **Archivos o módulos:**
  - `src/app/globals.css`
  - `src/components/ProductCard.tsx`
  - `src/components/ProductDetailInteractive.tsx`
  - `src/components/__tests__/ProductCard.test.tsx`
  - `src/lib/image-processing.ts`
  - `tests/ui-regressions.spec.ts`
  - `SPEC_REGISTRY.md`
- **Notas de implementación:** Corrección de stacking context en `.site-header` (`z-index: 40`), panel de notificaciones (`z-index: 50`) y robustez en ciclo de vida y fallback de imágenes.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-13 | `IN_PROGRESS` | Creación de especificación y arranque de implementación | Gemini |
| 2026-09-13 | `VERIFIED` | Validación completa de todos los AC y PR #82 preparada | Gemini |
