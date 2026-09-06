---
id: LP-FEAT-001
type: FEATURE
status: VERIFIED
priority: P1
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
related_specs: [LP-FEAT-002]
dependencies: [Supabase, Vercel]
cross_cutting_concerns: [SECURITY, OPS]
---

# LP-FEAT-001 · Reconstrucción del marketplace sin regateos

## 1. Solicitud original

> Rehacer La Pela como un marketplace profesional, sencillo en móvil y ordenador, sin regateos ni contacto antes de formalizar una venta, con compra directa o puja según configure el vendedor.

## 2. Contexto y problema

Los marketplaces de segunda mano usados como referencia generan ofertas absurdas, conversaciones de negociación y fricción para vender. La Pela debe combinar la sencillez de un catálogo de segunda mano con la claridad de las subastas de eBay.

## 3. Resultado esperado

Una persona puede explorar, comprar a precio cerrado o pujar con reglas visibles; el vendedor puede publicar sin negociar; la conversación sobre entrega solo aparece después del pago confirmado.

## 4. Alcance

### Incluido

- Catálogo responsive con búsqueda, categorías, precios, ubicación y filtro de subastas.
- Anuncios de precio cerrado y subasta, con compra inmediata opcional.
- Publicación de artículos con fotografías y validación de datos de contacto.
- Reserva atómica, pedidos, envío/recogida, recepción, incidencias y actividad.
- Chat privado ligado a un pedido pagado.
- Reglas anti-regateo, anti-sniping y protección de propiedad del anuncio.

### Excluido

- Negociación privada o publicación de teléfonos, redes, enlaces o direcciones exactas.
- Cobros reales en la beta; se especifican en `LP-FEAT-002`.
- Seguro, depósito en garantía y operación legal definitiva antes de la apertura pública.

## 5. Requisitos y reglas de negocio

- `REQ-01`: El precio visible es el precio de compra; no hay ofertas privadas.
- `REQ-02`: Una subasta muestra precio de salida, pujas, cierre y compra inmediata si existe.
- `RULE-01`: Una puja válida supera la actual en al menos 1 €; los últimos dos minutos amplían el cierre otros dos minutos.
- `RULE-02`: El chat solo se habilita cuando el pago está confirmado.
- `RULE-03`: El vendedor no puede retirar ni modificar una subasta con pujas.

## 6. Criterios de aceptación

- [x] `AC-01` El catálogo permite distinguir compra directa y subasta en móvil y escritorio.
- [x] `AC-02` Un anuncio de precio cerrado no ofrece controles ni textos de regateo.
- [x] `AC-03` Una reserva concurrente no crea más de un pedido activo para el artículo.
- [x] `AC-04` Una puja inválida se rechaza y una puja válida actualiza el importe de forma atómica.
- [x] `AC-05` El chat permanece cerrado antes del pago y se habilita para comprador y vendedor después.
- [x] `AC-06` Los endpoints legacy de compra, pujas, preguntas y mensajería no pueden saltarse estas reglas.

## 7. Experiencia y estados

- Estados de anuncio: disponible, reservado, vendido, finalizado, retirado.
- Estados de pedido: pendiente de pago, pagado, enviado, completado, cancelado, disputado y reembolsado.
- La beta muestra de forma persistente que los pagos son simulados.
- La interfaz es responsive y mantiene navegación, foco visible y mensajes de error legibles.

## 8. Datos, API, seguridad y operación

- Tablas nuevas `lp_listings`, `lp_bids`, `lp_orders`, `lp_messages`, `lp_accounts`, `lp_reports` y `lp_payment_events`.
- Funciones PostgreSQL para pujas, reservas, confirmación de pago, transiciones, liberación y chat.
- El acceso a datos de marketplace pasa por el backend con service role; las mutaciones comprueban identidad y propiedad.
- Los cambios críticos usan bloqueo de fila e idempotencia.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| `npm run build` | Compilación, lint y tipos correctos | Build local y Vercel | 2026-09-06 |
| Invariantes SQL | Reserva, pagos, chat, pujas y transiciones protegidos | `tests/database/marketplace.sql` aplicado y aprobado | 2026-09-06 |
| Smoke test publicado | Catálogo, subastas y legacy lockdown responden correctamente | `curl` contra `lapela-nine.vercel.app` | 2026-09-06 |
| Revisión visual | Catálogo y navegación visibles en navegador | Comprobación CUA en Vercel | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** La beta usa datos de prueba y pagos simulados.
- **Riesgo:** Antes de cobros reales faltan Stripe Connect, condiciones, privacidad, soporte e incidencias.
- **Pregunta abierta:** Definir operación de disputas, comisiones y políticas de vendedores antes de abrir al público.

## 11. Implementación y trazabilidad

- `src/controllers/marketplace.ts`, `src/models/marketplace.ts`, `src/lib/rules.ts`, `src/app`, `src/components`.
- `supabase/migrations/202609060001_marketplace.sql` y migraciones de bloqueo/simulación.
- Despliegue productivo `https://lapela-nine.vercel.app`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `VERIFIED` | Reconstrucción, migraciones, validación y despliegue | Codex |
