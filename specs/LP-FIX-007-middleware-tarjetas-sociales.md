---
id: LP-FIX-007
type: FIX
status: VERIFIED
priority: P1
requested_at: 2026-09-13
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/60
related_specs: [LP-FEAT-020]
dependencies: []
cross_cutting_concerns: [seguridad, infraestructura, imágenes, middleware]
---

# LP-FIX-007 · Permitir endpoint de tarjetas sociales en middleware

## 1. Solicitud original

> he puesto a un agente a hacer QA y me dice esto:
> - LP-FEAT-020 — Tarjetas sociales: visualmente el modal está bien, pero la función principal está rota en el despliegue actual.

## 2. Contexto y problema

- **Problema:** En el despliegue en producción, el middleware de la aplicación intercepta cualquier petición bajo `/api/` que no pertenezca a la lista blanca legacy (`/api/market/`, `/api/stripe/` o `GET /api/products`), respondiendo con HTTP `410 Gone`: `{"error":"Esta operación pertenece a la versión anterior. Actualiza la página."}`.
- **Impacto:** Las peticiones a `/api/social-card/[slug]` (introducidas en `LP-FEAT-020`) son bloqueadas con 410. Por tanto, la previsualización visual dentro del modal no carga (muestra esqueleto continuo o fallo de imagen), la acción de descarga directa de la imagen PNG falla con error de red, y los rastreadores de redes sociales (Open Graph y Twitter Cards) no pueden obtener la tarjeta generada.
- **Evidencia disponible:** Petición HTTP directa al despliegue de producción `https://lapela-nine.vercel.app/api/social-card/test` devuelve código de estado 410 y cuerpo JSON de bloqueo legacy.

## 3. Resultado esperado

El middleware debe permitir que las peticiones destinadas a `/api/social-card/*` lleguen al manejador de ruta correspondiente sin ser bloqueadas con 410, manteniendo protegidas las mutaciones legacy anteriores.

## 4. Alcance

### Incluido

- Añadir la excepción de `/api/social-card/` a la comprobación de endpoints legacy en `src/middleware.ts`.
- Añadir pruebas unitarias automatizadas para `src/middleware.ts` que aseguren que `/api/social-card/*` no se bloquea y que los endpoints legacy continúen respondiendo 410.
- Comprobar que la previsualización y descarga de tarjetas funcionen correctamente sin interferencia del middleware.

### Excluido

- Modificar la lógica interna de generación visual de la tarjeta (`LP-FEAT-020`).
- Modificar el comportamiento de protección de mutaciones legacy para el resto de rutas `/api/*`.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: El middleware debe dejar pasar las peticiones dirigidas a `/api/social-card/*` hacia su endpoint de generación visual.
- `RF-02`: El middleware debe continuar respondiendo con 410 Gone ante llamadas a mutaciones de endpoints legacy no autorizados.

### Requisitos no funcionales

- `RNF-01`: La comprobación de ruta en el middleware debe realizarse de forma síncrona y eficiente sin añadir latencia medible a las peticiones.

### Reglas de negocio

- `RN-01`: Las rutas públicas autorizadas del producto no deben ser bloqueadas por las protecciones contra versiones anteriores.

## 6. Criterios de aceptación

- [x] `AC-01` Una petición `GET /api/social-card/:slug` no es interceptada por el middleware con 410 Gone y alcanza el manejador de la ruta.
- [x] `AC-02` Las rutas legacy no permitidas bajo `/api/` siguen respondiendo 410 Gone con el mensaje informativo correspondiente.
- [x] `AC-03` Se validan los escenarios mediante pruebas automatizadas y `npm run specs:check` finaliza sin errores.

## 7. Experiencia y estados

- La previsualización de la tarjeta dentro del modal carga la imagen PNG generada correctamente.
- La descarga directa del PNG mediante el botón "Descargar imagen" obtiene el archivo sin errores.
- Las previsualizaciones en redes sociales resuelven la imagen de Open Graph y Twitter Cards.

## 8. Datos, API, seguridad y operación

- **Seguridad:** La ruta `/api/social-card/[slug]` mantiene sus propias defensas de seguridad (validación de UUID, validación de entorno, estado disponible del anuncio y prevención de SSRF con lista blanca de Supabase).

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Bypass de middleware | `/api/social-card/*` no responde 410 | `src/__tests__/middleware.test.ts` valida que las peticiones a tarjetas sociales no retornan 410 | 2026-09-13 |
| Protección legacy | Otras rutas `/api/*` no permitidas responden 410 | `src/__tests__/middleware.test.ts` valida bloqueo 410 en rutas legacy | 2026-09-13 |
| Specs y build | Verificación limpia | `npm run specs:check` (31 fichas válidas) y suite de pruebas pasando | 2026-09-13 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** Mantener la lista blanca explícita en `src/middleware.ts` añadiendo la ruta segura de tarjetas sociales `/api/social-card/`.

## 11. Implementación y trazabilidad

- **Archivos:**
  - `src/middleware.ts`: añade `!request.nextUrl.pathname.startsWith('/api/social-card/')`.
  - `src/__tests__/middleware.test.ts`: suite de 4 pruebas automatizadas para el middleware.
- **Rama:** `gemini/lp-fix-007-middleware-tarjetas-sociales`.
- **Issue:** `#60`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-13 | `IN_PROGRESS` | Creación de spec para corregir bloqueo de tarjetas sociales en middleware | Gemini |
| 2026-09-13 | `VERIFIED` | Excepción añadida en middleware, pruebas unitarias automatizadas y verificación completa | Gemini |
