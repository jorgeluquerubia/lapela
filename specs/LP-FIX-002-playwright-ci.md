---
id: LP-FIX-002
type: FIX
status: IMPLEMENTED
priority: P1
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/17
related_specs: []
dependencies: []
cross_cutting_concerns: [CI, pruebas E2E, Supabase]
---

# LP-FIX-002 · Playwright funcional en pull requests

## 1. Solicitud original

> "por cierto la PR que ha creado da errores de playwright, la PR #14"

## 2. Contexto y problema

- **Problema u oportunidad:** el workflow de Playwright intenta iniciar Next.js sin las variables públicas mínimas de Supabase, por lo que el servidor termina antes de ejecutar ninguna prueba.
- **Personas afectadas:** agentes y responsables que revisan pull requests.
- **Impacto actual:** la PR #14 y cualquier PR equivalente muestran un fallo E2E que no informa sobre la calidad de la funcionalidad.
- **Evidencia disponible:** el log del job `test` indica `Missing Supabase URL or Anon Key` y agota los 60 segundos de `webServer`.

## 3. Resultado esperado

Las pull requests arrancan la aplicación con una configuración de prueba segura, ejecutan recorridos E2E representativos de la versión vigente y muestran un resultado útil para decidir si integrar el cambio.

## 4. Alcance

### Incluido

- Proporcionar valores no secretos y exclusivos de prueba para iniciar la aplicación en CI.
- Sustituir el recorrido legacy por una prueba estable del catálogo y la ficha semántica de un artículo.
- Actualizar el contexto canónico para reflejar el estado real de Playwright.
- Aplicar la corrección a la PR #14 después de integrarla en `main`.

### Excluido

- Probar operaciones reales contra Supabase o datos de producción.
- Cubrir en E2E autenticación, publicación, compra o pagos.
- Cambiar el comportamiento funcional de LP-FEAT-005.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: El workflow debe iniciar La Pela y ejecutar la navegación desde el catálogo hasta una ficha pública.

### Requisitos no funcionales

- `RNF-01`: La prueba no debe requerir secretos, cuentas ni servicios externos disponibles.
- `RNF-02`: Un fallo de arranque debe quedar separado de un fallo del recorrido y producir artefactos de Playwright.

### Reglas de negocio

- `RN-01`: La configuración ficticia de CI no puede habilitar pagos reales ni acceder al proyecto Supabase de producción.

## 6. Criterios de aceptación

- [x] `AC-01` Dada una pull request, cuando se ejecuta el workflow, entonces Next.js arranca sin secretos de Supabase.
- [x] `AC-02` Dado el catálogo de demostración, cuando Playwright abre el inicio y selecciona un artículo, entonces llega a su ruta semántica y muestra la descripción.
- [x] `AC-03` El workflow completo de Playwright finaliza correctamente en GitHub Actions.
- [ ] `AC-04` La PR #14 deja de fallar por esta causa y queda actualizada con `main`.

## 7. Experiencia y estados

- Estados normales: catálogo con datos de demostración y ficha pública.
- Estados de error o vacío: la prueba controla la respuesta del catálogo para ser determinista.
- Mensajes y accesibilidad: se usan roles y nombres visibles en las aserciones.
- Responsive o canales afectados: navegador de escritorio en CI.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** producto ficticio interceptado en la prueba.
- **API/integraciones:** el catálogo de demostración evita dependencias de red; Supabase usa una URL y claves sintéticas solo para arrancar.
- **Autorización y privacidad:** no se emplean credenciales ni datos reales.
- **Observabilidad y soporte:** informe HTML y trazas de Playwright como artefactos del job.
- **Métricas o señales de éxito:** job `test` verde en la PR de la corrección y en la PR #14.
- **Migración/rollback:** revertir el commit de workflow y prueba.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Playwright local con entorno equivalente a CI | Recorrido verde | Chromium: 1 prueba superada en 4,2 s | 2026-09-06 |
| `npm run specs:check` | Registro coherente | 12 fichas y 23 documentos válidos | 2026-09-06 |
| GitHub Actions | Jobs `validate` y `test` verdes | PR #18: `validate` en 9 s y `test` en 1 min 40 s | 2026-09-06 |
| PR #14 actualizada | Sin conflicto y Playwright verde | Pendiente | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** aislar la E2E de Supabase para probar navegación y no disponibilidad de servicios externos.
- **Riesgos y límites:** este smoke test no valida persistencia ni permisos de base de datos.
- **Preguntas abiertas:** ninguna.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `.github/workflows/playwright.yml`, `tests/navigation.spec.ts`, `PROJECT_CONTEXT.md`.
- **Migraciones/configuración:** variables sintéticas en el job de CI.
- **Commit o despliegue:** commit `7df1bcb`; PR [#18](https://github.com/jorgeluquerubia/lapela/pull/18).
- **Notas de implementación:** rama `codex/lp-fix-002-playwright-ci`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `IN_PROGRESS` | Diagnóstico y creación de la ficha | Codex |
| 2026-09-06 | `IN_PROGRESS` | Configuración sintética y smoke test validados localmente | Codex |
| 2026-09-06 | `IMPLEMENTED` | PR #18 abierta; validación de GitHub pendiente | Codex |
| 2026-09-06 | `IMPLEMENTED` | CI completa verde; pendiente aplicar a PR #14 | Codex |
