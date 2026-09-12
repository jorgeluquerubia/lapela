---
id: LP-FEAT-019
type: FEATURE
status: VERIFIED
priority: P2
requested_at: 2026-09-12
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/48
related_specs: [LP-FEAT-001, LP-FEAT-010, LP-FEAT-011, LP-FEAT-015]
dependencies: []
cross_cutting_concerns: [subastas, operación, moderación, marketing]
---

# LP-FEAT-019 · Subastas destacadas y coordinadas

## 1. Solicitud original

> Crear subastas destacadas y coordinadas, como `La Subasta de la Pela`, con una selección semanal, cierre concentrado y cuenta atrás para convertir la subasta en un acontecimiento recurrente.

## 2. Contexto y problema

- **Problema u oportunidad:** La mecánica de subasta existe, pero cada anuncio cierra de forma aislada y no hay una superficie que concentre demanda o explique por qué una selección merece atención.
- **Personas afectadas:** Vendedores de artículos singulares, pujadores y operación editorial de La Pela.
- **Impacto actual:** En un marketplace con liquidez inicial limitada, repartir la atención reduce la probabilidad de competencia entre pujadores y la subasta se percibe como un filtro más.
- **Evidencia disponible:** El sistema ya soporta pujas transaccionales, cuenta atrás, cierre idempotente y anti-sniping; falta la capa editorial y operativa.

## 3. Resultado esperado

Operación puede agrupar un número limitado de subastas elegibles en una edición con nombre, ventana y estado. La portada y `/subastas` destacan la edición activa, muestran sus artículos y una cuenta atrás coherente, sin alterar las reglas económicas ni adjudicar manualmente ganadores.

## 4. Alcance

### Incluido

- Entidad de edición editorial con título, descripción breve, inicio, cierre de referencia, estado e imagen opcional.
- Asociación explícita de subastas a una edición por personal autorizado.
- Bloque en portada y sección prioritaria en `/subastas` con distintivo `Subasta de la Pela`.
- Cuenta atrás, número de artículos y estados `próximamente`, `en curso` y `finalizada`.
- Criterios de elegibilidad: anuncio disponible, modalidad subasta y cierre compatible con la edición.
- Proceso operativo documentado para seleccionar, revisar, publicar y cerrar una edición.

### Excluido

- Cambiar incrementos, reservas, compra inmediata, anti-sniping, ganador o plazo de pago.
- Obligar a todos los artículos de una edición a finalizar en el mismo segundo.
- Puja en directo por vídeo, streaming o moderador.
- Pago por aparecer destacado en la primera versión.
- Panel general de administración o campañas automáticas externas.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Operación debe poder crear una edición, asignarle fechas y asociar únicamente subastas elegibles.
- `RF-02`: Portada y página de subastas deben mostrar la edición activa o próxima con su selección y estado temporal.
- `RF-03`: Cada anuncio asociado debe mostrar un distintivo y enlace a la edición mientras esta sea visible.
- `RF-04`: La cuenta atrás de cada artículo debe usar su `ends_at` vigente; la cuenta de la edición es informativa y usa su ventana editorial.
- `RF-05`: Una edición finalizada debe conservar una página de resultados sin acciones de puja sobre anuncios cerrados.
- `RF-06`: Retirar una asociación editorial no debe retirar ni modificar el anuncio subyacente.

### Requisitos no funcionales

- `RNF-01`: La selección y publicación deben requerir autorización operativa y no estar disponibles para usuarios ordinarios.
- `RNF-02`: Las consultas de portada y subastas deben evitar una consulta adicional por cada artículo asociado.
- `RNF-03`: Cuenta atrás y estados deben tener alternativa textual accesible y funcionar sin animaciones continuas obligatorias.

### Reglas de negocio

- `RN-01`: Solo una subasta disponible puede incorporarse a una edición próxima o activa.
- `RN-02`: La edición nunca modifica el precio, las pujas, el ganador ni la regla anti-sniping.
- `RN-03`: Si anti-sniping amplía un artículo, prevalece su cierre real aunque supere la ventana editorial.
- `RN-04`: La selección es editorial y gratuita durante el piloto; no implica garantía de venta ni número de pujas.
- `RN-05`: Un artículo retirado, expirado o inválido desaparece de la selección activa sin romper la edición.

## 6. Criterios de aceptación

- [x] `AC-01` Operación crea una edición próxima, añade subastas elegibles y no puede añadir anuncios de precio cerrado, propios del entorno incorrecto o ya finalizados.
- [x] `AC-02` La portada y `/subastas` presentan una edición activa con título, explicación, cuenta atrás y selección consistente.
- [x] `AC-03` Cada artículo conserva su cierre real y las reglas de puja, compra inmediata y anti-sniping existentes.
- [x] `AC-04` Una ampliación anti-sniping actualiza la cuenta atrás del artículo sin alterar ni reabrir artificialmente la edición.
- [x] `AC-05` Tras finalizar, la edición muestra resultados disponibles y elimina acciones imposibles; los artículos sin venta reflejan su estado real.
- [x] `AC-06` Usuarios no autorizados no pueden crear, editar ni asociar ediciones.
- [x] `AC-07` Pruebas de elegibilidad, autorización, estados temporales, responsive y consultas, además del build y `npm run specs:check`, terminan correctamente.

## 7. Experiencia y estados

- **Estados normales:** Hero editorial contenido, selección limitada, cuenta atrás textual y distintivos coherentes con La Pela.
- **Estados de error o vacío:** Sin edición activa se mantiene la página general de subastas; una edición sin artículos no se publica.
- **Mensajes y accesibilidad:** Fechas absolutas además de cuenta atrás; anuncios de cambios relevantes sin refresco agresivo.
- **Responsive o canales afectados:** Portada, listado de subastas, ficha y página de edición en móvil y escritorio.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Ediciones y relación con anuncios, con integridad referencial y estados derivados o validados.
- **API/integraciones:** Lectura pública de edición vigente; mutaciones solo mediante operación autenticada y autorizada.
- **Autorización y privacidad:** Rol operativo explícito; ninguna capacidad se deriva de ser vendedor de un artículo.
- **Observabilidad y soporte:** Registro de altas, asociaciones y cambios de estado; alerta si una edición publicada queda sin artículos.
- **Métricas o señales de éxito:** Pujadores por subasta, porcentaje con dos o más pujadores, conversión a pago y comparación con subastas no destacadas.
- **Migración/rollback:** Tablas aditivas; ocultar superficies editoriales devuelve la navegación general sin afectar subastas.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Elegibilidad y autorización | Solo operación y subastas válidas | `src/lib/__tests__/featured-auctions.test.ts` valida rechazo de compra directa, estado no disponible, entorno dispar, subastas pasadas y comprobación de rol de operador (`AC-01`, `AC-06`) | 2026-09-12 |
| Reglas transaccionales | Sin cambios en puja o cierre | Comprobado que el motor `lp_bid` y anti-sniping opera sobre `listing.ends_at` sin alterar `reference_ends_at` de la edición (`AC-03`) | 2026-09-12 |
| Estados temporales | Próxima, activa y finalizada correctas | `getEditionTemporalStatus` probado con fechas relativas y ventana anti-sniping (`AC-04`). `FeaturedAuctionSection.test.tsx` valida renderizado en activo y próximo | 2026-09-12 |
| Rendimiento y responsive | Selección usable sin N+1 | Consultas en `getCurrentFeaturedEdition` resueltas mediante join sobre `lp_auction_edition_items` y carga por lote con `profilesById` (`RNF-02`) | 2026-09-12 |
| Build y specs | Comprobaciones sin errores | `npm run specs:check` (27 fichas y 38 docs enlazados) y `npm run build` completado con salida HTTP 200/código 0 | 2026-09-12 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Piloto gratuito y curado; edición editorial separada de los cierres reales; sin construir un panel administrativo general.
- **Riesgos y límites:** Una selección sin demanda puede hacer visible la baja liquidez. La operación deberá limitar artículos y acompañar cada edición con captación.
- **Preguntas abiertas:** Ninguna bloqueante para el piloto.

## 11. Implementación y trazabilidad

- **Archivos o módulos:**
  - Migración: `supabase/migrations/202609120001_featured_auctions.sql`.
  - Dominio: `src/lib/featured-auctions.ts` (elegibilidad, estados temporales, formato de cuenta atrás, autorización de operador).
  - Tipos: `src/types/index.ts` (`AuctionEdition`, `AuctionEditionItem`, `Product.featuredEdition`).
  - Modelos: `src/models/marketplace.ts` (`getCurrentFeaturedEdition`, `getAuctionEditionBySlug`, `card`, `getListingByIdOrSlug`).
  - Controlador: `src/controllers/marketplace.ts` (`GET featured-edition`, `GET/POST auction-edition`).
  - Vistas y componentes: `src/components/FeaturedAuctionSection.tsx`, `src/components/Catalog.tsx`, `src/components/ProductCard.tsx`, `src/components/ProductDetailInteractive.tsx`, `src/app/subastas/ediciones/[slug]/page.tsx`, `src/app/globals.css`.
  - Pruebas: `src/lib/__tests__/featured-auctions.test.ts`, `src/components/__tests__/FeaturedAuctionSection.test.tsx`, `src/components/__tests__/ProductCard.test.tsx`, `src/components/__tests__/ProductDetailInteractive.test.tsx`.
- **Migraciones/configuración:** Tablas `lp_operators`, `lp_auction_editions` y `lp_auction_edition_items`.
- **Commit o despliegue:** Pendiente de commit en rama `codex/lp-feat-019-subastas-destacadas`.
- **Notas de implementación:** El motor de cierre idempotente existente y la regla anti-sniping no se duplican; la ventana editorial es una referencia informativa.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-12 | `READY` | Ficha e issue creadas; alcance preparado sin implementación | Codex |
| 2026-09-12 | `IN_PROGRESS` | Sincronización con main y comienzo de implementación | Gemini |
| 2026-09-12 | `VERIFIED` | Implementación completa de base de datos, API, vistas, reglas y pruebas validadas | Gemini |

