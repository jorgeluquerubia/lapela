---
id: LP-FEAT-005
type: FEATURE
status: IMPLEMENTED
priority: P2
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/13
related_specs: [LP-FEAT-001]
dependencies: []
cross_cutting_concerns: []
---

# LP-FEAT-005 · Preguntas y respuestas públicas en producto

## 1. Solicitud original

> nueva funcionalidad: necesito que los compradores potenciales puedan hacer preguntas sobre un producto, esas preguntas se incluirán en la pagina de descripcion del propio producto de forma publica, así como las respuestas del vendedor a esas preguntas. Será una sección de preguntas y respuestas. Irán paginadas, maximo 10 preguntas por pagina. El comprador recibirá notificaciones de que tiene preguntas sin responder sobre su producto. En el formulario de hacer la pregunta, el comprador tiene que saber que las preguntas únicamente pueden ir relacionadas con la naturaleza, descripción, estado del producto, etc y nunca con regateos u otra información privada

## 2. Contexto y problema

- **Problema u oportunidad:** Los compradores potenciales necesitan resolver dudas previas a la compra sobre detalles, estado o características de un artículo sin violar el principio básico de La Pela: el precio no se regatea y no hay contacto privado antes del pago. La publicación transparente de preguntas y respuestas enriquece la ficha del artículo y evita preguntas repetidas.
- **Personas afectadas:** Compradores potenciales con dudas sobre un producto y vendedores que necesitan atenderlas públicamente y ser notificados de preguntas pendientes.
- **Impacto actual:** Hasta ahora, el sistema de preguntas previo al pago estaba deshabilitado en la reconstrucción v2 (`PROJECT_CONTEXT.md` sección 5).
- **Evidencia disponible:** Solicitud explícita de usuario y registro histórico en `archive/legacy-api/questions`.

## 3. Resultado esperado

Una sección pública de preguntas y respuestas en `/articulos/[slug]` donde:
- Compradores potenciales pueden enviar preguntas sobre el estado o naturaleza del producto.
- En el formulario se explica de forma clara e ineludible que están prohibidos el regateo y los datos privados de contacto.
- El vendedor puede responder a cada pregunta desde la propia ficha o su espacio de actividad.
- Las preguntas se muestran paginadas (máximo 10 por página).
- El vendedor recibe notificación / avisos visibles de preguntas sin responder sobre sus artículos.

## 4. Alcance

### Incluido

- Tabla `lp_questions` en base de datos con relaciones seguras, integridad referencial y RLS.
- Funciones RPC `lp_ask_question` y `lp_answer_question`.
- Endpoints de backend bajo `/api/market/`:
  - `GET /api/market/questions/:listingId?page=1`
  - `POST /api/market/question/:listingId`
  - `POST /api/market/answer/:questionId`
- Validación de dominio `noContact` y `noBargaining` (bloqueo de regateos, peticiones de descuento o datos de contacto).
- Paginación estricta de 10 preguntas por página en cliente y servidor.
- Componente interactivo y accesible `ProductQA` integrado en la vista de detalle del artículo.
- Notificaciones visibles para el vendedor: contador de preguntas pendientes en anuncio y en *Mi actividad*.
- Notificación para el comprador cuando su pregunta haya sido respondida.

### Excluido

- Envío de correos SMTP externos (pendiente de configuración transversal de infraestructura).
- Modificación o reapertura de chat privado previo al pago (el chat 1-a-1 sigue requiriendo pedido pagado).

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Los usuarios autenticados pueden formular preguntas sobre un artículo disponible o reservado, siempre que no sean el vendedor del artículo.
- `RF-02`: Las preguntas y sus correspondientes respuestas del vendedor se muestran públicamente en la ficha del artículo, ordenadas cronológicamente con paginación de 10 preguntas por página.
- `RF-03`: El vendedor del artículo puede responder a cualquier pregunta formulada en sus anuncios. Solo el vendedor está autorizado a responder.
- `RF-04`: El formulario para formular preguntas debe presentar advertencias visibles e impedir consultas orientadas a regateos de precio o que contengan datos de contacto externo.
- `RF-05`: El vendedor debe visualizar notificaciones o avisos destacados con el número de preguntas pendientes de respuesta en sus anuncios y en *Mi actividad*.
- `RF-06`: El comprador que realizó una pregunta puede ver en su interfaz el estado de su consulta y cuándo ha sido respondida por el vendedor.

### Requisitos no funcionales

- `RNF-01`: La paginación de preguntas en la API y en la interfaz debe estar limitada a un máximo de 10 elementos por solicitud.
- `RNF-02`: La validación y persistencia de preguntas y respuestas debe protegerse frente a inyecciones, spam (límite de tasa de 10 preguntas por hora y usuario) y desbordamientos (longitud entre 5 y 1000 caracteres).
- `RNF-03`: La interfaz debe ser completamente accesible (navegación por teclado, etiquetas ARIA, avisos de error comprensibles y legibles en móvil y escritorio).

### Reglas de negocio

- `RN-01`: El precio no se negocia. Toda pregunta que intente rebajar o negociar el precio será rechazada por validación tanto en cliente como en servidor.
- `RN-02`: No se permite el intercambio de teléfonos, emails, redes sociales ni direcciones externas en preguntas ni respuestas.
- `RN-03`: Un vendedor no puede formular preguntas sobre su propio anuncio.
- `RN-04`: Solo el vendedor propietario del anuncio puede responder a las preguntas asociadas a dicho anuncio.

## 6. Criterios de aceptación

- [x] `AC-01` Dado un usuario autenticado que no es el vendedor, cuando envía una pregunta válida (sin regateos ni datos de contacto), entonces la pregunta se guarda y aparece listada en la sección pública de preguntas del producto.
- [x] `AC-02` Dado un usuario que introduce una pregunta con intentos de regateo (ej. "te doy 20 euros", "rebaja", "haces descuento") o datos de contacto (ej. teléfono o email), cuando intenta enviarla, entonces el sistema la rechaza con un mensaje de error explicativo y no la publica.
- [x] `AC-03` Dado un vendedor con anuncios que tienen preguntas sin responder, cuando accede a su anuncio o a *Mi actividad*, entonces visualiza una notificación o indicador claro de preguntas pendientes de respuesta.
- [x] `AC-04` Dado el vendedor de un artículo, cuando envía una respuesta a una pregunta formulada en su producto, entonces la respuesta se publica asociada a la pregunta con la fecha de respuesta y el comprador puede verla.
- [x] `AC-05` Dado un artículo con más de 10 preguntas, cuando se navega por la sección de preguntas, entonces la interfaz muestra exactamente 10 preguntas por página y permite cambiar de página.
- [x] `AC-06` Dado un usuario anónimo (no autenticado), cuando visualiza la sección de preguntas, puede leer todas las preguntas y respuestas públicas, pero al intentar preguntar se le solicita iniciar sesión.

## 7. Experiencia y estados

- Estados normales: Lista paginada de preguntas con respuestas del vendedor; formulario de pregunta visible para compradores potenciales; botones de respuesta accesibles para el vendedor.
- Estados de error o vacío: Estado vacío informativo ("Aún no hay preguntas sobre este artículo. Si tienes dudas sobre su estado o características, ¡sé el primero en preguntar!"); mensajes de error claros ante datos de contacto o regateos.
- Mensajes y accesibilidad: Aviso normativo en caja destacada; feedback en regiones ARIA al enviar pregunta o respuesta.
- Responsive o canales afectados: Ficha de producto en móvil y escritorio (`/articulos/[slug]`), panel de *Mi actividad* (`/my-products`).

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Tabla `lp_questions` con `id`, `listing_id`, `buyer_id`, `seller_id`, `question`, `answer`, `created_at`, `answered_at`, `seller_notified`, `buyer_notified`.
- **API/integraciones:** Endpoints `/api/market/questions/:id`, `/api/market/question/:id`, `/api/market/answer/:id`.
- **Autorización y privacidad:** RLS habilitado sin permisos directos para `anon` o `authenticated`; todas las mutaciones se controlan vía `service_role` tras verificar identidad con Supabase Auth. El vendedor solo puede responder a sus anuncios; el vendedor no puede preguntarse a sí mismo.
- **Observabilidad y soporte:** Registro de errores estándar en backend con códigos HTTP semánticos (400, 401, 403, 404, 429).
- **Métricas o señales de éxito:** Tasa de preguntas respondidas y reducción de cancelaciones por dudas de producto.
- **Migración/rollback:** Migración SQL reversible en `supabase/migrations/202609060005_product_qa.sql`.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| `npm run specs:check` | Ficha registrada y gobernanza documental correcta | 11 fichas válidas y 22 documentos enlazados | 2026-09-06 |
| Validación de invariantes SQL | Restricciones de auto-pregunta, propiedad de respuesta y RLS verificadas | `tests/database/marketplace.sql` ejecutado con éxito en PostgreSQL remoto | 2026-09-06 |
| Pruebas unitarias de dominio | `noBargaining` y `noContact` bloquean ofertas y datos externos | `rules-qa.test.ts` (4 pruebas unitarias pasadas) | 2026-09-06 |
| Pruebas unitarias de componente | `ProductQA.test.tsx` valida render, avisos, envío y respuesta | `ProductQA.test.tsx` (5 pruebas unitarias pasadas) | 2026-09-06 |
| Build del proyecto (`npm run build`) | Compilación limpia de TypeScript y Next.js | Next.js 15.5 compiló 25 páginas estáticas y rutas dinámicas | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:**
  - Se permite visibilidad pública inmediata de las preguntas realizadas indicando estado "Pendiente de respuesta del vendedor" para dar transparencia y evitar dudas duplicadas.
  - Las notificaciones se presentan in-app en *Mi actividad* y en la ficha del anuncio mediante avisos destacados y contadores de preguntas pendientes.
  - Se implementa validador `noBargaining` en `src/lib/rules.ts` para reforzar activamente el principio "El precio no se negocia".
- **Riesgos y límites:**
  - Posible spam: mitigado con límite de tasa de 10 preguntas por hora y validación de longitud (5 a 1000 caracteres).
- **Preguntas abiertas:**
  - Ninguna bloqueante tras la aprobación del plan de implementación.

## 11. Implementación y trazabilidad

- **Archivos o módulos:**
  - `specs/LP-FEAT-005-preguntas-respuestas-producto.md`
  - `SPEC_REGISTRY.md`
  - `PROJECT_CONTEXT.md`
  - `supabase/migrations/202609060005_product_qa.sql`
  - `src/lib/rules.ts`
  - `src/lib/__tests__/rules-qa.test.ts`
  - `src/controllers/marketplace.ts`
  - `src/components/ProductQA.tsx`
  - `src/components/__tests__/ProductQA.test.tsx`
  - `src/components/ProductDetailInteractive.tsx`
  - `src/app/my-products/page.tsx`
  - `tests/database/marketplace.sql`
- **Migraciones/configuración:** `202609060005_product_qa.sql`
- **Commit o despliegue:** Pendiente de commit y PR
- **Notas de implementación:** Ejecución en rama aislada `gemini/lp-feat-005-product-qa`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `IN_PROGRESS` | Creación de especificación e inicio de implementación | Gemini |
| 2026-09-06 | `IMPLEMENTED` | Implementación local completada; validación de la PR pendiente | Gemini |
