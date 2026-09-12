---
id: LP-FEAT-015
type: FEATURE
status: IMPLEMENTED
priority: P2
requested_at: 2026-09-12
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/43
related_specs: [LP-FEAT-001, LP-FEAT-008]
dependencies: [Next.js, CSS global]
cross_cutting_concerns: [DOC, ACC]
---

# LP-FEAT-015 · Identidad visual inspirada en la peseta

## 1. Solicitud original

> me gustaria darle un lavado de cara al diseño para que en cierta manera se asocie a "la pela" con una peseta. Quiero que la pagina transmita nostalgia por las pesetas de algun modo, entonces habría que cambiar el logo por algo que recuerde a una peseta pero modernizado. Puedes inventar un diseño chulo para esto? los colores de la pagina tambien tienen que acompañar al logo y a esa idea.

## 2. Contexto y problema

- **Problema u oportunidad:** La interfaz beta tiene una identidad funcional y limpia, pero el logotipo actual no conecta visualmente con el doble sentido de La Pela y la peseta. Falta un sistema reconocible que una nostalgia española y marketplace contemporáneo.
- **Personas afectadas:** Personas que exploran, compran o venden en La Pela, especialmente quienes reconocen la referencia cultural a la peseta.
- **Impacto actual:** La marca resulta genérica y el recuerdo de producto, navegación y estados no se apoya en una personalidad propia.
- **Evidencia disponible:** La marca actual usa un círculo con las letras `lp` y una flecha; la paleta se limita a verde, blanco y lima.

## 3. Resultado esperado

La aplicación debe presentar una identidad visual renovada y coherente: una marca con forma de moneda de peseta reinterpretada, colores de tinta y papel con cobre como acento, y una portada/navegación/catalogo que evoquen coleccionismo y segunda mano sin parecer una recreación antigua.

## 4. Alcance

### Incluido

- Nuevo componente de marca accesible y responsive, construido como SVG inline sin depender de imágenes externas.
- Revisión de variables cromáticas, tipografía del sistema, bordes, sombras y superficies.
- Tratamiento visual de cabecera, navegación, banner beta, hero, filtros, tarjetas, etiquetas, botones, estados vacíos/carga y pie.
- Detalles de nostalgia discretos: textura CSS, sello de fecha, nomenclatura editorial y acentos de cobre.
- Compatibilidad responsive y foco visible.

### Excluido

- Cambios en modelos, API, navegación, reglas de compra o comportamiento transaccional.
- Uso de imágenes o fuentes remotas que añadan dependencias de red.
- Rediseño funcional de las pantallas de checkout, autenticación o chat más allá de los estilos globales.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: La cabecera y el pie deben mostrar una marca inspirada en una moneda, con el nombre La Pela y una descripción accesible.
- `RF-02`: La interfaz pública debe usar una paleta coherente de tinta verde, papel marfil y cobre envejecido, manteniendo la semántica del precio y la subasta.
- `RF-03`: La portada debe comunicar el concepto de marca con un hero editorial y un indicador visual de moneda/coleccionismo.
- `RF-04`: Las tarjetas de artículo, controles de navegación, filtros y estados deben compartir el nuevo lenguaje visual sin cambiar sus enlaces ni acciones.

### Requisitos no funcionales

- `RNF-01`: El logotipo no debe depender de un recurso externo y debe conservar nitidez a cualquier escala.
- `RNF-02`: El contraste de texto y controles debe seguir siendo legible en escritorio y móvil; los estados de foco deben mantenerse visibles.
- `RNF-03`: La implementación debe conservar el comportamiento responsive existente y no añadir una dependencia de runtime.

### Reglas de negocio

- `RN-01`: La nostalgia es únicamente expresiva; no debe sugerir que la aplicación usa pesetas como moneda de pago. Los precios continúan mostrándose en euros.
- `RN-02`: La indicación de beta y pagos simulados debe seguir siendo visible y distinguible.

## 6. Criterios de aceptación

- [ ] `AC-01` La cabecera y el pie muestran el nuevo sello-moneda y el texto “la pela.” sin romper sus enlaces accesibles.
- [ ] `AC-02` La portada usa la nueva paleta y comunica el concepto con un hero visible, una textura sutil y un acento editorial relacionado con la peseta.
- [ ] `AC-03` Los controles, tarjetas, etiquetas y estados principales presentan estilos coherentes con la nueva identidad y conservan sus acciones actuales.
- [ ] `AC-04` En viewport móvil la cabecera, búsqueda, navegación y catálogo siguen siendo utilizables sin desbordamiento horizontal no intencionado.
- [ ] `AC-05` El logotipo es SVG inline, no carga recursos remotos y dispone de nombre accesible mediante la marca enlazada.
- [ ] `AC-06` `npm run specs:check`, las pruebas frontend y `npm run build` terminan sin errores.

## 7. Experiencia y estados

- **Estados normales:** La moneda funciona como firma de marca; el cobre se reserva para acentos, la tinta para acciones y el papel para superficies cálidas.
- **Estados de error o vacío:** Conservan la jerarquía visual y usan colores semánticos legibles, sin perder el tono editorial.
- **Mensajes y accesibilidad:** El SVG es decorativo dentro del enlace con `aria-label`; no se usa como único indicador de estado.
- **Responsive o canales afectados:** Cabecera en dos filas en móvil; hero y rejilla de artículos adaptables; se mantienen foco visible y controles táctiles.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Sin cambios.
- **API/integraciones:** Sin cambios.
- **Autorización y privacidad:** Sin cambios.
- **Observabilidad y soporte:** No aplica.
- **Métricas o señales de éxito:** Validación visual en escritorio y móvil, junto con las comprobaciones de build y tests.
- **Migración/rollback:** Revertir los archivos de presentación de la spec restaura el sistema visual previo; no hay migración de datos.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| `npm run specs:check` | Ficha y registro válidos | `Specs válidas: 25 fichas registradas y 36 documentos enlazados.` | 2026-09-12 |
| Pruebas frontend dirigidas | Componentes de cabecera y tarjetas sin regresiones | `PASS`: 2 suites, 3 tests (`Header.test.tsx`, `ProductCard.test.tsx`) | 2026-09-12 |
| Pruebas frontend completas | Suite existente sin regresiones | Pendiente: la suite actual falla en expectativas legacy de `search` y en `tests-examples/demo-todo-app.spec.ts`; no relacionado con esta spec | 2026-09-12 |
| `npm run build` | Compilación completa sin errores | `PASS`: 26 páginas generadas; tipos, lint y trazas completados | 2026-09-12 |
| Revisión visual responsive | Sello SVG, paleta y hero aplicados; móvil sin overflow horizontal (`bodyWidth=604`, `contentWidth=604`) | Preview local en `http://localhost:3015/` | 2026-09-12 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Usar SVG inline para el sello; la referencia se construye con borde circular, muescas y “LP”, evitando una copia literal de una moneda histórica. Mantener euros como moneda única.
- **Riesgos y límites:** Una textura demasiado intensa puede reducir legibilidad; se limitará a fondos con opacidad baja y no se aplicará sobre texto.
- **Preguntas abiertas:** Ninguna bloqueante para esta primera propuesta.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `src/components/Brand.tsx`, `src/components/Catalog.tsx`, `src/app/globals.css`, `src/app/layout.tsx`.
- **Migraciones/configuración:** No aplica.
- **Commit o despliegue:** `e4143ad` · Pull request `https://github.com/jorgeluquerubia/lapela/pull/44`.
- **Rama:** `codex/lp-feat-015-identidad-peseta`.
- **Issue:** `https://github.com/jorgeluquerubia/lapela/issues/43`.
- **Pull request:** `https://github.com/jorgeluquerubia/lapela/pull/44`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-12 | `IN_PROGRESS` | Creación de la ficha y definición de dirección visual | Codex |
| 2026-09-12 | `IMPLEMENTED` | Nuevo sello SVG, hero editorial, paleta y estilos globales aplicados; build y revisión visual superados | Codex |
| 2026-09-12 | `IMPLEMENTED` | PR #44 preparada hacia `main`; queda pendiente resolver los fallos legacy de la suite frontend para marcar `VERIFIED` | Codex |
