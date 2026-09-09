---
id: LP-FEAT-006
type: FEATURE
status: VERIFIED
priority: P1
requested_at: 2026-09-09
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/19
related_specs: [LP-FEAT-001, LP-FEAT-002]
dependencies: []
cross_cutting_concerns: []
---

# LP-FEAT-006 · Confirmación de compra, reserva de 48h y política de compras

## 1. Solicitud original

> El comprador cuando va a comprar algo, deberia aparecerle algun mensaje para confirmar que va a comprar ese articulo y ahi podrá aceptar o cancelar. En algun lugar de la web tiene que haber una politica de compras que advierta, entre otras cosas, de que el usuario que compra un articulo se le va a reservar y tendrá 48 horas para realizar el pago y advertir en caso de que no lo haga se puede enfrentar a una penalización. Hay que establecer una política de penalizaciones , lo dejamos pendiente.

## 2. Contexto y problema

- **Problema u oportunidad:** Los compradores podían pulsar directamente sobre el botón de compra sin un paso explícito de confirmación ni advertencia de lo que implica reservar un artículo. Además, el plazo original de reserva (31 minutos) era insuficiente para coordinar pagos y entregas, y no existía un documento accesible que explicara las obligaciones de pago en un plazo de 48 horas ni las posibles penalizaciones por impago.
- **Personas afectadas:** Compradores (que necesitan seguridad antes de confirmar y conocer sus compromisos) y vendedores (cuyos artículos quedan reservados y necesitan garantías contra reservas abandonadas).
- **Impacto actual:** Reservas instantáneas sin confirmación previa y plazo de reserva demasiado breve.
- **Evidencia disponible:** Solicitud explícita del usuario y diseño del flujo de compra directa en `ProductDetailInteractive.tsx`.

## 3. Resultado esperado

- Un diálogo de confirmación claro y accesible cuando el comprador pulsa en comprar, con desglose del importe, resumen de condiciones (48 horas de reserva) y botones para aceptar o cancelar.
- Duración de la reserva ampliada a 48 horas en la base de datos (`lp_reserve`).
- Una página pública y enlazada `/politica-de-compras` que detalla los principios de compra, el plazo de 48 horas y advierte de penalizaciones ante impagos o reservas abusivas.

## 4. Alcance

### Incluido

- Diálogo interactivo de confirmación en `ProductDetailInteractive.tsx` antes de iniciar la reserva/checkout.
- Ampliación del campo `expires_at` en `lp_reserve` a `now() + interval '48 hours'`.
- Migración de base de datos `supabase/migrations/202609090001_reservation_48h.sql`.
- Página canónica `/politica-de-compras` con metadatos SEO e información detallada de compra y advertencias de penalización.
- Enlace a la política de compras en el diálogo de confirmación y en el footer de la aplicación.

### Excluido

- Implementación del sistema automatizado de sanciones o penalizaciones (queda expresamente pendiente a futuro según solicitud del usuario).

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Al pulsar "Comprar ahora", el comprador visualiza un mensaje/modal de confirmación que resume el artículo, el precio y las condiciones de la reserva antes de crear el pedido.
- `RF-02`: El diálogo de confirmación permite aceptar (crear la reserva e ir al pedido) o cancelar (cerrar el diálogo sin reservar el artículo).
- `RF-03`: Al confirmar la compra, el artículo queda reservado por un plazo estricto de 48 horas para completar el pago y entrega.
- `RF-04`: El sistema cuenta con una ruta pública `/politica-de-compras` accesible desde el pie de página y desde el modal de confirmación.

### Requisitos no funcionales

- `RNF-01`: El diálogo de confirmación debe ser accesible mediante teclado, con foco atrapado y atributos ARIA de diálogo modal.
- `RNF-02`: La página de política de compras debe ser indexable por motores de búsqueda y compatible con móvil y escritorio.

### Reglas de negocio

- `RN-01`: La reserva de un artículo dura 48 horas. Si expira sin completarse el pago, el artículo vuelve a estar disponible.
- `RN-02`: Un comprador no puede reservar sus propios artículos.
- `RN-03`: El aviso de posibles penalizaciones por impago debe presentarse de forma visible antes de confirmar la reserva.

## 6. Criterios de aceptación

- [x] `AC-01` Dado un comprador autenticado en la ficha de un producto disponible, cuando pulsa "Comprar ahora", entonces se muestra un diálogo de confirmación con el importe, el plazo de reserva de 48 horas y aviso de penalización por impago.
- [x] `AC-02` Dado el diálogo de confirmación de compra abierto, cuando el comprador pulsa "Cancelar", entonces el diálogo se cierra y el artículo no se reserva.
- [x] `AC-03` Dado el diálogo de confirmación de compra abierto, cuando el comprador pulsa "Confirmar compra", entonces se crea la reserva con `expires_at` fijado a 48 horas desde el momento actual.
- [x] `AC-04` Dado cualquier usuario navegando por la web, cuando accede a `/politica-de-compras` (o mediante el pie de página), entonces visualiza el texto completo de la política de compras con la advertencia de reserva de 48 horas y penalizaciones.

## 7. Experiencia y estados

- Confirmación: panel/modal con fondo atenuado, detalles del artículo, advertencia de compromiso y botones "Confirmar compra" y "Cancelar".
- Política de compras: layout legible con estilo prose, jerarquía tipográfica limpia y enlaces de navegación.

## 8. Datos, API, seguridad y operación

- Base de datos: actualización de la función `lp_reserve` en PostgreSQL con `expires_at = now() + interval '48 hours'`.
- Rutas: nueva página estática/SSR `/politica-de-compras`.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| `npm run specs:check` | Ficha registrada y gobernanza documental correcta | 14 fichas válidas y 25 documentos enlazados | 2026-09-09 |
| Invariante SQL de reserva 48h | `expires_at` calculado a 48 horas en `lp_reserve` | Migración `202609090001_reservation_48h.sql` aplicada; test en `tests/database/marketplace.sql` superado | 2026-09-09 |
| Pruebas de componente | Modal de confirmación abre, cancela y confirma | `src/components/__tests__/ProductDetailInteractive.test.tsx` (2/2 pruebas superadas) | 2026-09-09 |
| `npm run build` | Compilación limpia de Next.js incluyendo `/politica-de-compras` | 26 rutas estáticas/SSR generadas sin errores | 2026-09-09 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:**
  - Se fija el intervalo de expiración en 48 horas exactas tanto en la función SQL `lp_reserve` como en la interfaz y textos legales.
  - La política de penalizaciones queda documentada como advertencia contractual, postergando la lógica técnica de sanciones automáticas.
- **Riesgos y límites:**
  - Bloqueo prolongado del catálogo: al subir de 31 minutos a 48 horas, se incrementa el riesgo de artículos retenidos; por ello es esencial la advertencia previa de penalizaciones.

## 11. Implementación y trazabilidad

- **Archivos o módulos:**
  - `specs/LP-FEAT-006-confirmacion-reserva-politica-compras.md`
  - `SPEC_REGISTRY.md`
  - `PROJECT_CONTEXT.md`
  - `supabase/migrations/202609090001_reservation_48h.sql`
  - `src/components/ProductDetailInteractive.tsx`
  - `src/app/politica-de-compras/page.tsx`
  - `src/app/layout.tsx`
  - `src/components/__tests__/ProductDetailInteractive.test.tsx`
- **Migraciones/configuración:** `202609090001_reservation_48h.sql` aplicada en Supabase
- **Commit o despliegue:** Rama `gemini/lp-feat-006-confirmacion-compra-reserva-48h`
- **Notas de implementación:** Rama `gemini/lp-feat-006-confirmacion-compra-reserva-48h`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-09 | `IN_PROGRESS` | Creación de especificación e inicio de implementación | Gemini |
| 2026-09-09 | `VERIFIED` | Implementación completada, pruebas unitarias y validación documental | Gemini |
