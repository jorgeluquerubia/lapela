---
id: LP-FEAT-003
type: FEATURE
status: VERIFIED
priority: P1
requested_at: 2026-09-06
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/5
related_specs: [LP-FIX-001]
dependencies: [Supabase Auth]
cross_cutting_concerns: [SECURITY]
---

# LP-FEAT-003 · Recuperación de contraseña

## 1. Solicitud original

> Falta un link de "olvidé contraseña".

## 2. Contexto y problema

El acceso no permitía iniciar una recuperación, aunque Supabase Auth ya gestiona el envío de enlaces y la actualización segura de contraseña.

## 3. Resultado esperado

Una persona que no recuerda su contraseña puede solicitar un enlace desde el acceso, abrirlo en la web publicada y guardar una nueva contraseña sin intervención manual.

## 4. Alcance

### Incluido

- Enlace visible `¿Has olvidado tu contraseña?`.
- Formulario de solicitud con mensajes que no revelan si el email existe.
- Redirect a `/reset-password`.
- Formulario de nueva contraseña, confirmación y salida de la sesión de recuperación.

### Excluido

- Cambiar la contraseña desde el perfil autenticado.
- Recuperación por teléfono, OAuth o soporte manual.

## 5. Requisitos y reglas de negocio

- `REQ-01`: La solicitud requiere una dirección con formato de email.
- `REQ-02`: El enlace usa el origen actual y solo destinos permitidos por Supabase.
- `RULE-01`: El sistema responde con un mensaje genérico para una dirección inexistente.
- `RULE-02`: La nueva contraseña tiene al menos 8 caracteres y debe repetirse.

## 6. Criterios de aceptación

- [x] `AC-01` El acceso muestra el enlace y cambia a un formulario de recuperación.
- [x] `AC-02` El formulario llama a `resetPasswordForEmail` con redirect a `/reset-password`.
- [x] `AC-03` `/reset-password` permite guardar una contraseña nueva solo con una sesión de recuperación válida.
- [x] `AC-04` Se validan longitud y coincidencia y se muestran errores accesibles.
- [x] `AC-05` Tras guardar, se informa del cambio y se puede volver a iniciar sesión.

## 7. Experiencia y estados

- Estado inicial: acceso normal.
- Estado de solicitud: enviando, enviado o error por frecuencia.
- Estado de enlace: cargando, válido, caducado/usado o actualizado.
- El flujo funciona en móvil y escritorio y conserva foco visible.

## 8. Datos, API, seguridad y operación

- Usa Supabase Auth; no se almacenan tokens ni contraseñas en la aplicación.
- La página de restablecimiento no acepta una contraseña sin sesión válida.
- La entregabilidad depende del SMTP configurado en Supabase y de sus límites.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Build | Nueva ruta, tipos y cliente Auth correctos | `npm run build` | 2026-09-06 |
| Navegador | Enlace abre formulario y la ruta `/reset-password` existe | CUA en Vercel | 2026-09-06 |
| Endpoint | `/login` y `/reset-password` responden HTTP 200 | Smoke test publicado | 2026-09-06 |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisión:** No se revela si una dirección está registrada.
- **Riesgo:** El correo de recuperación comparte las limitaciones del SMTP de prueba.
- **Pregunta abierta:** Añadir cambio de contraseña desde el perfil cuando exista una sección de cuenta completa.

## 11. Implementación y trazabilidad

- `src/app/login/page.tsx` y `src/app/reset-password/page.tsx`.
- Redirect configurado con `window.location.origin`.
- Despliegue publicado en `https://lapela-nine.vercel.app`.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-06 | `VERIFIED` | Enlace, formulario, redirect y actualización de contraseña publicados | Codex |
