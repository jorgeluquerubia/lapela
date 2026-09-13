---
id: LP-FIX-010
type: FIX
status: IMPLEMENTED
priority: P2
requested_at: 2026-09-13
requested_by: usuario
source: conversación
owner: codex
github_issue: https://github.com/jorgeluquerubia/lapela/issues/70
related_specs: [LP-FEAT-020, LP-FEAT-016]
dependencies: [LP-FEAT-020]
cross_cutting_concerns: [imagen, marketing, tipografía]
---

# LP-FIX-010 · Renderizar equivalencia completa en tarjetas sociales

## 1. Solicitud original

> Corregir el cuadrado vacío que aparece en la tarjeta social donde debería renderizarse el símbolo `≈` de la equivalencia en pesetas.

## 2. Contexto y problema

- **Problema u oportunidad:** La fuente disponible en `ImageResponse` no contiene el glifo `≈`.
- **Personas afectadas:** Personas que previsualizan, descargan o comparten una tarjeta.
- **Impacto actual:** La imagen PNG es válida, pero presenta un carácter roto junto al precio.
- **Evidencia disponible:** Inspección visual del PNG productivo 1200×630.

## 3. Resultado esperado

La equivalencia secundaria se muestra completa y legible con una expresión compatible con las fuentes del generador, manteniendo el significado histórico y el euro como precio principal.

## 4. Alcance

### Incluido

- Formato social `aprox. N ptas.` con caracteres soportados.
- Prueba del formateador y consumo completo del PNG.
- Verificación visual del resultado.

### Excluido

- Cambiar el formato `≈` en la interfaz web normal.
- Cambiar conversión, redondeo o moneda contractual.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: La tarjeta debe mostrar una equivalencia legible sin glifos ausentes.
- `RF-02`: El número debe coincidir con el cálculo de LP-FEAT-016.

### Requisitos no funcionales

- `RNF-01`: El formato usado por ImageResponse debe limitarse a caracteres cubiertos por su fuente efectiva.

### Reglas de negocio

- `RN-01`: El euro permanece como precio principal y la peseta como equivalencia histórica.

## 6. Criterios de aceptación

- [x] `AC-01` Una tarjeta de 85 € muestra `aprox. 14.143 ptas.` sin cuadrado vacío.
- [x] `AC-02` La interfaz web mantiene su formato actual y el cambio solo afecta al PNG social.
- [x] `AC-03` La respuesta sigue siendo un PNG 1200×630 consumible.
- [x] `AC-04` Prueba dirigida, build y `npm run specs:check` terminan correctamente.

## 7. Experiencia y estados

- **Estados normales:** Texto secundario legible junto al precio en euros.
- **Estados de error o vacío:** Sin cambios.
- **Mensajes y accesibilidad:** La imagen conserva texto equivalente en el contexto de compartir.
- **Responsive o canales afectados:** Tarjeta social 1200×630.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Sin cambios.
- **API/integraciones:** `ImageResponse` de Next.js.
- **Autorización y privacidad:** Sin cambios.
- **Observabilidad y soporte:** Sin cambios.
- **Métricas o señales de éxito:** PNG sin glifo de sustitución.
- **Migración/rollback:** Reversión del formateador social.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Formato | `aprox. 14.143 ptas.` | Prueba unitaria del formateador social | 2026-09-13 |
| Render | PNG válido y revisión visual | PNG local real 1200×630 inspeccionado sin glifo roto | 2026-09-13 |
| Build y specs | Sin errores | 13/13 pruebas; `npm run build`; `npm run specs:check` (35 fichas) | 2026-09-13 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Usar `aprox.` en el PNG en lugar de incorporar otra fuente solo para un símbolo.
- **Riesgos y límites:** Ninguno relevante.
- **Preguntas abiertas:** Ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** Endpoint y pruebas de tarjeta social.
- **Migraciones/configuración:** Ninguna.
- **Commit o despliegue:** Commit `4f75ffa`; PR [#77](https://github.com/jorgeluquerubia/lapela/pull/77).
- **Notas de implementación:** Un formateador exclusivo de la tarjeta sustituye el prefijo `≈` por `aprox.`; la interfaz web continúa usando el formato original.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-13 | `IN_PROGRESS` | Creación e inicio de implementación | Codex |
| 2026-09-13 | `IMPLEMENTED` | Formato y render PNG validados localmente | Codex |
