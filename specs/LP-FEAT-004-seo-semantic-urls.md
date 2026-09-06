---
id: LP-FEAT-004
type: FEATURE
status: IMPLEMENTED
priority: P2
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/9
related_specs: [LP-FEAT-001]
dependencies: [Next.js]
cross_cutting_concerns: [OPS, DOC]
---

# LP-FEAT-004 · Optimización SEO y rutas semánticas

## 1. Solicitud original

> necesito incluir tecnicas de SEO en la aplicacion, como por ejemplo que al pinchar en los links de categorias se incluya un enlace con un path semantico, al igual que al pinchar en un producto sea mas semantico el enlace, por ejemplo incluyendo un slug en el producto. Analiza la pagina y mira donde mas se puede atacar de cara al SEO

## 2. Contexto y problema

- **Problema u oportunidad:** El marketplace usaba rutas poco amigables para motores de búsqueda: URLs con query params (`/?category=Tecnología`), botones interactivos en lugar de enlaces rastreables en el catálogo, y rutas de artículos opacas basadas únicamente en UUIDs (`/ad-detail/a9b8c7...`). Además, la ficha de artículo se renderizaba íntegramente en cliente sin metadatos dinámicos (`generateMetadata`), no existían sitemaps ni robots.txt, ni datos estructurados Schema.org.
- **Personas afectadas:** Compradores potenciales que buscan artículos específicos en buscadores (Google, Bing) y vendedores que quieren mayor visibilidad para sus anuncios.
- **Impacto actual:** Pérdida de tráfico orgánico, falta de indexación de categorías y productos, y previsualizaciones pobres al compartir enlaces en redes sociales o mensajería (WhatsApp, Telegram, X).
- **Evidencia disponible:** El catálogo usaba botones con evento `onClick` no indexables por crawlers; `ad-detail/[slug]` carecía de Open Graph dinámico y Schema.org.

## 3. Resultado esperado

1. Rutas semánticas limpias para categorías: `/categoria/[slug]` (ej. `/categoria/tecnologia`) enlazadas mediante etiquetas `<Link>` semánticas tanto en la cabecera como en los filtros laterales.
2. Rutas semánticas para productos con slug descriptivo: `/articulos/[slug-titulo]-[id]` con redirección desde `/ad-detail/[slug]` para preservar enlaces históricos y no fragmentar autoridad.
3. Server-side rendering (SSR) para la ficha del producto con metadatos dinámicos (Open Graph, Twitter Cards, canonical).
4. Marcado de datos estructurados JSON-LD (Schema.org `Product`, `Offer`, `BreadcrumbList` y `WebSite`).
5. Generación automática y dinámica de `robots.txt` y `sitemap.xml`.
6. Exclusión de rastreo (`noindex, nofollow`) en páginas privadas y transaccionales.

## 4. Alcance

### Incluido

- Módulo de utilidades `src/lib/slugs.ts` para normalización y extracción unívoca de identificadores.
- Rutas públicas `/categoria/[categorySlug]` para todas las categorías del marketplace.
- Ruta pública `/subastas` para el catálogo de subastas.
- Ruta pública `/articulos/[slug]` con SSR, metadatos y JSON-LD.
- Redirección de compatibilidad desde `/ad-detail/[slug]` hacia `/articulos/[slug]`.
- Enlaces accesibles `<Link>` en el panel de filtros y cabecera.
- `src/app/robots.ts` y `src/app/sitemap.ts`.
- `metadataBase` y etiquetas Open Graph/Twitter en `RootLayout`.

### Excluido

- Modificación de esquema en PostgreSQL (la resolución se realiza mediante el identificador extraído del slug determinista sin requerir migraciones de base de datos).
- Generación de páginas estáticas previas (ISR/SSG) para miles de anuncios volátiles en sandbox.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: La navegación por categoría debe realizarse mediante enlaces `<Link>` a la ruta `/categoria/[slug]`.
- `RF-02`: El acceso a un producto debe mostrar una URL con formato `/articulos/[slug]-[id]`.
- `RF-03`: Las URLs heredadas `/ad-detail/[slug]` deben redirigir permanentemente a `/articulos/[slug]`.
- `RF-04`: Cada ficha de producto debe incluir etiquetas Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) y Twitter Card dinámicas.
- `RF-05`: Cada ficha de producto debe incluir datos estructurados Schema.org `Product` y `BreadcrumbList`.
- `RF-06`: La aplicación debe servir `sitemap.xml` dinámico con categorías, páginas públicas y anuncios disponibles.
- `RF-07`: La aplicación debe servir `robots.txt` que permita páginas públicas y bloquee áreas privadas.

### Requisitos no funcionales

- `RNF-01`: La generación de slugs debe eliminar acentos, caracteres especiales y normalizar a minúsculas separadas por guiones sin romper caracteres UTF-8.
- `RNF-02`: Las páginas privadas deben incluir la directiva `noindex, nofollow` para evitar desperdicio de crawl budget.

### Reglas de negocio

- `RN-01`: Las categorías soportadas son exactamente las definidas en el dominio (`Tecnología`, `Hogar`, `Moda`, `Deporte`, `Coleccionismo`, `Otros`). Cualquier slug no reconocido debe responder 404.
- `RN-02`: Los productos no disponibles (vendidos, reservados o retirados) enlazados desde buscadores deben conservar su URL con estado visible y esquema marcado como fuera de stock.

## 6. Criterios de aceptación

- [x] `AC-01` Al pulsar en una categoría en el menú o catálogo, el navegador navega a `/categoria/[slug]` con código HTML semántico `<a href="...">`.
- [x] `AC-02` Las tarjetas de producto enlazan a `/articulos/[slug-titulo]-[id]`.
- [x] `AC-03` Las peticiones a `/ad-detail/[id]` o `/ad-detail/[slug]` redirigen a la ruta canónica en `/articulos/[slug]`.
- [x] `AC-04` La página de producto contiene metadatos Open Graph dinámicos con foto, título y precio real.
- [x] `AC-05` La página de producto contiene un bloque `<script type="application/ld+json">` válido con el esquema `Product`.
- [x] `AC-06` La ruta `/robots.txt` es accesible y bloquea rutas privadas.
- [x] `AC-07` La ruta `/sitemap.xml` es accesible y lista categorías y productos activos.
- [x] `AC-08` La comprobación `npm run specs:check` y la compilación `npm run build` terminan sin errores.

## 7. Experiencia y estados

- **Categoría seleccionada:** La URL refleja `/categoria/[slug]`, el título de pestaña muestra el nombre de la categoría y el filtro lateral aparece activo.
- **Detalle de producto:** La barra de direcciones muestra el slug descriptivo. Si el enlace se comparte en chat o redes sociales, se genera una tarjeta enriquecida con la foto del producto.
- **Categoría inexistente:** Responde con la página 404 estándar de la aplicación.
- **Dispositivos móviles:** El panel móvil de filtros mantiene la navegación semántica.

## 8. Datos, API, seguridad y operación

- **Datos:** No requiere cambios en tablas `lp_*`. El slug se computa de forma determinista usando el título y el identificador.
- **API:** El endpoint `/api/market/listing/[id]` acepta tanto UUID directo como slugs que contengan el UUID al final.
- **Seguridad:** Los bots solo pueden rastrear páginas públicas; las áreas privadas (`/orders/`, `/chat/`, `/my-products`, `/user-profile`) están explícitamente excluidas en `robots.txt` y con meta robots `noindex`.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| `npm run specs:check` | Ficha validada y enlazada en el registro | Specs válidas: 9 fichas registradas y 20 documentos enlazados | 2026-09-06 |
| `npm run build` | Compilación de Next.js sin errores de tipos ni rutas | Build completo con 25 páginas generadas | 2026-09-06 |
| Pruebas unitarias de slugs | Normalización de acentos, generación y extracción de id | `PASS src/lib/__tests__/slugs.test.ts` (8 tests pasados) | 2026-09-06 |
| Pruebas de integración SEO | Robots, sitemap, metadata de categorías y artículos y redirección | `PASS src/app/__tests__/seo.test.tsx` (7 tests pasados) | 2026-09-06 |
| Metadatos de áreas privadas | Las páginas privadas indican `noindex, nofollow` | `PASS src/lib/__tests__/seo.test.ts`; layouts privados y build | 2026-09-06 |
| Verificación HTTP | Categoría, artículo, sitemap y robots responden y contienen los datos esperados | Cuatro respuestas HTTP 200 sobre el build de producción | 2026-09-06 |
| Verificación de redirección | `/ad-detail/demo-1` redirige a la URL canónica | Destino `/articulos/ejemplo-auriculares-inalambricos-negros-demo-1` | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión 1:** Mantener el identificador al final del slug (`[titulo-slug]-[id]`) para evitar colisiones entre artículos con títulos idénticos y permitir resolución instantánea sin necesidad de índices únicos ni migraciones.
- **Decisión 2:** Usar `/articulos/[slug]` en español para homogeneidad con `/categoria/` y `/subastas`.
- **Riesgo:** El sitemap usa el entorno activo; antes de activar datos reales habrá que revisar qué contenido sandbox debe indexarse.

## 11. Implementación y trazabilidad

- `src/lib/slugs.ts`: Funciones de slug y mapeos de categoría.
- `src/app/categoria/[categorySlug]/page.tsx`: Página semántica de categorías.
- `src/app/subastas/page.tsx`: Página semántica de subastas.
- `src/app/articulos/[slug]/page.tsx`: Ficha de producto SSR con metadatos y JSON-LD.
- `src/components/ProductDetailInteractive.tsx`: Componente interactivo para puja, compra y avisos.
- `src/app/ad-detail/[slug]/page.tsx`: Redirección hacia `/articulos/[slug]`.
- `src/app/robots.ts` y `src/app/sitemap.ts`: Generadores de robots y sitemap.
- `src/app/layout.tsx`: `metadataBase`, Open Graph global y Schema WebSite.
- `src/components/Header.tsx`, `src/components/Catalog.tsx`, `src/components/ProductCard.tsx`: Enlaces semánticos `<Link>`.
- `src/lib/seo.ts` y layouts de áreas privadas: metadatos `noindex, nofollow`.
- **Rama:** `gemini/lp-feat-004-seo-semantic-urls`.
- **Issue:** `https://github.com/jorgeluquerubia/lapela/issues/9`.
- **Pull request:** pendiente.

## 12. Historial

- 2026-09-06: Creación de la especificación tras análisis SEO solicitado por el usuario.
- 2026-09-06: Implementación separada en su propia rama, compilada y verificada; pendiente de pull request.
