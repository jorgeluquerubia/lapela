---
id: LP-FEAT-017
type: FEATURE
status: VERIFIED
priority: P1
requested_at: 2026-09-12
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/46
related_specs: [LP-FEAT-001, LP-FEAT-005, LP-FEAT-015]
dependencies: []
cross_cutting_concerns: [contenido, moderación, privacidad, accesibilidad]
---

# LP-FEAT-017 · Historias de los objetos

## 1. Solicitud original

> Añadir historias de los objetos para unir la nostalgia de La Pela con la segunda mano y permitir que cada artículo tenga un contexto personal, además de su descripción objetiva.

## 2. Contexto y problema

- **Problema u oportunidad:** El catálogo informa de estado, precio y entrega, pero no materializa la promesa editorial `cosas con historia` ni ofrece al vendedor un espacio estructurado para explicar el recorrido del objeto.
- **Personas afectadas:** Vendedores que desean diferenciar su anuncio y compradores interesados en singularidad, procedencia o contexto.
- **Impacto actual:** La nostalgia permanece en la marca y no genera contenido propio, vínculo emocional ni piezas compartibles.
- **Evidencia disponible:** La descripción actual combina información objetiva; separar la historia evita que datos sobre defectos o entrega queden escondidos dentro de un relato.

## 3. Resultado esperado

El vendedor puede añadir una historia opcional al publicar un anuncio. La ficha la presenta en un bloque diferenciado de la descripción y los anuncios que la incluyen muestran un distintivo `Con historia`, sin reducir la obligación de describir estado y defectos con precisión.

## 4. Alcance

### Incluido

- Campo opcional `Historia de este objeto` durante publicación y edición futura del anuncio.
- Texto de ayuda con preguntas orientativas sobre origen, recuerdos, uso o motivo de la venta.
- Presentación diferenciada en la ficha y distintivo discreto en catálogo.
- Reutilización de límites de contacto, enlaces, datos personales y términos prohibidos del anuncio.
- Capacidad de retirar u ocultar la historia sin eliminar el anuncio.

### Excluido

- Sustituir la descripción objetiva, el estado o los defectos.
- Comentarios públicos, reacciones, seguidores o mensajería previa a la operación.
- Verificación histórica o certificación de procedencia, autenticidad o propiedad.
- Selecciones editoriales y tarjetas sociales, cubiertas por fichas independientes.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: El formulario de publicación debe permitir añadir una historia opcional de hasta 1.000 caracteres.
- `RF-02`: Una historia válida debe mostrarse en un bloque diferenciado de la descripción objetiva en la ficha pública.
- `RF-03`: Catálogo y ficha deben identificar el anuncio con el distintivo `Con historia` cuando corresponda.
- `RF-04`: El propietario debe poder retirar la historia sin afectar el resto del anuncio cuando exista edición de anuncios.
- `RF-05`: El backend debe rechazar historias que incumplan las reglas vigentes de contacto, enlaces o contenido prohibido.

### Requisitos no funcionales

- `RNF-01`: El contenido debe almacenarse y renderizarse como texto plano, sin HTML ejecutable.
- `RNF-02`: Las validaciones de longitud y contenido deben ejecutarse en cliente y servidor con mensajes equivalentes.
- `RNF-03`: El bloque debe ser legible y navegable en móvil, con encabezado semántico y sin penalizar la carga inicial.

### Reglas de negocio

- `RN-01`: La historia es opcional y nunca condiciona la publicación.
- `RN-02`: La descripción objetiva sigue siendo obligatoria y debe contener estado, contenido y defectos relevantes.
- `RN-03`: La historia no puede incluir datos de contacto, instrucciones de pago externo ni fórmulas de regateo.
- `RN-04`: `Con historia` describe la existencia de un relato del vendedor; no certifica autenticidad ni procedencia.

## 6. Criterios de aceptación

- [x] `AC-01` Un vendedor puede publicar sin historia y el flujo conserva exactamente los requisitos actuales.
- [x] `AC-02` Una historia válida de hasta 1.000 caracteres se guarda y aparece separada de la descripción bajo `La historia de este objeto`.
- [x] `AC-03` Un anuncio con historia muestra `Con historia` en catálogo y ficha; uno sin historia no presenta un hueco vacío.
- [x] `AC-04` Teléfonos, emails, enlaces, redes, pago externo o regateo son rechazados también dentro de la historia.
- [x] `AC-05` El contenido se muestra como texto plano y no ejecuta etiquetas, scripts ni enlaces introducidos por el vendedor.
- [x] `AC-06` Las pruebas de publicación, validación, proyección pública y responsive, además del build y `npm run specs:check`, concluyen correctamente.

## 7. Experiencia y estados

- **Estados normales:** Campo opcional después de la descripción, con ejemplo breve y contador de caracteres.
- **Estados de error o vacío:** Sin historia no aparece el bloque; los errores explican qué contenido debe eliminarse sin reproducir datos sensibles.
- **Mensajes y accesibilidad:** Etiqueta asociada, ayuda accesible y errores con `role="alert"`.
- **Responsive o canales afectados:** Publicación, futuro editor, catálogo y ficha en móvil y escritorio.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Campo de texto nullable en `lp_listings`, con valor vacío normalizado a `null`.
- **API/integraciones:** Publicación y proyección pública del detalle incorporan la historia validada.
- **Autorización y privacidad:** Solo el propietario puede crear o retirar la historia; el texto es público mientras el anuncio lo sea.
- **Observabilidad y soporte:** Registrar rechazo por clase de validación sin conservar el contenido rechazado en logs.
- **Métricas o señales de éxito:** Porcentaje de anuncios con historia, interacción con sus fichas y comparación de guardados/ventas frente a anuncios equivalentes.
- **Migración/rollback:** Migración aditiva nullable; ocultar el bloque permite rollback sin perder compatibilidad.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Migración remota | Campo opcional y compatible | `supabase/migrations/202609120003_listing_story.sql` aplicada y comprobada en BD de producción (`information_schema.columns`: `story text nullable`) | 2026-09-13 |
| Validación de contenido | Reglas idénticas en cliente y servidor | 10 tests pasando en `rules-story.test.ts` (`validateStory`, `noContact`, `noBargaining`, `noExternalPayment`) | 2026-09-12 |
| Seguridad de renderizado | Texto plano sin ejecución | Tests en `ProductDetailInteractive.test.tsx` verificando que scripts o etiquetas HTML se renderizan escapados | 2026-09-12 |
| Revisión visual | Bloque diferenciado y responsive | Badges en `ProductCard.test.tsx` y bloque `La historia de este objeto` en `ProductDetailInteractive.test.tsx` | 2026-09-12 |
| Build y specs | Comprobaciones sin errores | `npm run build` y `npm run specs:check` exitosos sin errores | 2026-09-12 |
| Catálogo en producción | `/api/products` responde 200 y proyecta `story` | Comprobado con `curl` y smoke test en `https://lapela-nine.vercel.app/api/products` tras migración | 2026-09-13 |
| Verificación E2E producción | Publicación con/sin historia, distintivos y retirada | Prueba Playwright en producción: publicación con y sin historia, visualización de distintivos y retirada sin eliminar anuncio | 2026-09-13 |
| Smoke test de despliegue | Verificación automatizada post-despliegue | Script `tools/smoke-test-deployment.mjs` (`npm run smoke:deployment`) pasando contra producción | 2026-09-13 |
| Cobertura de esquema | Prevención de columnas sin migrar | Script `tools/validate-schema-coverage.mjs` (`npm run schema:check`) validando columnas locales y remotas | 2026-09-13 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Mantener historia y descripción como campos separados; distintivo descriptivo sin promesa de autenticidad.
- **Riesgos y límites:** Puede utilizarse para insertar datos personales, publicidad o relatos falsos; se aplican validación y denuncia existentes, sin ofrecer verificación.
- **Preguntas abiertas:** Ninguna bloqueante.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `src/lib/rules.ts`, `src/types/index.ts`, `src/models/marketplace.ts`, `src/controllers/marketplace.ts`, `src/app/publish-ad/page.tsx`, `src/components/ProductCard.tsx`, `src/components/ProductDetailInteractive.tsx`, `src/app/articulos/[slug]/page.tsx`, `src/lib/demo-products.ts`, `src/app/my-products/page.tsx`, `src/app/globals.css`, `supabase/migrations/202609120003_listing_story.sql`, `tools/smoke-test-deployment.mjs`, `tools/validate-schema-coverage.mjs`.
- **Migraciones/configuración:** Columna nullable `story text` en `public.lp_listings`.
- **Commit o despliegue:** Implementado en rama `codex/lp-feat-017-historias-objetos`. Migración aplicada en producción de Supabase.
- **Notas de implementación:** La historia se proyecta en fichas públicas y tarjetas de catálogo (`publicFields`), y el propietario cuenta con acción para retirarla.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-12 | `READY` | Ficha e issue creadas; alcance preparado sin implementación | Codex |
| 2026-09-12 | `IMPLEMENTED` | Implementación completa de historias de objetos, reglas de validación, vistas, distintivos y tests; migración 202609120003 y rebase con main | Antigravity |
| 2026-09-13 | `VERIFIED` | Migración aplicada en BD de producción; catálogo y /api/products desbloqueados (200); verificación E2E completa en producción (publicación con/sin historia, distintivos, bloque y retirada sin eliminar anuncio); smoke test y comprobación automática de esquema añadidos | Antigravity |

