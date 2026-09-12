---
id: LP-FEAT-018
type: FEATURE
status: READY
priority: P1
requested_at: 2026-09-12
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/47
related_specs: [LP-FEAT-009, LP-FEAT-010, LP-FEAT-011]
dependencies: [LP-FEAT-010]
cross_cutting_concerns: [notificaciones, privacidad, base de datos, operación]
---

# LP-FEAT-018 · Favoritos y alertas de artículos

## 1. Solicitud original

> Añadir seguimiento de artículos y alertas: botón para guardar, lista de favoritos y avisos cuando una subasta está a punto de terminar, recibe actividad relevante o deja de estar disponible.

## 2. Contexto y problema

- **Problema u oportunidad:** La plataforma notifica eventos a participantes de pedidos y pujas, pero una persona interesada todavía no puede guardar un anuncio ni volver a él sin buscarlo de nuevo.
- **Personas afectadas:** Personas autenticadas que comparan artículos o quieren decidir más adelante, especialmente potenciales pujadores.
- **Impacto actual:** Se pierde intención de compra, las subastas dependen de que el interesado recuerde el cierre y no existe una superficie privada de seguimiento.
- **Evidencia disponible:** `LP-FEAT-010` aporta campana y notificaciones persistentes que pueden reutilizarse, pero no modela favoritos ni seguidores de un anuncio.

## 3. Resultado esperado

Una cuenta puede guardar y retirar artículos desde catálogo o ficha, consultar una lista privada de favoritos y recibir avisos internos útiles sobre su disponibilidad y el cierre próximo de subastas, sin que vendedor ni otros usuarios conozcan su identidad.

## 4. Alcance

### Incluido

- Acción idempotente de guardar o retirar favorito en catálogo y ficha.
- Sección privada `Favoritos` con estado, precio/puja y acceso al anuncio.
- Contador agregado de favoritos para el vendedor, sin identidades.
- Aviso interno al seguidor cuando una subasta favorita entra en su última hora, termina o el anuncio deja de estar disponible.
- Aviso interno cuando una persona ya pujadora es superada, reutilizando los eventos existentes sin duplicarlos.
- Tarea programada idempotente para crear avisos temporales una sola vez.

### Excluido

- Emails, push móvil, SMS o calendario externo.
- Avisos por cada nueva puja a personas que solo marcaron favorito.
- Publicar quién guardó un artículo.
- Recomendaciones personalizadas basadas en favoritos.
- Cambios automáticos de precio.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: Una cuenta autenticada debe poder guardar o retirar un anuncio mediante una acción idempotente.
- `RF-02`: La cuenta debe disponer de una vista privada con todos sus favoritos y el estado actual de cada anuncio.
- `RF-03`: El sistema debe generar un único aviso interno una hora antes del cierre de una subasta favorita que continúe disponible.
- `RF-04`: El sistema debe avisar cuando una subasta favorita termina o el anuncio favorito se vende, retira o expira.
- `RF-05`: El vendedor debe ver únicamente el número agregado de favoritos de sus anuncios.
- `RF-06`: Una sobrepuja ya notificada por el sistema actual no debe producir un duplicado por tener el artículo en favoritos.

### Requisitos no funcionales

- `RNF-01`: Guardar y retirar debe responder de forma idempotente ante reintentos y dobles pulsaciones.
- `RNF-02`: Ninguna respuesta pública o dirigida al vendedor debe revelar IDs, aliases ni otras identidades de seguidores.
- `RNF-03`: La generación programada debe tolerar ejecuciones repetidas y crear como máximo un aviso por usuario, artículo y tipo de evento.
- `RNF-04`: Los controles deben disponer de nombre y estado accesibles mediante `aria-pressed` o semántica equivalente.

### Reglas de negocio

- `RN-01`: Los favoritos son privados; el vendedor solo conoce el total agregado.
- `RN-02`: Retirar un favorito impide nuevos avisos, pero no borra notificaciones ya entregadas.
- `RN-03`: Guardar un anuncio propio puede bloquearse o tratarse como acción neutra; no contará en el agregado del vendedor.
- `RN-04`: Una alerta no reserva el artículo ni otorga preferencia de compra.
- `RN-05`: El cierre y anti-sniping de la subasta mantienen las reglas existentes; el aviso no garantiza una hora final inmutable.

## 6. Criterios de aceptación

- [ ] `AC-01` Una persona autenticada guarda un artículo desde catálogo o ficha y lo ve en `Favoritos`; una segunda pulsación lo retira sin registros duplicados.
- [ ] `AC-02` Una persona no autenticada que intenta guardar recibe invitación a entrar y no se crea un favorito anónimo.
- [ ] `AC-03` Una subasta favorita genera una sola notificación cuando entra en su última hora y otra al terminar, aunque la tarea se reintente.
- [ ] `AC-04` Si la subasta se amplía por anti-sniping, la interfaz muestra el cierre vigente y no promete una hora ya superada.
- [ ] `AC-05` El vendedor ve un total agregado correcto, pero no puede consultar quién guardó el anuncio.
- [ ] `AC-06` Venta, retirada o expiración se reflejan en la lista y generan como máximo un aviso de indisponibilidad por seguidor.
- [ ] `AC-07` Pruebas de autorización, idempotencia, tarea programada, interfaz y responsive, además del build y `npm run specs:check`, terminan correctamente.

## 7. Experiencia y estados

- **Estados normales:** Icono guardar con estado activado; lista ordenada por actividad o cierre próximo; badges de estado existentes.
- **Estados de error o vacío:** Favoritos vacío con acceso al catálogo; si el anuncio desaparece se conserva temporalmente una fila informativa sin acción de compra.
- **Mensajes y accesibilidad:** Estado anunciado como `Guardado en favoritos` o `Eliminado de favoritos`; no depender del icono o color.
- **Responsive o canales afectados:** Cabecera o Mi actividad, catálogo y ficha en móvil y escritorio.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Tabla relacional única por `user_id` y `listing_id`; deduplicación de eventos temporales de notificación.
- **API/integraciones:** Endpoints autenticados para alternar/listar; ampliación segura de catálogo y detalle con `is_favorite` solo para la sesión propia.
- **Autorización y privacidad:** El backend deriva el usuario de la sesión; ninguna lista de seguidores se expone.
- **Observabilidad y soporte:** Registrar resultado agregado de la tarea programada, errores y latencia sin IDs personales en logs ordinarios.
- **Métricas o señales de éxito:** Guardados por anuncio, retorno a favoritos, favoritos que terminan en puja/compra y entrega de alertas sin duplicados.
- **Migración/rollback:** Migración aditiva; desactivar controles y tarea no afecta anuncios ni pedidos.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Base de datos y autorización | Favoritos privados y únicos | Pendiente | |
| Tarea programada | Avisos únicos y puntuales | Pendiente | |
| Integración de notificaciones | Sin duplicar eventos existentes | Pendiente | |
| Revisión responsive y accesible | Estados comprensibles | Pendiente | |
| Build y specs | Comprobaciones sin errores | Pendiente | |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Avisos solo internos en esta fase; una hora antes del cierre; identidad del seguidor siempre privada.
- **Riesgos y límites:** La programación fiable requiere desplegar y supervisar una tarea periódica. Anti-sniping puede mover el cierre después del aviso inicial.
- **Preguntas abiertas:** Ninguna bloqueante.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** Por determinar; migración, modelo, controlador, endpoints, campana, catálogo, ficha, actividad y pruebas.
- **Migraciones/configuración:** Tabla de favoritos e idempotencia; programación de tarea de alertas.
- **Commit o despliegue:** No implementado.
- **Notas de implementación:** Reutilizar el modelo vigente de notificaciones y sus reglas de lectura.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-12 | `READY` | Ficha e issue creadas; alcance preparado sin implementación | Codex |
