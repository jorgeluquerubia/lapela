---
id: LP-FEAT-013
type: FEATURE
status: VERIFIED
priority: P1
requested_at: 2026-09-11
requested_by: usuario
source: conversación
owner: gemini
github_issue: https://github.com/jorgeluquerubia/lapela/issues/36
related_specs: [LP-FEAT-001, LP-FEAT-005, LP-FEAT-010, LP-FEAT-011]
dependencies: []
cross_cutting_concerns: [privacidad, autorización, base de datos, SEO]
---

# LP-FEAT-013 · Identidad pública, perfiles y valoraciones

## 1. Solicitud original

> Deberíamos mostrar el nombre del usuario en diferentes sitios de la página para saber qué usuario vende cada cosa, quién lo ha comprado y quién ha pujado. Además, al pulsar un nombre de usuario se debe acceder a un dashboard de usuario con su actividad (compras, ventas y valoraciones), y se debe poder incluir un alias en la personalización del usuario.

## 2. Contexto y problema

- **Problema u oportunidad:** La versión vigente solo conserva UUID internos para vendedores, compradores y pujadores. La interfaz no presenta una identidad pública estable ni permite evaluar la actividad de una persona.
- **Personas afectadas:** Visitantes, compradores, vendedores y pujadores.
- **Impacto actual:** Es difícil atribuir un anuncio, comprobar el historial comercial visible o generar confianza tras completar un trato.
- **Evidencia disponible:** `lp_listings`, `lp_orders` y `lp_bids` contienen los actores, pero no existe una tabla `lp_profiles` activa; la ruta histórica de perfil público es informativa.

## 3. Resultado esperado

Cada cuenta dispone de un alias público único y estable. Los anuncios, pujas, pedidos, mensajes y actividad privada identifican a la persona pertinente mediante ese alias enlazado. Un perfil público muestra anuncios activos, ventas completadas, compras solo si la persona decide hacerlas públicas y valoraciones recibidas. Las partes de un pedido completado pueden valorarse mutuamente una sola vez.

## 4. Alcance

### Incluido

- Alias público personalizable y opción para publicar u ocultar el historial de compras.
- Perfiles públicos no indexables en `/usuarios/[alias]`.
- Alias enlazado en catálogo, ficha del anuncio, historial de pujas, pedido, chat y Mi actividad.
- Valoraciones de una a cinco estrellas, con comentario breve opcional, después de completar un pedido.
- Migración segura de las cuentas existentes con alias temporal no derivado del email.

### Excluido

- Chat, preguntas, seguidores o contactos públicos entre perfiles.
- Publicar emails, direcciones, teléfonos, identificadores internos, información de Stripe o compras/pujas de terceros por defecto.
- Moderación operativa completa, respuesta a denuncias o eliminación de valoraciones.
- Avatares y cambio libre de alias tras haber sido fijado.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: El sistema debe asignar a cada cuenta un alias público único y permitirle personalizarlo desde Mi cuenta.
- `RF-02`: El catálogo, la ficha de producto y el historial de pujas deben mostrar aliases enlazados sin entregar UUIDs ni datos de contacto.
- `RF-03`: Las partes de un pedido deben ver el alias de su contraparte en el pedido, en Mi actividad y en los mensajes.
- `RF-04`: Un perfil público debe mostrar anuncios disponibles, ventas completadas, puntuación y valoraciones recibidas; las compras solo cuando la persona active expresamente esa visibilidad.
- `RF-05`: Cada parte de un pedido completado debe poder publicar una valoración para la contraparte, una única vez.

### Requisitos no funcionales

- `RNF-01`: Las respuestas públicas no deben incluir email, dirección, teléfono, ID de Auth, IDs de comprador/pujador ni datos de pago.
- `RNF-02`: La validación de alias y valoraciones se realiza en servidor y las escrituras pasan por el backend y las RPC de `lp_*`.
- `RNF-03`: El perfil público debe declararse `noindex` y conservar navegación funcional en móvil y escritorio.

### Reglas de negocio

- `RN-01`: El alias usa de 3 a 30 caracteres en minúscula, letras ASCII, números, guion o guion bajo; es único y no se deriva del email.
- `RN-02`: Las pujas muestran el alias, importe y fecha, pero nunca la identidad técnica de quien puja.
- `RN-03`: La identidad de comprador se muestra únicamente a las partes autorizadas de su pedido; no se publica en el anuncio vendido.
- `RN-04`: Solo un pedido en estado `completed` habilita una valoración, y la contraparte se deriva del pedido en la base de datos.
- `RN-05`: El historial de compras es privado salvo que su titular active `show_purchases`.

## 6. Criterios de aceptación

- [x] `AC-01` Una cuenta existente o nueva tiene un alias público único, y puede personalizarlo desde Mi cuenta con validación de formato y colisión.
- [x] `AC-02` Las tarjetas y la ficha de un anuncio muestran y enlazan el alias del vendedor; una subasta muestra aliases, importes y fechas de sus últimas pujas.
- [x] `AC-03` El detalle del pedido, Mi actividad y el chat muestran los aliases de las contrapartes solo a sus partes autorizadas.
- [x] `AC-04` `/usuarios/[alias]` presenta anuncios activos, total de ventas completadas y valoraciones; no expone campos privados ni se indexa.
- [x] `AC-05` El historial de compras no se expone hasta activar su visibilidad desde Mi cuenta.
- [x] `AC-06` Tras completar un pedido, cada parte puede enviar una única valoración de 1 a 5 estrellas con comentario opcional; no puede valorar otro pedido, a sí misma ni repetir la valoración.
- [x] `AC-07` La compilación, pruebas relevantes y `npm run specs:check` concluyen satisfactoriamente.

## 7. Experiencia y estados

- **Estados normales:** Alias temporal legible hasta personalizarlo; perfil con estado vacío si no hay anuncios o valoraciones; formulario de valoración disponible cuando procede.
- **Estados de error o vacío:** Alias ocupado o inválido, perfil no encontrado, intento de valorar un pedido no elegible y ausencia de actividad pública.
- **Mensajes y accesibilidad:** Enlaces con texto de alias, formularios con etiquetas, mensajes de error con `role="alert"` y estados con `role="status"`.
- **Responsive o canales afectados:** Catálogo, ficha, pedido, actividad, cuenta y perfil público deben conservar una lectura útil en pantallas pequeñas.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Nuevas tablas `lp_profiles` y `lp_reviews`, migración de participantes existentes e índices de consulta.
- **API/integraciones:** `GET /api/market/profile/:alias`, `GET /api/market/profile/me`, `POST /api/market/profile` y `POST /api/market/review/:orderId`; los endpoints existentes incorporan solo proyecciones públicas autorizadas.
- **Autorización y privacidad:** El backend resuelve aliases desde `lp_profiles`; la RPC de valoración deriva destinatario y valida el estado del pedido bajo bloqueo.
- **Observabilidad y soporte:** Los errores devuelven mensajes de dominio; la corrección de un alias fijado queda en soporte hasta disponer de una política de cambios.
- **Métricas o señales de éxito:** Número de perfiles personalizados y de pedidos completados con valoración, sin aumentar exposición de datos privados.
- **Migración/rollback:** La migración es aditiva; los aliases temporales garantizan enlaces para datos existentes. El rollback de la interfaz no elimina perfiles ni valoraciones ya registradas.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Migración SQL | Restricciones de alias, privacidad y valoración válidas | `tests/database/marketplace.sql` ejecutado contra Supabase con resultado `PASS: ownership, public profile aliases, reviews, ...` | 2026-09-12 |
| Pruebas unitarias | Normalización de alias, límites y proyección sin UUID | `src/lib/__tests__/public-profiles.test.ts` (12 pruebas correctas) | 2026-09-12 |
| Componentes y vistas | Renderizado de perfil, personalización de cuenta y valoraciones | `src/app/usuarios/[alias]/__tests__/page.test.tsx` (7 pruebas), `src/app/user-profile/__tests__/profile-alias.test.tsx` (5 pruebas), `src/app/orders/[id]/__tests__/order-review.test.tsx` (3 pruebas), `src/app/orders/[id]/__tests__/Order.test.tsx` (2 pruebas), `ProductCard` y `ProductDetailInteractive` (15 pruebas). Total: 7 suites, 32 pruebas correctas | 2026-09-12 |
| Tipos | Tipos TypeScript correctos | `npx tsc --noEmit` correcto sin errores | 2026-09-12 |
| Build | Compilación correcta de producción | `npm run build` completado exitosamente (26 rutas) | 2026-09-12 |
| Validación de specs | Registro, ficha y enlaces coherentes | `npm run specs:check -- --branch-name gemini/lp-feat-013-public-profiles-reviews` correcto (25 fichas, 36 documentos) | 2026-09-12 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Los perfiles son públicos pero no indexables; las compras son privadas por defecto; el comprador no se publica en los anuncios; el alias queda fijado tras personalizarse.
- **Riesgos y límites:** Un alias puede ser reconocible fuera de la plataforma; se limita mediante un formato sin contacto y no se habilita mensajería pública. La moderación de comentarios requerirá una ficha posterior.
- **Preguntas abiertas:** La futura política de cambio de alias y moderación/ocultación de valoraciones necesita definición operativa.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** Modelo, controlador, componentes de catálogo/ficha/pedido/cuenta/actividad, ruta de perfiles, estilos y pruebas.
- **Migraciones/configuración:** Nueva migración aditiva de perfiles y valoraciones (`202609110001_public_profiles_reviews.sql`), aplicada y comprobada en Supabase.
- **Commit o despliegue:** Rama `gemini/lp-feat-013-public-profiles-reviews`.
- **Notas de implementación:** Se preservan las reglas de chat y no contacto existentes; el alias no abre ningún canal de comunicación.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-11 | `IN_PROGRESS` | Creación de ficha e issue #36 | Codex |
| 2026-09-11 | `IMPLEMENTED` | Implementación lista; falta aplicar migración y validar en un entorno con Supabase | Codex |
| 2026-09-11 | `IMPLEMENTED` | PR #42 abierta para revisión | Codex |
| 2026-09-12 | `VERIFIED` | Verificación completa de base de datos en Supabase, suites de tests automatizados de UI y perfiles, robustecimiento de página de pedidos y compilación de producción | Gemini |
