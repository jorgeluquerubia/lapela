---
id: LP-FIX-001
type: FIX
status: VERIFIED
priority: P1
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/4
related_specs: [LP-FEAT-003]
dependencies: [Supabase Auth]
cross_cutting_concerns: [SECURITY, OPS]
---

# LP-FIX-001 · Recuperación del correo de verificación

## 1. Solicitud original

> Me he registrado pero no me llega el correo de verificación.

## 2. Contexto y problema

El portal usaba `http://localhost:3000` como URL de sitio en Supabase y la pantalla de registro no ofrecía una recuperación clara. La cuenta revisada correspondía a un registro repetido de una cuenta que ya estaba confirmada, por lo que no se generó un nuevo correo.

## 3. Resultado esperado

Una cuenta pendiente puede recibir de nuevo el correo y llegar a la web publicada. Una cuenta ya confirmada recibe una explicación útil y se dirige a iniciar sesión, sin aparentar que existe una verificación pendiente.

## 4. Alcance

### Incluido

- Corregir Site URL y redirect allow list de Supabase.
- Mostrar estados diferenciados para alta nueva, cuenta ya confirmada y registro repetido.
- Añadir reenvío de verificación en registro e inicio de sesión cuando procede.
- Mensajes sobre Spam/Promociones y límites de frecuencia.

### Excluido

- Configurar un proveedor SMTP propio sin credenciales del propietario.
- Desactivar la confirmación de correo.

## 5. Requisitos y reglas de negocio

- `REQ-01`: Los enlaces de confirmación de producción deben volver a `https://lapela-nine.vercel.app`.
- `REQ-02`: El reenvío conserva el destino del entorno actual.
- `RULE-01`: Una cuenta ya confirmada debe poder iniciar sesión sin esperar otro correo.
- `RULE-02`: Los errores de límite de correo se explican sin revelar si una dirección pertenece al sistema.

## 6. Criterios de aceptación

- [x] `AC-01` Supabase tiene la URL publicada como `site_url` y permite el redirect de producción y desarrollo.
- [x] `AC-02` Registro e inicio de sesión ofrecen reenvío para una cuenta pendiente.
- [x] `AC-03` Un registro repetido de una cuenta confirmada guía a iniciar sesión y no muestra un éxito falso.
- [x] `AC-04` La UI menciona revisar Spam/Promociones y trata el rate limit de forma comprensible.
- [x] `AC-05` La compilación y la ruta publicada responden correctamente.

## 7. Experiencia y estados

- Éxito pendiente: revisar correo y botón de reenvío.
- Cuenta ya confirmada: iniciar sesión directamente.
- Límite de frecuencia: esperar unos minutos.
- El correo no se confirma automáticamente; la verificación sigue activa.

## 8. Datos, API, seguridad y operación

- Se actualizó la configuración Auth de Supabase mediante Management API.
- No se expusieron direcciones, tokens ni credenciales en el código o en esta ficha.
- El remitente integrado de Supabase sigue siendo de prueba; el SMTP propio queda como dependencia de producción.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Auditoría Auth | El intento se identifica como repetido para una cuenta ya confirmada | Revisión de `auth.users` y auditoría | 2026-09-06 |
| Configuración Auth | Site URL y allow list apuntan a producción | GET/PATCH de configuración Auth | 2026-09-06 |
| UI publicada | Registro e inicio muestran los estados esperados | Comprobación CUA en Vercel | 2026-09-06 |
| Build | Tipos y páginas correctos | `npm run build` | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** Se mantiene confirmación de correo obligatoria.
- **Riesgo:** El SMTP de prueba de Supabase limita y no garantiza la entrega a usuarios generales.
- **Pregunta abierta:** Configurar SMTP propio antes de captar usuarios fuera del equipo.

## 11. Implementación y trazabilidad

- `src/app/register/page.tsx`, `src/app/login/page.tsx`, `src/app/globals.css`.
- Configuración Auth del proyecto `lapela-app` en Supabase.
- Despliegue publicado en `https://lapela-nine.vercel.app`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `VERIFIED` | Diagnóstico, corrección de URL, reenvío y mensajes de cuenta existente | Codex |
