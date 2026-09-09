---
id: LP-FEAT-008
type: FEATURE
status: VERIFIED
priority: P2
requested_at: 2026-09-09
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/23
related_specs: [LP-FEAT-001, LP-FEAT-005]
dependencies: []
cross_cutting_concerns: [accesibilidad, diseño]
---

# LP-FEAT-008 · Spinner de marca no bloqueante y mejoras en preguntas y respuestas

## 1. Solicitud original

> - Spinner no bloqueante con la moneda/logo de La Pela girando durante la carga asíncrona (por ejemplo clics en categorías, carga de imágenes) en lugar de placeholders vacíos.
> - Revisar y corregir el formato del banner de reglas en la sección de preguntas y respuestas (`ProductQA`).
> - Reforzar la validación estricta en preguntas y respuestas contra regateos y términos prohibidos.

## 2. Contexto y problema

- **Problema u oportunidad:**
  1. Durante la navegación asíncrona (filtros, categorías) y la carga de imágenes, la interfaz presentaba cajas grises vacías o parpadeos bruscos (`loading-card`) sin identidad de marca ni comunicación fluida.
  2. En la sección de preguntas y respuestas (`ProductQA`), el banner explicativo de la normativa presentaba problemas de formateo visual derivados del reseteo de estilos de listas en CSS/Tailwind (las viñetas `ul/li` no se mostraban adecuadamente, afectando la legibilidad).
  3. Los usuarios podían eludir el filtro anti-regateo utilizando variantes comunes de negociación en español ("me lo dejas en X", "te ofrezco X", "te pago X en mano", "haces rebaja", trueques, etc.).
- **Personas afectadas:** Compradores y vendedores navegando por el catálogo, visualizando fotos de productos o interactuando en las preguntas públicas de la ficha.
- **Impacto actual:** Experiencia de carga despersonalizada, reglas de Q&A con presentación descuidada y riesgo de regateos en un portal con política estricta de precio no negociable.
- **Evidencia disponible:** Solicitud del usuario, reseteos en `globals.css` y casos de prueba en `rules-qa.test.ts`.

## 3. Resultado esperado

- Un componente reutilizable `BrandSpinner` que muestra la moneda/logo oficial de La Pela (`lp ↗`) girando de forma continua, accesible (`role="status"`, `aria-label`), adaptable a tamaños (`sm`, `md`, `lg`) y respetando `prefers-reduced-motion`.
- Integración no bloqueante en el catálogo y en las tarjetas de producto durante la carga de imágenes.
- Banner de reglas de Q&A formateado de manera atractiva, con viñetas visibles, margen e iconografía limpia.
- Regla `noBargaining` reforzada con un léxico exhaustivo de regateo, detección de ofertas económicas monetarias y bloqueo estricto.

## 4. Alcance

### Incluido

- Componente accesible `src/components/BrandSpinner.tsx`.
- Estilos de animación 3D / giro de moneda en `src/app/globals.css`.
- Integración de `BrandSpinner` en `src/components/Catalog.tsx` (toolbar y estados de recarga de catálogo).
- Integración de `BrandSpinner` en `src/components/ProductCard.tsx` durante la carga de imágenes.
- Corrección de formato del banner de normas en `src/components/ProductQA.tsx` y `src/app/globals.css`.
- Ampliación del validador `noBargaining` en `src/lib/rules.ts` con diccionario ampliado y detección de números/cantidades con intención de oferta.
- Pruebas unitarias de las nuevas reglas y pruebas del componente spinner.

### Excluido

- Cambios en el esquema de base de datos (no requeridos para esta mejora de UI y validación de dominio).

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: La aplicación cuenta con un spinner de marca (`BrandSpinner`) que representa la moneda/icono de La Pela girando.
- `RF-02`: Al navegar entre categorías o filtros en el catálogo, se muestra el indicador no bloqueante con el spinner de marca sin destruir el diseño circundante.
- `RF-03`: En las tarjetas de producto, mientras la imagen se descarga de red, se muestra el spinner centrado en lugar de un hueco estático sin feedback.
- `RF-04`: El banner de normas de preguntas y respuestas en `ProductQA` presenta viñetas con viñeta visible (`list-disc`), sangría adecuada y jerarquía tipográfica limpia.
- `RF-05`: La función `noBargaining` rechaza ofertas numéricas ("te doy 30€", "te ofrezco 20"), expresiones de rebaja ("me lo dejas en", "precio final", "rebajita") e intentos de trueque/intercambio.

### Requisitos no funcionales

- `RNF-01`: `BrandSpinner` debe incluir soporte para usuarios con sensibilidad al movimiento mediante `prefers-reduced-motion: reduce`.
- `RNF-02`: Los elementos de carga deben disponer de atributos semánticos ARIA (`role="status"`, texto accesible).

### Reglas de negocio

- `RN-01`: En La Pela el precio es fijo (o por pujas en subastas); ninguna pregunta pública puede formular contraofertas o propuestas de rebaja.

## 6. Criterios de aceptación

- [x] `AC-01` Dado un usuario visualizando una tarjeta de producto en el catálogo cuya imagen está en proceso de carga, entonces visualiza el spinner con la moneda de La Pela girando en el contenedor hasta completarse la carga.
- [x] `AC-02` Dado un usuario cambiando de categoría o filtros en el catálogo, entonces se muestra el indicador con `BrandSpinner` informando del estado de búsqueda de forma no bloqueante.
- [x] `AC-03` Dado un usuario en la ficha de producto en la sección de preguntas y respuestas, entonces visualiza el banner de normativa con estilo visual destacado y lista con viñetas claramente legibles.
- [x] `AC-04` Dado un comprador intentando enviar preguntas con expresiones de regateo ("te ofrezco 40", "me lo dejas por 15", "haces trueque"), entonces el sistema bloquea el envío con un mensaje que informa de que el precio no es negociable.

## 7. Experiencia y estados

- Spinner de moneda: moneda circular blanca/verde con `lp ↗`, rotación en eje Y suave, sombras discretas y borde verde característico de La Pela.
- Banner de reglas: borde lateral verde, viñetas sangradas con `list-disc` y texto diferenciado.

## 8. Datos, API, seguridad y operación

- No requiere nuevas tablas ni migraciones SQL.
- `src/lib/rules.ts` (`noBargaining`) se ejecuta tanto en cliente (en el componente antes de enviar) como en el backend (`src/controllers/marketplace.ts`).

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Pruebas unitarias de regateo | Rechazo de todas las variantes de regateo, ofertas y trueque | `src/lib/__tests__/rules-qa.test.ts` (4/4 pruebas superadas) | 2026-09-09 |
| Pruebas de componente BrandSpinner | Renderiza con atributos ARIA y clases de tamaño | `src/components/__tests__/BrandSpinner.test.tsx` (2/2 pruebas superadas) | 2026-09-09 |
| Pruebas de tarjeta con carga de imagen | Spinner presente hasta disparo de evento `load` | `src/components/__tests__/ProductCard.test.tsx` (2/2 pruebas superadas) | 2026-09-09 |
| Pruebas de componente ProductQA | Banner de reglas y estilos de lista presentes | `src/components/__tests__/ProductQA.test.tsx` (5/5 pruebas superadas) | 2026-09-09 |
| `npm run specs:check` | Ficha registrada y gobernanza documental correcta | 16 fichas registradas y 27 documentos enlazados | 2026-09-09 |
| `npm run build` | Compilación Next.js limpia sin errores | 26 páginas estáticas/SSR generadas sin errores | 2026-09-09 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:**
  - Mantener los productos visibles con opacidad reducida durante recargas de filtros para evitar saltos bruscos de maquetación (Cumulative Layout Shift).
  - Emplear rotación 3D en eje Y para simular una moneda en giro continuo.
- **Riesgos y límites:**
  - Falsos positivos en `noBargaining`: las expresiones se limitan a contextos de oferta económica y no bloquean preguntas legítimas sobre el estado ("¿tiene algún detalle?").

## 11. Implementación y trazabilidad

- **Archivos o módulos:**
  - `specs/LP-FEAT-008-spinner-marca-mejoras-qa.md`
  - `SPEC_REGISTRY.md`
  - `PROJECT_CONTEXT.md`
  - `src/components/BrandSpinner.tsx`
  - `src/components/ProductCard.tsx`
  - `src/components/Catalog.tsx`
  - `src/components/ProductQA.tsx`
  - `src/lib/rules.ts`
  - `src/app/globals.css`
  - `src/lib/__tests__/rules-qa.test.ts`
  - `src/components/__tests__/BrandSpinner.test.tsx`
  - `src/components/__tests__/ProductCard.test.tsx`
  - `src/components/__tests__/ProductQA.test.tsx`
- **Migraciones/configuración:** N/A
- **Commit o despliegue:** Rama `gemini/lp-feat-008-spinner-marca-mejoras-qa`
- **Notas de implementación:** Rama `gemini/lp-feat-008-spinner-marca-mejoras-qa`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-09 | `IN_PROGRESS` | Creación de especificación e inicio de implementación | Gemini |
| 2026-09-09 | `VERIFIED` | Implementación de BrandSpinner, mejoras en ProductQA y validación completa | Gemini |
