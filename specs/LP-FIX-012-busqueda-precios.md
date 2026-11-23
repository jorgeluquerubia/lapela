---
id: LP-FIX-012
type: FIX
status: IMPLEMENTED
priority: P1
requested_at: 2026-11-22
requested_by: usuario
source: validación del MVP
owner: ingeniería
github_issue: pending
related_specs: [LP-FEAT-014]
dependencies: []
cross_cutting_concerns: [buscador, catálogo]
---

# LP-FIX-012 · Respetar los filtros de precio vacíos en la búsqueda

## 1. Solicitud original

Corregir los bloqueos detectados al ejecutar el plan de cierre del MVP.

## 2. Contexto y problema

Al buscar por título, el catálogo enviaba el precio máximo vacío. El controlador lo convertía a cero, por lo que un anuncio disponible de 25 € aparecía en PostgreSQL y quedaba excluido de la respuesta de búsqueda.

## 3. Resultado esperado

La búsqueda devuelve anuncios que coinciden aunque la persona deje el precio vacío. Los importes explícitos siguen filtrando los resultados.

## 4. Alcance

Interpretación de precio mínimo y máximo en la ruta de búsqueda. Se mantiene el ranking y el filtro por entorno existentes.

## 5. Requisitos y reglas de negocio

- `RF-01` Un precio ausente, vacío o compuesto solo por espacios no aplica un límite.
- `RF-02` Un precio numérico explícito, incluido cero, se expresa en céntimos para la búsqueda.

## 6. Criterios de aceptación

- [x] `AC-01` Buscar por título un anuncio disponible de 25 € sin poner precio devuelve el anuncio.
- [x] `AC-02` Una consulta con máximo explícito de 20 € excluye ese anuncio. El controlador diferencia el valor explícito `0` de un filtro vacío.

## 7. Experiencia y estados

El catálogo muestra resultados al buscar sin rango. Los filtros numéricos y el estado sin resultados mantienen su comportamiento.

## 8. Datos, API, seguridad y operación

El controlador pasa `null` a PostgreSQL para límites ausentes. La corrección no requiere una migración.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia |
|---|---|---|
| Controlador de búsqueda | Distingue ausencia y cero explícito | 4 casos en verde, 2026-11-22 |
| Navegador con Supabase local | Encuentra el anuncio publicado antes de reservarlo | Publicación de 25 €, ocultación con máximo de 20 € y recuperación al vaciarlo, 2026-11-22 |

## 10. Decisiones, riesgos y preguntas abiertas

La referencia a GitHub Issue queda pendiente por el permiso de escritura de la integración.

## 11. Implementación y trazabilidad

Rama `codex/lp-fix-012-busqueda-precios`. Controlador `src/controllers/search.ts` y prueba focalizada.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-11-22 | `IN_PROGRESS` | Reproducir el fallo en el entorno aislado de la beta | Codex |
| 2026-11-22 | `IMPLEMENTED` | Validar los rangos con Jest y Chromium sobre Supabase local | Codex |
