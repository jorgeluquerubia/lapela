---
id: LP-FEAT-002
type: FEATURE
status: VERIFIED
priority: P1
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
related_specs: [LP-FEAT-001]
dependencies: [Supabase]
cross_cutting_concerns: [SECURITY, OPS]
---

# LP-FEAT-002 · Pagos simulados durante la beta

## 1. Solicitud original

> Por ahora vamos a simular los cobros reales.

## 2. Contexto y problema

La experiencia de compra debe poder probarse sin una cuenta de Stripe Connect ni movimiento de dinero. El modo de prueba debe ser reconocible y no confundirse con una venta real.

## 3. Resultado esperado

La persona compradora puede crear una reserva y confirmar un pago simulado desde el pedido. La aplicación nunca cobra dinero en este modo y deja preparada la transición deliberada a Stripe.

## 4. Alcance

### Incluido

- Configuración `LAPELA_PAYMENTS_MODE=simulated` en Vercel.
- Banner visible de beta y mensajes de pedido de prueba.
- Confirmación simulada desde un pedido pendiente.
- Persistencia de `environment` y `payment_mode` para distinguir pruebas de pagos Stripe.

### Excluido

- Cargos reales, datos de tarjeta o onboarding real de vendedores.
- Activar Stripe por defecto o aceptar una confirmación de navegador como pago.

## 5. Requisitos y reglas de negocio

- `REQ-01`: Crear una reserva no marca el pedido como pagado.
- `REQ-02`: Solo la acción explícita de simulación marca el pedido como pagado en sandbox.
- `RULE-01`: Todo pedido sandbox se identifica en la interfaz como prueba y sin cargo real.
- `RULE-02`: El webhook Stripe no se usa para completar pagos simulados.

## 6. Criterios de aceptación

- [x] `AC-01` La web muestra que compras y pagos son simulados.
- [x] `AC-02` Comprar crea un pedido pendiente sin cargo y permite abrir la acción de simulación.
- [x] `AC-03` Confirmar la simulación habilita el chat del pedido.
- [x] `AC-04` El pedido conserva `environment=sandbox` y `payment_mode=simulation`.
- [x] `AC-05` El modo real requiere cambiar configuración y completar Stripe Connect/webhook.

## 7. Experiencia y estados

- Estados visibles: pendiente de pago, pago simulado confirmado, enviado y recepción completada.
- El importe mostrado coincide con la reserva; no se muestran formularios de tarjeta en sandbox.

## 8. Datos, API, seguridad y operación

- Migración `202609060003_simulation.sql` añade `environment` y `payment_mode`.
- Migración `202609060004_mark_stripe_payment.sql` distingue confirmaciones Stripe.
- La RPC `lp_simulate_payment` solo se permite para pedidos sandbox y al comprador autorizado.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Build | Rutas de checkout y pedido compilan | `npm run build` | 2026-09-06 |
| Smoke de anuncio | El detalle anuncia pago simulado | Navegador publicado | 2026-09-06 |
| Invariantes SQL | Importe, propiedad e idempotencia protegidos | `tests/database/marketplace.sql` | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** No se ha configurado Stripe real todavía.
- **Riesgo:** El modo sandbox no valida la entregabilidad ni liquidación real.
- **Pregunta abierta:** Elegir proveedor y completar verificación de vendedores antes de producción.

## 11. Implementación y trazabilidad

- `src/lib/payments.ts`, `src/app/orders/[id]/page.tsx`, `src/controllers/marketplace.ts`.
- `LAPELA_PAYMENTS_MODE=simulated` configurado en Vercel.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `VERIFIED` | Modo sandbox y validaciones publicados | Codex |
