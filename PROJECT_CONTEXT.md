# Contexto canónico de La Pela

> Estado documentado: 2026-09-06. Este es el resumen vigente del producto y su infraestructura. Para cambios y decisiones por solicitud consulta [`SPEC_REGISTRY.md`](SPEC_REGISTRY.md). `ANALISIS_FUNCIONAL.md` es un documento histórico de la versión anterior.

## 1. Descripción del proyecto

La Pela es un marketplace español de productos de segunda mano diseñado para reducir el estrés de vender. El vendedor elige entre un precio cerrado o una subasta. No existen ofertas privadas ni regateos y el comprador no puede contactar con el vendedor antes de formalizar y pagar la operación.

El chat se abre únicamente entre comprador y vendedor cuando el pedido está pagado. Su propósito es coordinar el envío, el seguimiento o la entrega en persona; no renegociar el precio.

La propuesta combina la sencillez de uso de un marketplace móvil con dos mecanismos de venta claros: compra directa y subasta. El portal funciona en móvil y escritorio.

## 2. Estado actual

- **Fase:** beta funcional.
- **Producción:** `https://lapela-nine.vercel.app`.
- **Pagos:** simulados; no se mueve dinero.
- **Datos:** los anuncios activos están separados por entorno `sandbox` o `live`; la beta consulta `sandbox`.
- **Cobros reales:** código preparado para Stripe Connect, pero desactivado hasta configurar la cuenta, el webhook, las condiciones legales y la operación de soporte.
- **Correo:** autenticación por email con confirmación y recuperación; el proyecto todavía usa el proveedor de correo de prueba de Supabase y necesita SMTP propio antes de una apertura pública.

## 3. Principios de producto

1. **El precio no se negocia.** En compra directa es fijo; en subasta cambia solo mediante pujas válidas.
2. **No hay contacto antes del pago.** La conversación existe únicamente dentro de un pedido pagado.
3. **Las operaciones críticas son transaccionales.** Reservas, pujas, pagos y cambios de estado se protegen en PostgreSQL.
4. **La beta no debe confundirse con dinero real.** Los artículos y pagos de prueba se identifican de forma visible y persistente.
5. **Los datos privados no salen del pedido.** Una dirección de envío solo se entrega a las partes autorizadas cuando el estado lo permite.

## 4. Funcionalidades activas

### Exploración y catálogo

- Catálogo responsive con paginación de 12 artículos.
- Rutas semánticas para categorías (`/categoria/[slug]`), subastas (`/subastas`) y fichas de producto con slug descriptivo (`/articulos/[slug]`).
- Redirección 301 de compatibilidad desde rutas históricas `/ad-detail/[slug]`.
- Optimización SEO integral: SSR con `generateMetadata`, Open Graph, Twitter Cards, Schema.org JSON-LD (`Product`, `BreadcrumbList`, `WebSite`), `sitemap.xml` dinámico y `robots.txt`.
- Búsqueda por título y descripción.
- Filtros por categoría, modalidad, rango de precio y ubicación.
- Orden por fecha, precio y próxima finalización de subasta.
- Catálogo de ejemplo como alternativa cuando no hay conexión o resultados.
- Ficha de artículo con fotografías, estado, ubicación, entrega, precio y reglas de compra.
- Rutas semánticas para categorías (`/categoria/:slug`), subastas (`/subastas`) y artículos (`/articulos/:slug-con-id`).
- Metadatos canónicos y sociales, Schema.org, `robots.txt` y sitemap dinámico para indexación.
- Indicador no bloqueante con spinner de marca (moneda de La Pela girando en 3D) durante transiciones asíncronas de catálogo y carga diferida de imágenes en tarjetas.

### Cuenta y autenticación

- Registro mediante email y contraseña con confirmación de correo.
- Inicio y cierre de sesión con sesiones de Supabase.
- Reenvío de confirmación para cuentas pendientes.
- Detección y explicación de un registro repetido de una cuenta existente.
- Recuperación de contraseña desde el acceso y pantalla para guardar la nueva contraseña.

### Publicación y venta

- Publicación de un artículo como precio cerrado o subasta.
- Entre una y seis imágenes JPG, PNG o WebP, de hasta 5 MB por archivo.
- Categoría, estado, ubicación, descripción, modalidad de entrega y gastos de envío.
- Precio entre 1 € y 10.000 €; compra inmediata opcional en subastas por encima de la salida.
- Subastas entre una hora y treinta días.
- Bloqueo de teléfonos, emails, enlaces y referencias a redes o mensajería dentro del anuncio.
- Límite de veinte publicaciones por hora y usuario.
- Retirada de un anuncio disponible si todavía no tiene pujas.

### Compra directa y pedidos

- Diálogo interactivo de confirmación previa con desglose del pedido, advertencia de reserva de 48 horas y aviso de penalización por impago antes de formalizar la compra.
- Reserva atómica del artículo y creación de un único pedido activo.
- Impedimento de comprar el propio artículo.
- Reserva temporal de 48 horas mientras el pago está pendiente (actualizado desde los 31 minutos iniciales).
- Política de compras pública y canónica en `/politica-de-compras` enlazada desde el diálogo de confirmación y el pie de página.
- En beta, confirmación explícita de un pago simulado sin cargo.
- Confirmación de cobro en persona por parte del vendedor (`pay-in-person`), marcando el pedido como completado (`completed`, `payment_mode = 'in_person'`) y el artículo como vendido (`sold`).
- Envío con información de seguimiento o coordinación de recogida.
- Confirmación de recepción por el comprador.
- Estados del modelo de pedido: `pending_payment`, `paid`, `shipped`, `completed`, `cancelled`, `refunded` y `disputed`. Las acciones de usuario actuales cubren pago, envío y recepción; disputa y reembolso todavía requieren operación futura.

### Subastas

- Primera puja igual o superior al precio de salida.
- Incremento mínimo de 1 € a partir de la primera puja.
- Prohibición de pujar por un artículo propio.
- Extensión anti-sniping: una puja en los dos últimos minutos amplía el cierre hasta dos minutos después de esa puja.
- Cierre idempotente: sin pujas, el anuncio expira; con pujas, se crea un pedido para el ganador.
- El ganador dispone de 24 horas para pagar.
- Compra inmediata opcional durante una subasta.

### Conversación y confianza

- Chat privado exclusivo para comprador y vendedor de un pedido activo: se abre desde el momento de la reserva (`pending_payment`) para acordar el método de pago (en persona o por plataforma) y la entrega, manteniéndose durante los estados pagados y posteriores.
- Límite de veinte mensajes por minuto y usuario.
- Preguntas y respuestas públicas en la ficha de producto con paginación de 10 elementos, banner normativo con viñetas claras, validación reforzada contra propuestas económicas, ofertas numéricas o trueques, bloqueo de datos de contacto y notificaciones de preguntas pendientes para el vendedor.
- Seguimiento de compras, ventas, pujas y anuncios en `Mi actividad`.
- Denuncia de anuncios para revisión.

## 5. Funcionalidades no activas o pendientes

- Cobros reales y transferencias a vendedores.
- SMTP de producción y garantías de entrega de correo.
- Seguro de compra o depósito en garantía.
- Regateo, contraofertas o chat libre entre usuarios.
- Reputación, valoraciones y perfiles públicos completos.
- Panel operativo de moderación, disputas y reembolsos.
- Condiciones del servicio, privacidad y proceso de soporte definitivos.
- Entorno de staging separado y observabilidad centralizada.
- Versión de Node.js fijada para desarrollo, CI y Vercel.

Los componentes y endpoints antiguos que sugieran alguna de estas capacidades no definen el producto vigente.

## 6. Arquitectura

La aplicación sigue una separación MVC pragmática dentro de Next.js:

```text
Navegador
  └─ Vistas: src/app + src/components
       ├─ Supabase Auth desde el cliente para sesión, confirmación y recuperación
       └─ API de La Pela
            ├─ Controlador: src/controllers/marketplace.ts
            ├─ Modelo/adaptador: src/models/marketplace.ts
            └─ PostgreSQL: tablas lp_* y funciones RPC transaccionales

Servicios externos
  ├─ Vercel: hosting y ejecución de Next.js
  ├─ Supabase: PostgreSQL, Auth y Storage
  ├─ Stripe: integración preparada, desactivada en beta
  └─ GitHub: repositorio y workflow de Playwright
```

- **Vistas:** App Router en `src/app` y componentes en `src/components`.
- **Controlador:** `src/controllers/marketplace.ts` valida autenticación, entrada, propiedad, entorno y reglas de aplicación.
- **Modelo:** `src/models/marketplace.ts` encapsula el cliente administrativo, el mapeo del catálogo y las RPC.
- **Dominio:** `src/lib/rules.ts` contiene categorías, importes, validación de texto, bloqueo de contacto y autorización de chat.
- **Pagos:** `src/lib/payments.ts` protege la inicialización de Stripe y exige una activación adicional para claves live.
- **Persistencia:** migraciones versionadas en `supabase/migrations`.

## 7. Infraestructura y servicios

| Área | Tecnología | Uso actual |
|---|---|---|
| Frontend y backend web | Next.js 15, React 18, TypeScript | App Router, vistas, middleware y Route Handlers |
| Estilos | Tailwind CSS y CSS global | Layout responsive y sistema visual propio |
| Hosting | Vercel | Despliegue productivo bajo `lapela-nine.vercel.app` |
| Base de datos | PostgreSQL gestionado por Supabase | Catálogo, pujas, pedidos, mensajes, cuentas y denuncias |
| Autenticación | Supabase Auth | Email/contraseña, confirmación, sesión y recuperación |
| Archivos | Supabase Storage | Bucket público `product-images`; las subidas nuevas pasan por el backend |
| Pagos | Stripe SDK y Stripe Connect | Preparado para modo real; beta en simulación |
| Repositorio | GitHub | `github.com/jorgeluquerubia/lapela`, rama principal `main` |
| Gestión del trabajo | GitHub Issues | Una issue por spec, con etiquetas de tipo, prioridad y estado |
| CI | GitHub Actions, validación de specs y Playwright | Los workflows comprueban la trazabilidad documental y el recorrido público principal |
| Pruebas | Jest, Testing Library, Playwright y SQL | La cobertura existente incluye pruebas legacy; el smoke E2E vigente está aislado de servicios externos |

El proyecto Supabase se llama `lapela-app`. Su referencia es `buzmbigpgsrzjrkzidmr`. Esta referencia y la URL pública no son secretos; las claves y tokens sí lo son.

## 8. Entornos

### Producción beta

- URL canónica: `https://lapela-nine.vercel.app`.
- `LAPELA_PAYMENTS_MODE=simulated`.
- Solo muestra anuncios con `environment=sandbox`.
- Las acciones de pago usan `lp_simulate_payment` y nunca Stripe Checkout.

### Desarrollo local

- `npm run dev` usa por defecto el puerto 3000; puede arrancarse en otro puerto. La sesión de reconstrucción ha usado `http://localhost:3011`.
- La configuración de redirect de Supabase permite los puertos 3000 y 3011.
- El build de desarrollo se guarda en `.next-dev`; producción usa `.next`.

### Modo real futuro

- Cualquier valor distinto de `simulated` hace que el controlador trate el entorno como `live`.
- Stripe requiere clave secreta, webhook, cuentas Connect activas y `LAPELA_LIVE_PAYMENTS=true` si la clave es live.
- El cambio no debe hacerse hasta completar la spec correspondiente y los requisitos legales y operativos.

No existe actualmente un staging independiente documentado.

## 9. Variables de entorno

| Variable | Exposición | Propósito |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Clave anónima para Auth y cliente público |
| `SUPABASE_SERVICE_ROLE_KEY` | Secreta, solo servidor | Acceso administrativo desde modelos y controladores |
| `LAPELA_PAYMENTS_MODE` | Servidor | `simulated` mantiene la beta en sandbox |
| `APP_URL` | Servidor | Origen canónico para redirects de Stripe y validación de origen |
| `STRIPE_SECRET_KEY` | Secreta, solo servidor | API de Stripe; no requerida en modo simulado |
| `STRIPE_WEBHOOK_SECRET` | Secreta, solo servidor | Verificación de firmas del webhook Stripe |
| `LAPELA_LIVE_PAYMENTS` | Servidor | Guardia adicional: debe ser `true` para aceptar una clave Stripe live |

Las claves secretas no deben usar el prefijo `NEXT_PUBLIC_`, aparecer en specs, imprimirse en logs ni llegar al navegador.

## 10. Datos y seguridad

### Tablas activas

- `lp_listings`: anuncios, modalidad, precio, entrega, entorno y estado.
- `lp_bids`: historial de pujas.
- `lp_orders`: comprador, vendedor, importe, pago, dirección, seguimiento y estado.
- `lp_messages`: conversación ligada al pedido.
- `lp_questions`: preguntas y respuestas públicas del producto y estado de notificación.
- `lp_accounts`: cuenta Stripe Connect del vendedor.
- `lp_reports`: denuncias de anuncios o pedidos.
- `lp_payment_events`: idempotencia de eventos Stripe.

### Funciones transaccionales

- `lp_bid`: valida y registra una puja bajo bloqueo de fila.
- `lp_reserve`: crea una reserva única y evita la autocompra y la doble venta.
- `lp_close_auctions`: cierra subastas y adjudica al mejor postor.
- `lp_confirm_payment`: valida evento, sesión, importe e idempotencia de Stripe.
- `lp_simulate_payment`: confirma únicamente pedidos sandbox del comprador.
- `lp_confirm_in_person_payment`: permite al vendedor confirmar el cobro recibido en persona, completando el pedido y vendiendo el artículo.
- `lp_transition`: controla envío y recepción según actor y estado.
- `lp_release`: cancela reservas caducadas y libera el anuncio.
- `lp_send_message`: autoriza chat solo entre las partes durante la reserva o tras el pago.
- `lp_ask_question`: valida y registra una pregunta pública impidiendo la auto-pregunta del vendedor.
- `lp_answer_question`: autoriza únicamente al vendedor para publicar la respuesta oficial.

Las tablas `lp_*` tienen RLS activado, pero `anon` y `authenticated` no tienen acceso directo. Las operaciones pasan por el backend con `service_role`, que valida al usuario mediante Supabase Auth. El middleware devuelve HTTP 410 para mutaciones legacy. `next.config.mjs` añade cabeceras de seguridad contra sniffing, framing y permisos de cámara, micrófono y geolocalización.

El bucket `product-images` es público porque contiene fotografías de anuncios. La subida v2 comprueba autenticación, propietario, MIME, firma del archivo, tamaño y ruta.

## 11. API activa

| Método y ruta | Acceso | Función |
|---|---|---|
| `GET /api/products` | Público | Catálogo filtrado del entorno activo |
| `GET /api/market/listing/:id` | Público | Detalle seguro del anuncio |
| `GET /api/market/questions/:id` | Público | Preguntas y respuestas paginadas (10 por página) |
| `GET /api/market/activity` | Autenticado | Compras, ventas, pujas, anuncios y preguntas pendientes |
| `GET /api/market/order/:id` | Partes del pedido | Pedido, mensajes y datos autorizados |
| `POST /api/market/upload` | Autenticado | Subir una fotografía validada |
| `POST /api/market/publish` | Autenticado | Crear un anuncio |
| `POST /api/market/bid/:id` | Autenticado | Registrar una puja |
| `POST /api/market/question/:id` | Comprador potencial | Formular pregunta pública sin regateos ni datos privados |
| `POST /api/market/answer/:id` | Vendedor del artículo | Responder públicamente a una pregunta |
| `POST /api/market/checkout/:id` | Comprador | Reservar o continuar un pago |
| `POST /api/market/simulate-payment/:id` | Comprador, sandbox | Confirmar pago simulado |
| `POST /api/market/pay-in-person/:id` | Vendedor | Confirmar cobro en persona y completar pedido |
| `POST /api/market/message/:id` | Partes, pedido en reserva o pagado | Enviar mensaje sobre la entrega o pago |
| `POST /api/market/ship/:id` | Vendedor | Marcar envío o entrega preparada |
| `POST /api/market/complete/:id` | Comprador | Confirmar recepción |
| `POST /api/market/withdraw/:id` | Vendedor | Retirar anuncio disponible sin pujas |
| `POST /api/market/report/:id` | Autenticado | Denunciar un anuncio |
| `POST /api/market/onboard` | Vendedor, modo real | Iniciar onboarding de Stripe Connect |
| `POST /api/stripe/webhook` | Stripe firmado | Confirmar pagos reales de forma idempotente |


Las rutas antiguas bajo `/api/bids`, `/api/messages`, `/api/orders`, `/api/questions`, mutaciones de `/api/products` y equivalentes se conservan para referencia o compatibilidad controlada, pero las mutaciones responden HTTP 410. Su código archivado está en `archive/legacy-api`.

## 12. Operación automática

El mantenimiento actual es oportunista: al consultar catálogo o detalle, el backend intenta cerrar subastas vencidas y liberar reservas caducadas. No existe todavía un cron de producción documentado que garantice el cierre en un instante exacto sin tráfico.

Para una reserva con sesión Stripe real, el backend comprueba el estado de Checkout antes de liberarla. En sandbox no existe esa dependencia.

No hay todavía un panel de administración, alertas centralizadas, métricas de producto ni un procedimiento operativo completo para disputas.

## 13. Validación y estado de pruebas

- `npm run build` es la comprobación fiable actual de compilación, lint y tipos.
- `tests/database/marketplace.sql` valida propiedad, reservas, importe, idempotencia, chat, transiciones, pujas, expiración, anti-sniping, cierre y privilegios; se ejecutó satisfactoriamente el 2026-09-06.
- Existen suites Jest creadas para la versión anterior. Parte de ellas todavía espera textos, componentes y endpoints legacy, por lo que el conjunto completo no representa fielmente la aplicación reconstruida.
- El workflow de GitHub ejecuta un smoke test Playwright vigente en push y pull request. Usa datos de demostración y valores sintéticos de Supabase, por lo que valida el arranque y la navegación pública sin acceder a producción. Aún no cubre autenticación, persistencia, publicación, compra ni pagos.
- La producción beta y sus rutas principales se comprobaron mediante build, peticiones HTTP y revisión visual en navegador.

## 14. Mapa rápido del repositorio

| Ruta | Responsabilidad |
|---|---|
| `src/app` | Páginas, layouts y Route Handlers de Next.js |
| `src/components` | Componentes de interfaz |
| `src/controllers` | Casos de uso y validación de peticiones |
| `src/models` | Acceso administrativo a Supabase y RPC |
| `src/lib` | Reglas de dominio, API cliente y pagos |
| `src/context` | Sesión de autenticación en cliente |
| `supabase/migrations` | Esquema, permisos y funciones transaccionales |
| `tests/database` | Invariantes de base de datos |
| `archive/legacy-api` | Implementación antigua, solo referencia |
| `specs` | Una ficha por solicitud de producto o técnica |
| `SPEC_REGISTRY.md` | Índice y estado de las specs |
| `.env.example` | Inventario seguro de configuración local y de despliegue |
| `tools/validate-specs.mjs` | Validador automático del registro, fichas y enlaces documentales |
| `.github/ISSUE_TEMPLATE/spec.yml` | Formulario manual para crear una issue vinculada a una spec |

Las utilidades SEO y de slugs viven en `src/lib/slugs.ts` y `src/lib/seo.ts`. Las antiguas URLs `/ad-detail/:slug` redirigen a la ruta canónica del artículo. Las páginas privadas y transaccionales declaran `noindex, nofollow`, y `robots.txt` bloquea también su rastreo.

## 15. Jerarquía documental

1. [`AGENTS.md`](AGENTS.md): instrucciones obligatorias para una IA que empieza a trabajar.
2. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md): estado vigente del producto y la infraestructura.
3. [`SPEC_REGISTRY.md`](SPEC_REGISTRY.md): solicitudes, decisiones, prioridades y estado.
4. [`specs/`](specs/): detalle y criterios de cada solicitud.
   La guía [`specs/REQUIREMENTS_GUIDE.md`](specs/REQUIREMENTS_GUIDE.md) separa RF, RNF y reglas de negocio del tipo de trabajo.
5. [`README.md`](README.md): introducción y arranque rápido.
6. [`ANALISIS_FUNCIONAL.md`](ANALISIS_FUNCIONAL.md): análisis histórico de la versión anterior; no es fuente de verdad actual.

Cuando una spec cambia una capacidad, servicio, variable, ruta, estado o limitación transversal, el mismo cambio debe actualizar este documento.

La gobernanza documental se comprueba localmente con `npm run specs:check` y en GitHub Actions. El control de cambios de CI exige que una modificación de implementación actualice al menos una ficha y `SPEC_REGISTRY.md`; la decisión de actualizar este contexto se toma aplicando la regla transversal anterior.

## 16. Seguimiento operativo del trabajo

Cada solicitud que requiere una spec tiene una GitHub Issue en `github.com/jorgeluquerubia/lapela/issues`. La ficha contiene el enlace en `github_issue`. Se usan etiquetas `type:*`, `priority:*` y `status:*`; una issue permanece abierta mientras haya trabajo y se cierra cuando la ficha pasa a `VERIFIED` o `CANCELLED`.

La spec continúa siendo la fuente de verdad para requisitos, criterios de aceptación, decisiones y validación. GitHub Issues aporta la vista operativa y no debe contener una copia independiente de toda la ficha.

## 17. Ramas y concurrencia entre agentes

`main` contiene únicamente trabajo integrado. Cada spec se implementa en una rama `<agente>/<id-de-spec-en-minúsculas>-<slug>` creada desde `origin/main`, por ejemplo `codex/lp-infra-003-agent-branches`. Cuando hay varios agentes, cada uno usa además un Git worktree diferente; compartir directorio aunque se usen ramas distintas no se considera aislamiento.

La ubicación canónica es `<raíz-de-la-pela>/.worktrees/<id-de-spec-en-minúsculas>`. Está dentro del workspace autorizado para evitar peticiones repetidas de permisos y `/.worktrees/` está excluido en `.gitignore`. No deben crearse nuevos worktrees en la antigua carpeta hermana `lapela-next-worktrees`. Los existentes allí se conservan solamente hasta que termine la tarea asociada y después pueden retirarse con `git worktree remove`.

La entrega se integra mediante pull request. La PR enlaza la spec y la issue, contiene la evidencia de validación e indica si cambió este contexto. El workflow de gobernanza valida el nombre de la rama y que su ID corresponda a una spec registrada. La issue permanece abierta hasta la integración en `main`.
