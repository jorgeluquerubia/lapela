---
id: LP-FEAT-016
type: FEATURE
status: VERIFIED
priority: P1
requested_at: 2026-09-12
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/45
related_specs: [LP-FEAT-001, LP-FEAT-002, LP-FEAT-015]
dependencies: []
cross_cutting_concerns: [precios, pagos, accesibilidad, SEO]
---

# LP-FEAT-016 · Precios en euros con equivalencia en pesetas

## 1. Solicitud original

> Mostrar el precio de los artículos en pesetas junto al precio en euros, dejando la equivalencia más pequeña, para reforzar la diferenciación y la nostalgia asociadas a La Pela.

## 2. Contexto y problema

- **Problema u oportunidad:** La identidad visual ya remite a una moneda inspirada en la peseta, pero esa referencia no participa todavía en la experiencia cotidiana del catálogo y de la compra.
- **Personas afectadas:** Visitantes, compradores, vendedores y pujadores.
- **Impacto actual:** La asociación entre La Pela y la peseta depende principalmente del logotipo y del hero, por lo que pierde fuerza al navegar por anuncios, subastas y pedidos.
- **Evidencia disponible:** El precio aparece en numerosas superficies y constituye una oportunidad de marca recurrente. El tipo irrevocable oficial es `1 EUR = 166,386 ESP`.

## 3. Resultado esperado

Cada importe comercial relevante muestra el euro como precio principal y una equivalencia histórica secundaria en pesetas. La presentación deja inequívocamente claro que la peseta es informativa y que precios, pujas, pagos, reembolsos y liquidaciones continúan denominados y procesados en euros.

## 4. Alcance

### Incluido

- Función compartida de conversión y formato basada en `1 EUR = 166,386 ESP`, redondeada a la peseta entera más cercana.
- Equivalencia en tarjetas del catálogo, ficha del artículo, precio de salida y puja vigente, compra inmediata, Mi actividad y resumen del pedido.
- Texto o ayuda contextual `Equivalencia histórica · El pago se realiza en euros` en las superficies donde pueda existir duda.
- Diseño responsive y accesible que mantenga el euro como importe visual y semánticamente principal.
- Analítica para conocer exposición e interacción con la ayuda de equivalencia.

### Excluido

- Cambiar a pesetas los filtros, formularios de publicación, importes almacenados, API, Stripe, recibos, reembolsos o datos estructurados SEO.
- Crear saldo, cartera, puntos promocionales o capacidad de pagar con pesetas.
- Permitir una tasa editable o distinta de la conversión oficial.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: El sistema debe calcular la equivalencia multiplicando el importe exacto en euros por `166,386` y redondeando el resultado final a una peseta entera.
- `RF-02`: El catálogo, la ficha, las subastas, Mi actividad y el pedido deben mostrar la equivalencia junto al importe principal cuando exista un precio válido.
- `RF-03`: Las superficies transaccionales deben indicar de forma explícita que el pago se realiza en euros.
- `RF-04`: La conversión debe actualizarse cuando cambie la puja vigente o cualquier otro importe dinámico.

### Requisitos no funcionales

- `RNF-01`: La equivalencia no debe provocar desbordamiento ni ocultar el precio en viewports desde 320 píxeles de ancho.
- `RNF-02`: El texto secundario debe mantener contraste AA y ser anunciado después del importe en euros por tecnologías de asistencia, sin duplicar de manera confusa el nombre accesible de la acción de compra.
- `RNF-03`: La conversión debe existir en una única utilidad compartida con pruebas de redondeo y no depender de servicios externos.

### Reglas de negocio

- `RN-01`: El euro es siempre la moneda contractual, de filtro, almacenamiento y pago.
- `RN-02`: La equivalencia en pesetas nunca puede modificar el total ni utilizarse para validar una puja.
- `RN-03`: Schema.org y metadatos comerciales conservan `priceCurrency: EUR`.
- `RN-04`: La equivalencia debe etiquetarse como histórica; no se puede afirmar que La Pela acepta pesetas.

## 6. Criterios de aceptación

- [x] `AC-01` Dado un artículo de `75,00 €`, catálogo y ficha muestran `≈ 12.479 ptas.` como información secundaria.
- [x] `AC-02` Dada una subasta cuya puja vigente cambia, la equivalencia se recalcula a partir del nuevo importe sin recargar un tipo de cambio externo.
- [x] `AC-03` En publicación, filtros, pagos, recibos, API y datos estructurados los importes siguen expresados únicamente en EUR.
- [x] `AC-04` Antes de confirmar una compra o puja se entiende de manera explícita que la operación económica se realiza en euros.
- [x] `AC-05` La presentación funciona sin solapamientos a 320, 768 y 1280 píxeles, conserva contraste AA y no altera el nombre accesible de los botones.
- [x] `AC-06` Las pruebas unitarias cubren enteros, decimales, redondeo, cero informativo y valores máximos admitidos; build y `npm run specs:check` finalizan correctamente.

## 7. Experiencia y estados

- **Estados normales:** Euro destacado; equivalencia en una segunda línea más pequeña con abreviatura `ptas.`.
- **Estados de error o vacío:** Si el precio no está disponible no se presenta una equivalencia parcial; los productos de ejemplo mantienen su identificación actual.
- **Mensajes y accesibilidad:** La primera aparición contextual ofrece una explicación breve; no se utilizan solo color o tamaño para distinguir moneda real y equivalencia.
- **Responsive o canales afectados:** Catálogo, ficha, subasta, actividad y pedido en móvil y escritorio.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Sin columnas nuevas; la equivalencia se deriva del importe en euros.
- **API/integraciones:** Sin cambio contractual; las respuestas continúan en céntimos de euro.
- **Autorización y privacidad:** Sin impacto.
- **Observabilidad y soporte:** Evento analítico para apertura de la explicación y categoría de consulta de soporte sobre moneda.
- **Métricas o señales de éxito:** Comprensión correcta de la moneda de pago, recuerdo de marca y ausencia de aumento relevante en abandono o consultas de confusión.
- **Migración/rollback:** Cambio de presentación reversible; ocultar la equivalencia no altera datos.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Pruebas de formato | Conversión y redondeo exactos | `src/lib/__tests__/pesetas.test.ts` (11 pruebas pasadas) | 2026-09-12 |
| Revisión visual responsive | Jerarquía clara y sin overflow | Reglas `.peseta-approx`, `.price-stack`, `.peseta-badge-row` con flex-wrap y contraste AA (> 5.5:1) | 2026-09-12 |
| Flujo de compra y puja | Todos los importes efectivos permanecen en EUR | `ProductDetailInteractive.test.tsx` y `Order.test.tsx` (5 pruebas pasadas) | 2026-09-12 |
| SEO estructurado | `priceCurrency` continúa en EUR | `src/app/articulos/[slug]/page.tsx` Schema.org Offer `priceCurrency: EUR` | 2026-09-12 |
| Build y specs | Comprobaciones sin errores | `npm run build` y `npm run specs:check` exitosos en CI local | 2026-09-12 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Conversión informativa, derivada y no configurable; euros siempre en primer nivel.
- **Riesgos y límites:** Las cifras elevadas en pesetas pueden aumentar la percepción de precio; se medirá conversión y se podrá limitar su presencia en superficies transaccionales.
- **Preguntas abiertas:** Ninguna bloqueante.

## 11. Implementación y trazabilidad

- **Archivos o módulos:**
  - `src/lib/pesetas.ts`: utilidad matemática oficial (1 EUR = 166,386 ESP), formato y analítica.
  - `src/lib/__tests__/pesetas.test.ts`: suite de pruebas para tipos de datos, redondeo y analítica.
  - `src/lib/rules.ts`: re-export de utilidades monetarias.
  - `src/components/ProductCard.tsx`: equivalencia en tarjetas del catálogo.
  - `src/components/__tests__/ProductCard.test.tsx`: verificación de AC-01 en tarjetas.
  - `src/components/ProductDetailInteractive.tsx`: equivalencia en ficha, pujas, compras y recordatorio de pago en EUR.
  - `src/components/__tests__/ProductDetailInteractive.test.tsx`: verificación de AC-01, AC-02, AC-04 y nombres accesibles.
  - `src/app/my-products/page.tsx`: equivalencia secundaria en historial de actividad.
  - `src/app/orders/[id]/page.tsx`: equivalencia y aclaración en resumen de pedido y confirmación.
  - `src/app/orders/[id]/__tests__/Order.test.tsx`: pruebas de resumen de pedido con pesetas.
  - `src/app/globals.css`: estilos de badges, contraste AA y layout responsive sin desbordamiento.
  - `PROJECT_CONTEXT.md`: documentación de producto de la funcionalidad activa.
- **Migraciones/configuración:** No requeridas.
- **Commit o despliegue:** Rama `codex/lp-feat-016-precios-pesetas`, PR #50.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-12 | `READY` | Ficha e issue creadas; alcance preparado sin implementación | Codex |
| 2026-09-12 | `VERIFIED` | Implementación completa de cálculo oficial, integración en vistas, estilos accesibles y pruebas | Gemini |

