---
id: LP-FEAT-014
type: FEATURE
status: IMPLEMENTED
priority: P1
requested_at: 2026-09-11
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/38
related_specs: []
dependencies: []
cross_cutting_concerns: [catálogo, publicación, PostgreSQL, accesibilidad, rendimiento, privacidad]
---

# LP-FEAT-014 · Buscador de productos con relevancia y sugerencias

## 1. Solicitud original

> "quiero que investigues y hagas un analisis del buscador de productos, ahora mismo solo busca por nombre, pero deberiamos poder buscar por tag o por nombres similares con scoring, un buscador de verdad sin ser demasiado complejo, incluso que aparezcan sugerencias mientras el usuario escribe en el input de busqueda."

## 2. Contexto y problema

- **Problema u oportunidad:** El catálogo filtra hoy por coincidencia parcial literal de título y descripción y ordena por fecha, precio o cierre. No conserva etiquetas, no entiende abreviaturas o sinónimos, no tolera erratas y no muestra ayuda antes de enviar la búsqueda.
- **Personas afectadas:** Personas que exploran y compran artículos, especialmente quienes no conocen el título exacto publicado.
- **Impacto actual:** Consultas razonables como `tele` no encuentran anuncios titulados con `TV`; una coincidencia débil pero reciente puede quedar antes que otra más pertinente; para descubrir si hay resultados se debe abandonar el campo de búsqueda.
- **Evidencia disponible:** Revisión de `GET /api/products`, del formulario de publicación y de la experiencia pública el 2026-09-11. La ruta actual ejecuta mantenimiento de subastas y un conteo exacto, por lo que no es apta para peticiones de autocompletado frecuentes. Las pruebas heredadas de productos no representan la ruta ni el modelo activo y fallan en el estado actual.

## 3. Resultado esperado

Una persona puede introducir términos naturales, abreviaturas frecuentes o pequeñas erratas y recibir primero anuncios disponibles que mejor correspondan con título, etiquetas, categoría y descripción. Mientras escribe, puede elegir sugerencias de consulta, categoría o anuncio sin enviar el formulario. La solución se apoya en PostgreSQL/Supabase y no incorpora un servicio externo de búsqueda en esta fase.

## 4. Alcance

### Incluido

- Etiquetas normalizadas y controladas, con hasta cinco valores por anuncio y sugerencias acordes a su categoría durante la publicación.
- Documento de búsqueda en español que pondera título, etiquetas, categoría y descripción, con índices apropiados.
- Diccionario inicial de alias de alto valor para el catálogo español y coincidencia aproximada conservadora para erratas a partir de tres caracteres.
- Resultados ordenados por relevancia cuando exista consulta de texto, conservando los filtros de categoría, modalidad, precio y ubicación existentes.
- Endpoint público, ligero y limitado para sugerencias; integración accesible en el buscador global de cabecera.
- Pruebas de migración, API, interfaz y regresión de catálogo; actualización o sustitución de las pruebas heredadas que ya no describen `lp_listings`.

### Excluido

- Elasticsearch, Algolia, Meilisearch u otro motor externo.
- Embeddings, búsqueda vectorial o interpretación semántica con IA.
- Personalización por historial de usuario, recomendaciones o ranking comercial.
- Etiquetas libres sin moderación, analítica de consultas identificable o cambios en la indexación SEO de `/search`.
- Reestructurar las categorías, filtros de precio, ubicación o la experiencia de compra.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Los anuncios pueden incluir entre cero y cinco etiquetas normalizadas seleccionadas de una taxonomía controlada compatible con su categoría.
- `RF-02`: Una consulta de texto busca en título, etiquetas, categoría y descripción de anuncios disponibles dentro del entorno activo.
- `RF-03`: Cuando hay consulta textual, los resultados se ordenan por relevancia y ofrecen los órdenes alternativos actuales de fecha, precio y cierre.
- `RF-04`: El buscador reconoce el diccionario inicial de abreviaturas y equivalencias aprobadas, por ejemplo `tele`, `tv`, `televisor` y `televisión`.
- `RF-05`: El buscador puede recuperar coincidencias de título o etiqueta con una errata pequeña sin anteponerlas a una coincidencia exacta de mayor calidad.
- `RF-06`: Tras introducir al menos dos caracteres, el campo de búsqueda ofrece un máximo de seis sugerencias pertinentes y una acción para ver todos los resultados.
- `RF-07`: Una sugerencia permite abrir la búsqueda, categoría o artículo correspondiente con ratón, tacto y teclado.

### Requisitos no funcionales

- `RNF-01`: La consulta de resultados y la de sugerencias deben operar con índices de PostgreSQL y quedar documentadas con un plan de consulta revisado antes de desplegarse.
- `RNF-02`: Con el conjunto de datos de referencia, el endpoint de sugerencias debe devolver como máximo seis elementos y completar en p95 en menos de 250 ms, sin ejecutar el mantenimiento del catálogo ni un conteo exacto.
- `RNF-03`: La interfaz espera entre 150 y 200 ms tras la última pulsación, cancela la petición anterior y no solicita sugerencias con menos de dos caracteres.
- `RNF-04`: El autocompletado cumple el patrón accesible de combobox/listbox: foco visible, flechas para recorrer opciones, Enter para seleccionar y Escape para cerrar.
- `RNF-05`: Las rutas públicas limitan longitud de consulta y resultados, seleccionan exclusivamente campos públicos y no registran términos de búsqueda identificables sin una decisión posterior de privacidad.

### Reglas de negocio

- `RN-01`: Solo los anuncios con `status='available'` y el mismo entorno activo (`sandbox` o `live`) pueden aparecer en resultados o sugerencias.
- `RN-02`: El título tiene prioridad sobre etiquetas; las etiquetas tienen prioridad sobre categoría y descripción; la antigüedad puede desempatar, pero no sustituye la relevancia textual.
- `RN-03`: Las coincidencias aproximadas se aplican solo si superan el umbral aprobado y no pueden convertir una consulta muy corta en resultados ruidosos.
- `RN-04`: Las etiquetas y alias no pueden contener teléfonos, enlaces, datos de contacto ni términos no permitidos por las reglas de publicación.

## 6. Criterios de aceptación

- [ ] `AC-01` Dado un anuncio disponible etiquetado como `televisión`, cuando se busca `tele`, `tv`, `televisor` o `televisión`, entonces aparece entre los resultados relevantes.
- [ ] `AC-02` Dado anuncios que coinciden en título, tags, categoría y solo descripción, cuando se realiza una consulta, entonces se ordenan según la prioridad definida en `RN-02` y una coincidencia exacta de título no queda detrás de una coincidencia débil más reciente.
- [ ] `AC-03` Dado una errata pequeña de tres o más caracteres que se parece a un título o tag, cuando supera el umbral aprobado, entonces se recupera el anuncio pertinente sin que resultados irrelevantes lo sustituyan.
- [ ] `AC-04` Dado una consulta de dos o más caracteres, cuando la persona deja de escribir durante el retardo definido, entonces ve hasta seis sugerencias sin enviar el formulario; con menos de dos caracteres no se solicita la API.
- [ ] `AC-05` Dado el panel de sugerencias abierto, cuando se usan flechas, Enter o Escape, entonces se navega, selecciona o cierra según `RNF-04`; el mismo flujo es usable en móvil.
- [ ] `AC-06` Dado anuncios reservados, vendidos, retirados, expirados o de otro entorno, cuando se busca o solicitan sugerencias, entonces no se exponen.
- [ ] `AC-07` Dado el endpoint de sugerencias, cuando se solicita repetidamente, entonces no ejecuta mantenimiento de subastas ni conteo exacto, limita entrada y salida, y cumple `RNF-02` con evidencia registrada.
- [ ] `AC-08` Las pruebas de base de datos, API y UI cubren coincidencia exacta, alias, errata, filtros, estados excluidos, teclado y cancelación; `npm run specs:check` y la suite focalizada finalizan correctamente.

## 7. Experiencia y estados

- **Estados normales:** Sin texto se conserva el placeholder actual; con dos o más caracteres aparecen sugerencias de consulta/tag, categoría y anuncio, con una acción «Ver todos los resultados para…». Al enviar, el catálogo muestra «Resultados para…» y relevancia como orden inicial.
- **Estados de error o vacío:** Si no hay sugerencias se mantiene el panel cerrado o informa discretamente que se puede buscar el texto completo; si falla la sugerencia no se bloquea el envío. El vacío de resultados conserva acciones para ajustar filtros y publicar.
- **Mensajes y accesibilidad:** Las sugerencias anuncian tipo y contexto (por ejemplo, categoría o precio); no se usa el color como único indicador. El panel mantiene foco y semántica de combobox/listbox.
- **Responsive o canales afectados:** Cabecera global y página `/search` en escritorio y móvil; filtros y navegación semántica existentes se conservan.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Se incorporan tags normalizados y un documento de texto completo ponderado en `lp_listings`, más índices GIN de texto y de trigramas necesarios. Los anuncios existentes siguen siendo buscables aunque inicialmente no tengan tags.
- **API/integraciones:** `GET /api/products` evoluciona para devolver resultados relevantes cuando recibe `q`; una ruta pública separada de sugerencias recibe texto normalizado, filtros de contexto opcionales y un límite. No se usan proveedores externos.
- **Autorización y privacidad:** Ambas rutas filtran entorno y disponibilidad antes de puntuar. La API de sugerencias no devuelve vendedor, identificadores privados ni campos administrativos. Los términos se tratan como texto no confiable y no se almacenan como analítica individual.
- **Observabilidad y soporte:** Se documentarán latencia p95 y tasa de búsqueda sin resultados de forma agregada solo tras acordar su mecanismo y retención. Se revisará `EXPLAIN` de las consultas de resultado y sugerencias.
- **Métricas o señales de éxito:** Menos búsquedas sin resultado en los alias definidos; selección de sugerencia y latencia p95 dentro de objetivo cuando exista medición agregada aprobada.
- **Migración/rollback:** La migración añade columnas e índices de forma compatible. Si hay degradación, se desactiva la coincidencia aproximada y las sugerencias mediante configuración o se vuelve a la consulta literal; no se elimina información de anuncios.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Especificación y alcance | IDs, requisitos y criterios válidos | `npm run specs:check` correcto | 2026-09-11 |
| Vocabulario | Normalización, tags controlados y aliases correctos | `src/lib/__tests__/search.test.ts`: 3 pruebas correctas | 2026-09-11 |
| Compilación | Rutas, tipos y componentes compilan | `npm run build` correcto con valores de marcador no persistidos para Supabase | 2026-09-11 |
| Consulta PostgreSQL | Índices usados y ranking correcto para exacto, alias y errata | Pendiente de aplicar migración y ejecutar `EXPLAIN` en Supabase | Pendiente |
| API e interfaz | Límites, entorno, sugerencias y teclado correctos | Pendiente de pruebas de integración y Playwright con la migración aplicada | Pendiente |
| Rendimiento | p95 de sugerencias inferior a 250 ms con datos de referencia | Pendiente de medición en Supabase | Pendiente |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Se adopta búsqueda léxica de PostgreSQL con pesos, alias controlados y trigramas; no se añade infraestructura de búsqueda independiente. Las etiquetas son controladas en esta fase.
- **Riesgos y límites:** Un diccionario demasiado amplio degrada precisión; la similitud aproximada puede devolver ruido si el umbral es bajo; el catálogo beta actual es pequeño y no representa carga de producción. La taxonomía necesita mantenimiento editorial.
- **Preguntas abiertas:** Definir la primera taxonomía por categoría y el umbral de similitud mediante una muestra de anuncios reales o de prueba; decidir si las etiquetas históricas se completan manualmente o mediante una propuesta revisable.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** Previsiblemente `supabase/migrations/`, `src/controllers/marketplace.ts`, `src/models/marketplace.ts`, `src/components/Header.tsx`, `src/components/Catalog.tsx`, `src/app/publish-ad/page.tsx`, tipos y pruebas asociadas.
- **Migraciones/configuración:** Pendiente; podría requerir habilitar `pg_trgm` y usar la configuración española de texto completo disponible en PostgreSQL/Supabase.
- **Commit o despliegue:** PR [#40](https://github.com/jorgeluquerubia/lapela/pull/40); pendiente de aplicar la migración y desplegar.
- **Notas de implementación:** `202609110001_product_search.sql` añade tags, aliases, vector e índices; `/api/search/suggestions` no ejecuta mantenimiento ni conteo exacto. La validación contra Supabase queda pendiente antes de marcar la ficha como `VERIFIED`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-11 | `DRAFT` | Investigación del buscador y definición inicial de alcance | Codex |
| 2026-09-11 | `IN_PROGRESS` | Issue #38 creada y rama aislada asignada | Codex |
| 2026-09-11 | `READY` | Criterios, datos, seguridad y validación concretados | Codex |
| 2026-09-11 | `IN_PROGRESS` | Inicio de la implementación: datos, ranking y API | Codex |
| 2026-09-11 | `IMPLEMENTED` | Migración, ranking, publicación con tags y sugerencias implementados; falta validación integrada en Supabase | Codex |
