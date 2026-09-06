---
id: LP-DOC-002
type: DOC
status: VERIFIED
priority: P1
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
related_specs: [LP-DOC-001, LP-FEAT-001, LP-FEAT-002]
dependencies: []
cross_cutting_concerns: [INFRA, OPS, SECURITY]
---

# LP-DOC-002 · Contexto canónico de producto e infraestructura

## 1. Solicitud original

> Comprobar que existe un resumen claro de las funcionalidades actuales de La Pela, la descripción del proyecto y la infraestructura utilizada. Si falta información, incluirla donde cualquier IA pueda acceder rápidamente.

## 2. Contexto y problema

El `README.md` contiene una descripción y una lista funcional resumida, pero la infraestructura, los entornos, las rutas y los límites operativos están fragmentados. `ANALISIS_FUNCIONAL.md` describe parte de la versión legacy y puede inducir a una IA a usar rutas y conceptos retirados.

## 3. Resultado esperado

Un documento canónico en la raíz permite comprender en pocos minutos la visión del producto, el comportamiento actualmente disponible, la arquitectura, la infraestructura, los entornos, las variables de configuración, la seguridad, la validación y las limitaciones conocidas.

## 4. Alcance

### Incluido

- Crear `PROJECT_CONTEXT.md` en la raíz.
- Añadir `.env.example` como inventario seguro de configuración.
- Enlazarlo desde `AGENTS.md`, `README.md` y el registro de specs.
- Describir producto, funcionalidades actuales, reglas, arquitectura, infraestructura, entornos y operación.
- Identificar de forma explícita documentación y rutas legacy.

### Excluido

- Cambiar funcionalidades, infraestructura o configuración desplegada.
- Reescribir el análisis histórico completo.
- Incluir secretos, credenciales o datos personales.

## 5. Requisitos y reglas de negocio

- `REQ-01`: El documento debe reflejar el código y el despliegue actuales, no la intención histórica.
- `REQ-02`: Debe distinguir capacidades activas, preparadas pero desactivadas y legacy.
- `RULE-01`: `PROJECT_CONTEXT.md` será la fuente canónica para contexto general; las specs conservan la trazabilidad por solicitud.
- `RULE-02`: Las variables se documentan por nombre y propósito, nunca por valor secreto.

## 6. Criterios de aceptación

- [x] `AC-01` El contexto explica propuesta de valor, usuarios y principios de La Pela.
- [x] `AC-02` Enumera los flujos y funcionalidades activas y sus límites actuales.
- [x] `AC-03` Documenta arquitectura, servicios, datos, autenticación, almacenamiento, pagos y despliegue.
- [x] `AC-04` Incluye entornos, variables, rutas principales, validación y estado operativo conocido.
- [x] `AC-05` Distingue claramente la versión activa del código y documentación legacy.
- [x] `AC-06` El documento se encuentra desde `AGENTS.md` y `README.md` y todos los enlaces son válidos.

## 7. Experiencia y estados

- La lectura inicial debe llevar de `AGENTS.md` a `PROJECT_CONTEXT.md` y después a las specs relacionadas.
- La información debe ser escaneable por humanos y procesable por agentes de IA.
- Las limitaciones deben expresarse como estado actual, no como funcionalidades terminadas.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** inventario de tablas `lp_*`, estados y funciones transaccionales.
- **API/integraciones:** rutas activas, Supabase, Vercel y Stripe.
- **Autorización y privacidad:** separación entre cliente, backend y service role.
- **Observabilidad y soporte:** limitaciones actuales documentadas.
- **Métricas o señales de éxito:** otra IA localiza y comprende el contexto sin revisar toda la conversación.
- **Migración/rollback:** cambio únicamente documental y reversible por Git.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Inventario | Funcionalidades e infraestructura coinciden con código y migraciones | Revisión de `src`, `supabase/migrations` y configuración | 2026-09-06 |
| Enlaces | No existen referencias internas rotas | 32 enlaces comprobados, 0 rotos | 2026-09-06 |
| Configuración | Todas las variables usadas están inventariadas | 8 usadas, 8 documentadas, 0 ausentes | 2026-09-06 |
| Consistencia | El análisis antiguo aparece como histórico | Aviso y enlaces canónicos añadidos | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** Crear un documento raíz separado para evitar convertir el README en un manual extenso.
- **Riesgo:** El contexto puede quedar obsoleto si una futura spec no lo actualiza cuando cambia el comportamiento global.
- **Pregunta abierta:** Ninguna bloqueante.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** `PROJECT_CONTEXT.md`, `.env.example`, `AGENTS.md`, `README.md`, `ANALISIS_FUNCIONAL.md`, `SPEC_REGISTRY.md`.
- **Migraciones/configuración:** ninguna.
- **Commit o despliegue:** documentación versionada en `main`; no requiere despliegue web.
- **Notas de implementación:** la auditoría detectó que la documentación funcional existente corresponde parcialmente a la API legacy.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `IN_PROGRESS` | Auditoría y creación de la spec | Codex |
| 2026-09-06 | `VERIFIED` | Contexto, inventario de configuración, enlaces y aviso legacy comprobados | Codex |
