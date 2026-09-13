---
id: LP-FIX-006
type: FIX
status: VERIFIED
priority: P2
requested_at: 2026-09-12
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/57
related_specs: [LP-FEAT-010, LP-FEAT-018]
dependencies: [LP-FEAT-018]
cross_cutting_concerns: [notificaciones, privacidad, experiencia-usuario]
---

# LP-FIX-006 · Notificación de favoritos al vendedor y ocultación en anuncios propios

## 1. Solicitud original

> Si un usuario añade a favoritos un artículo, no se le está notificando al vendedor, habría que añadir el aviso a sus notificaciones. Por otro lado, el vendedor puede ver su propio artículo en los listados, eso está bien, pero lo que no está bien es que le salga la opción de añadirlo a favoritos y que al pinchar lógicamente falle. No debería salirle la opción.

## 2. Contexto y problema

- **Problema u oportunidad:** Tras el lanzamiento de favoritos (`LP-FEAT-018`), el vendedor dispone de un contador agregado en su ficha y en *Mis anuncios*, pero no recibe una notificación informativa en la campana cuando un comprador guarda uno de sus artículos. Además, en las tarjetas de catálogo (`ProductCard`), el botón de favorito permanece visible para el propio vendedor en sus anuncios, lo que provoca que al pulsar reciba un error de bloqueo.
- **Personas afectadas:** Vendedores que quieren estar al tanto del interés en sus artículos, y vendedores que navegan por el catálogo y ven una opción no válida en sus propios anuncios.
- **Impacto actual:** El vendedor desconoce cuándo un artículo despierta interés salvo si consulta activamente el contador. En catálogo, la presencia del botón en anuncios propios genera frustración y llamadas fallidas al backend.
- **Evidencia disponible:** `LP-FEAT-018` prohíbe en backend el auto-favorito (`No puedes añadir tu propio artículo a favoritos`), pero la interfaz no ocultaba el botón en tarjetas de catálogo. La campana (`LP-FEAT-010`, `LP-FIX-003`) soporta avisos con `listing_id` sin exponer identidades.

## 3. Resultado esperado

1. Cuando un comprador añade un artículo a favoritos, el vendedor recibe un aviso interno en la campana indicando que su artículo ha sido guardado, sin exponer la identidad ni alias del comprador.
2. En las tarjetas de producto de catálogo y listados, el botón de favoritos no se muestra para los artículos publicados por el usuario autenticado ni en artículos de demostración.

## 4. Alcance

### Incluido

- Notificación interna al vendedor (`favorite_received`) en `lp_notifications` al añadir un artículo a favoritos.
- Deduplicación antispam para evitar inundar de avisos al vendedor si un artículo recibe múltiples guardados repetidos en poco tiempo.
- Garantía estricta de privacidad: el aviso al vendedor no contiene alias, ID ni información identificable del comprador.
- Detección de anuncio propio en el catálogo (`isMine`) sin exponer UUIDs del vendedor a terceros.
- Ocultación del botón de favoritos en `ProductCard` si el anuncio es propio (`isMine`) o si es un anuncio demo (`demo-*`).
- Feedback visual accesible mediante `toast` en las acciones de favoritos.

### Excluido

- Notificaciones push móviles o correos electrónicos al vendedor.
- Mostrar quién guardó el artículo.
- Ocultar los artículos propios del vendedor en el catálogo (el vendedor puede verlos normalmente, solo se oculta la acción de marcar favorito).

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: El sistema debe generar una notificación interna al vendedor cuando otro usuario guarde su artículo en favoritos.
- `RF-02`: El enlace de la notificación debe dirigir a la ficha del artículo correspondiente.
- `RF-03`: La tarjeta de producto en catálogo y listados no debe mostrar el botón de favoritos si el artículo pertenece a la cuenta autenticada.
- `RF-04`: Las tarjetas de artículos de demostración no deben mostrar el botón de favoritos.

### Requisitos no funcionales

- `RNF-01`: La notificación al vendedor no debe revelar en ningún campo (ni en título, cuerpo o metadatos) el `user_id` ni el alias del usuario que guardó el favorito.
- `RNF-02`: La generación de notificaciones debe limitar la frecuencia para un mismo artículo y vendedor, evitando saturación por reintentos o toggles sucesivos.
- `RNF-03`: La respuesta pública de catálogo no debe exponer el `seller_id` interno a usuarios ajenos para determinar la propiedad del anuncio; debe resolverse mediante un booleano contextual `isMine` ligado a la sesión.

### Reglas de negocio

- `RN-01`: Un vendedor no puede marcar en favoritos su propio artículo ni debe recibir invitaciones visuales a hacerlo.
- `RN-02`: La retirada de un favorito no genera notificación al vendedor ni reduce el historial de avisos pasados.
- `RN-03`: Los favoritos continúan siendo privados; el aviso informa del evento de interés, no de la identidad del seguidor.

## 6. Criterios de aceptación

- [x] `AC-01` Cuando un usuario autenticado guarda un artículo ajeno en favoritos, se crea una notificación interna de tipo `favorite_received` para el vendedor del artículo.
- [x] `AC-02` La notificación recibida por el vendedor no contiene el ID ni alias del comprador, muestra el título del anuncio y enlaza al artículo.
- [x] `AC-03` Si un usuario guarda, retira y vuelve a guardar el artículo en un intervalo corto, el sistema no satura de notificaciones duplicadas al vendedor.
- [x] `AC-04` En el catálogo y listados, el usuario autenticado ve sus propios artículos sin el botón de favoritos.
- [x] `AC-05` En los artículos de demostración (`demo-*`), no se muestra el botón de favoritos.
- [x] `AC-06` Pruebas unitarias, base de datos, `npm run specs:check` y `npm run build` pasan sin errores.

## 7. Experiencia y estados

- **Campana de notificaciones:** Elemento con título *Artículo guardado*, cuerpo indicando que el anuncio ha sido guardado en favoritos y enlace al artículo.
- **Catálogo:** Las tarjetas de artículos propios muestran precio, imagen y metadatos sin superponer el botón de corazón.

## 8. Datos, API, seguridad y operación

- **Base de datos:** Tipo de notificación `favorite_received` añadido al check constraint `lp_notifications_type_check`. Función RPC `lp_set_favorite` ampliada para crear la notificación si `not current_fav`.
- **API:** `catalog` añade `isMine: Boolean(user && l.seller_id === user.id)` para la sesión actual.
- **Seguridad:** Ninguna exposición de identidades en notificaciones ni en catálogo.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Notificación al vendedor | Notificación `favorite_received` generada sin filtrar identidad | `tests/database/marketplace.sql` y prueba RPC en Supabase: notificación creada para el vendedor con título y cuerpo anónimos | 2026-09-12 |
| Ocultación en catálogo | Tarjeta de anuncio propio sin botón de favoritos | `src/components/ProductCard.tsx` oculta el botón si `isMine` es verdadero; validado en `ProductCardFavorite.test.tsx` | 2026-09-12 |
| Artículos demo | Sin botón de favoritos en tarjetas demo | `src/components/ProductCard.tsx` no renderiza botón en `demo-*`; validado en `ProductCardFavorite.test.tsx` | 2026-09-12 |
| Pruebas unitarias | Todas las pruebas pasan | 10 suites Jest pasando (63 pruebas exitosas) | 2026-09-12 |
| Build y specs | Comprobaciones sin errores | `npm run build` exitoso (27 páginas) y `npm run specs:check` validado | 2026-09-12 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Se utiliza el tipo `favorite_received` en concordancia con `bid_received`. La notificación tiene una ventana de enfriamiento de 1 hora por artículo para evitar spam por toggles intencionados.
- **Riesgos:** Ninguno identificado; cambio aditivo compatible hacia atrás.

## 11. Implementación y trazabilidad

- **Archivos o módulos:**
  - `supabase/migrations/202609120002_favorite_seller_notifications.sql`
  - `src/controllers/marketplace.ts`
  - `src/components/ProductCard.tsx`
  - `src/components/ProductDetailInteractive.tsx`
  - `tests/database/marketplace.sql`
  - `src/components/__tests__/ProductCardFavorite.test.tsx`
- **Migraciones/configuración:** `202609120002_favorite_seller_notifications.sql`
- **Commit o despliegue:** Rama `codex/lp-fix-006-favoritos-vendedor`, PR pendiente.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-12 | `IN_PROGRESS` | Creación de ficha y alcance tras feedback de usuario sobre notificación al vendedor y botón en anuncios propios | Codex |
| 2026-09-12 | `VERIFIED` | Implementación de migración, función lp_set_favorite con notificación al vendedor y ocultación del botón en ProductCard | Codex |
