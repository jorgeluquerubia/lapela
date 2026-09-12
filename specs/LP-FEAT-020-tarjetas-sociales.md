---
id: LP-FEAT-020
type: FEATURE
status: READY
priority: P2
requested_at: 2026-09-12
requested_by: usuario
source: conversación
owner: producto
github_issue: https://github.com/jorgeluquerubia/lapela/issues/49
related_specs: [LP-FEAT-004, LP-FEAT-012, LP-FEAT-015]
dependencies: []
cross_cutting_concerns: [marketing, privacidad, imágenes, SEO]
---

# LP-FEAT-020 · Tarjetas sociales de anuncios

## 1. Solicitud original

> Generar tarjetas sociales automáticas con la fotografía, el título, el precio en euros, la equivalencia en pesetas y un enlace al anuncio para que vendedores y visitantes puedan compartirlo.

## 2. Contexto y problema

- **Problema u oportunidad:** Los anuncios disponen de metadatos sociales generales, pero la persona no cuenta con una pieza visual explícita y reconocible para compartir un artículo desde la interfaz.
- **Personas afectadas:** Vendedores que buscan difusión, compradores que recomiendan hallazgos y personas que descubren La Pela desde redes o mensajería.
- **Impacto actual:** Compartir depende de copiar la URL y de la previsualización que decida cada servicio, desaprovechando el precio en pesetas y la identidad visual como mecanismos de recuerdo.
- **Evidencia disponible:** Las fichas ya tienen URL canónica, fotografías públicas seguras y metadatos Open Graph; `LP-FEAT-016` define la equivalencia histórica.

## 3. Resultado esperado

Desde la ficha pública se puede previsualizar y compartir una tarjeta generada por La Pela que contiene solo información pública del anuncio: imagen principal, título, modalidad, precio en euros, equivalencia histórica en pesetas, marca y URL canónica. En dispositivos compatibles se usa compartir nativo y siempre existe una alternativa de copiar enlace o descargar la imagen.

## 4. Alcance

### Incluido

- Plantilla visual de relación estable, coherente con la identidad de La Pela y apta para redes y mensajería.
- Generación determinista a partir de datos públicos vigentes del anuncio.
- Precio principal en euros y equivalencia secundaria conforme a `LP-FEAT-016`.
- Acción `Compartir` con Web Share cuando esté disponible y alternativa accesible de copiar enlace/descargar tarjeta.
- Previsualización antes de descargar o invocar la acción nativa.
- Metadatos Open Graph y Twitter alineados con la tarjeta cuando sea técnicamente apropiado.

### Excluido

- Publicar automáticamente en una red, pedir acceso a cuentas sociales o integrar SDKs publicitarios.
- Incluir alias privado, comprador, pujas individuales, ubicación precisa, chat o datos de pedido.
- Permitir texto libre incrustado en la imagen durante el piloto.
- Crear múltiples formatos por red social o generar vídeo.

## 5. Requisitos y reglas de negocio

### Requisitos funcionales

- `RF-01`: La ficha debe ofrecer una acción `Compartir` que abra una previsualización de la tarjeta.
- `RF-02`: La tarjeta debe mostrar fotografía principal, título truncado de forma segura, modalidad, precio en euros, equivalencia en pesetas, marca y URL o identificador canónico.
- `RF-03`: En dispositivos compatibles, el usuario debe poder compartir mediante la capacidad nativa del sistema sin que La Pela publique en su nombre.
- `RF-04`: Cuando compartir nativo no esté disponible o se cancele, deben permanecer disponibles `Copiar enlace` y `Descargar imagen`.
- `RF-05`: La tarjeta debe reflejar precio y estado vigentes al generarse y rechazar anuncios no públicos o inexistentes.

### Requisitos no funcionales

- `RNF-01`: La generación debe completar dentro de un objetivo de 2 segundos en el percentil 95, excluyendo la descarga de una imagen de origen remota no cacheada.
- `RNF-02`: El endpoint debe validar el entorno del anuncio, evitar SSRF y utilizar únicamente imágenes públicas ya autorizadas por La Pela.
- `RNF-03`: La previsualización y controles deben ser accesibles por teclado, ofrecer texto alternativo y funcionar desde 320 píxeles.
- `RNF-04`: La plantilla debe conservar legibilidad cuando la imagen sea vertical, horizontal, clara u oscura.

### Reglas de negocio

- `RN-01`: El euro es el único precio comercial; las pesetas aparecen como equivalencia histórica secundaria.
- `RN-02`: La tarjeta nunca incluye datos que no sean visibles públicamente en la ficha.
- `RN-03`: La persona confirma la acción final en el selector nativo o descarga el archivo; La Pela no publica automáticamente.
- `RN-04`: Los anuncios de ejemplo, retirados o pertenecientes a otro entorno no generan tarjetas compartibles como si fueran ofertas activas.
- `RN-05`: La marca de La Pela permanece visible y la fotografía conserva atribución al anuncio mediante su URL canónica.

## 6. Criterios de aceptación

- [ ] `AC-01` En una ficha pública activa, `Compartir` muestra una tarjeta legible con imagen, título, modalidad, euro, pesetas y marca.
- [ ] `AC-02` El importe en pesetas coincide con `LP-FEAT-016` y nunca sustituye al euro ni aparece en los metadatos como moneda comercial.
- [ ] `AC-03` Un navegador compatible abre el selector nativo solo después de la acción del usuario; cancelar no publica ni muestra un error engañoso.
- [ ] `AC-04` Sin Web Share, copiar enlace y descargar imagen funcionan en móvil y escritorio.
- [ ] `AC-05` La tarjeta no contiene email, dirección, UUID, identidad del comprador, chat ni datos privados de pujas/pedidos.
- [ ] `AC-06` Anuncios retirados, privados, de otro entorno o inexistentes no producen una tarjeta activa compartible.
- [ ] `AC-07` Se validan variantes de imagen y texto, seguridad del generador, metadatos y responsive; build y `npm run specs:check` terminan correctamente.

## 7. Experiencia y estados

- **Estados normales:** Modal o panel con previsualización y acciones claras; feedback tras copiar el enlace o descargar.
- **Estados de error o vacío:** Imagen de reserva de marca si la principal falla; mensaje recuperable si no puede generarse; compartir cancelado no se considera error.
- **Mensajes y accesibilidad:** Foco gestionado, cierre con teclado, estados `Copiado` y `Descarga preparada` anunciados.
- **Responsive o canales afectados:** Ficha pública, navegador móvil y escritorio; previsualizaciones externas mediante metadatos.

## 8. Datos, API, seguridad y operación

- **Datos/modelo:** Sin persistencia obligatoria; se puede cachear por ID y versión pública del anuncio.
- **API/integraciones:** Endpoint de imagen social seguro y APIs nativas del navegador; sin conexión directa a redes sociales.
- **Autorización y privacidad:** Solo datos públicos del entorno activo; validación de URL de imagen contra almacenamiento permitido.
- **Observabilidad y soporte:** Medir generación, copia, descarga e intento de compartir, sin conocer la aplicación externa elegida.
- **Métricas o señales de éxito:** Tasa de uso de compartir, visitas referidas, publicación/venta atribuida y errores de generación.
- **Migración/rollback:** Ocultar la acción restaura el comportamiento de compartir URL y no afecta anuncios.

## 9. Plan de validación

| Comprobación | Resultado esperado | Evidencia | Fecha |
|---|---|---|---|
| Generación visual | Plantilla legible con variantes | Pendiente | |
| Privacidad y seguridad | Solo datos e imágenes autorizados | Pendiente | |
| Compartir y alternativas | Nativo, copia y descarga correctos | Pendiente | |
| Metadatos externos | URL canónica y EUR coherentes | Pendiente | |
| Rendimiento, build y specs | Umbral y comprobaciones correctos | Pendiente | |

## 10. Decisiones, riesgos y preguntas abiertas

- **Decisiones:** Compartir iniciado y confirmado por la persona; una plantilla inicial; generación desde datos públicos vigentes.
- **Riesgos y límites:** Algunas aplicaciones ignoran archivos o textos enviados por Web Share y reconstruyen la vista desde Open Graph. Se conservarán ambas vías sin prometer un resultado idéntico en todas las redes.
- **Preguntas abiertas:** Ninguna bloqueante.

## 11. Implementación y trazabilidad

- **Archivos o módulos:** Por determinar; generador de imagen, endpoint, ficha, modal/panel, metadatos, estilos y pruebas.
- **Migraciones/configuración:** No previstas; posible caché gestionada sin nueva fuente de verdad.
- **Commit o despliegue:** No implementado.
- **Notas de implementación:** Validar explícitamente las fuentes de imagen; no hacer fetch arbitrario de URLs aportadas por clientes.

## 12. Historial

| Fecha | Estado | Cambio | Autor/agente |
|---|---|---|---|
| 2026-09-12 | `READY` | Ficha e issue creadas; alcance preparado sin implementación | Codex |
