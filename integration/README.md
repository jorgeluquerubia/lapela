# Integración multiusuario de La Pela

Cinco cuentas ficticias con alias únicos y una visita sin sesión. Dos personas venden y publican, dos compran y compiten, y una observa, sigue anuncios y prueba los límites de acceso. Las fotos se generaron para esta suite. Los registros se identifican por un sufijo de ejecución para poder inspeccionarlos después en el entorno local.

| Anuncio | Categoría y estado | Modalidad | Entrega | Precio de referencia |
| --- | --- | --- | --- | --- |
| Radio portátil Bruma | Tecnología, con señales de uso | Precio fijo | Recogida | 25 € |
| Lámpara de cerámica Ámbar | Hogar, como nuevo | Precio fijo | Envío | 39,50 € + 6,25 € |
| Mochila Abeto | Deporte, buen estado | Subasta | Envío | 18 € + 4 € |
| Explorador Órbita | Coleccionismo, con señales de uso | Subasta con compra inmediata | Recogida | Salida de 20 €, compra inmediata de 55 € |
| Abrigo Granate | Moda, buen estado | Precio fijo | Envío | 28 € + 5,75 € |
| Cepillo Cedro | Otros, con señales de uso | Precio fijo | Recogida | 32 € |

| Flujo | Verificaciones |
| --- | --- |
| Catálogo | Publicación por dos vendedores, fotos propias, búsqueda, ficha en móvil, historia opcional y filtros combinados |
| Validación | Contacto, pagos externos en la historia, precio mínimo y decimales, categoría, fotos, formatos, fecha y acceso anónimo |
| Comunidad | Preguntas, moderación del regateo, visibilidad pública, favoritos, contador y retirada |
| Reserva | Compra del propio anuncio, carrera entre dos compradores, reintento y privacidad del chat |
| Recogida | Confirmación exclusiva del vendedor y anuncio vendido |
| Envío | Gastos, pago repetido, avisos, chat, seguimiento, recepción y dos valoraciones |
| Subasta | Autopuja, mínimo, sobrepuja, prórroga, pujas concurrentes, retirada bloqueada, adjudicación y cierre sin pujas |
| Compra inmediata | Precio fijo de la subasta, ganador de la compra y final de las pujas |
| Caducidad | Liberación de reserva vencida, rechazo del pago tardío y segunda venta |

## Ejecución

Arranca la app en modo `simulated` y Supabase local con las migraciones aplicadas. Usa una instancia de prueba cuyo catálogo puedas modificar. Proporciona en el entorno del runner `LAPELA_INTEGRATION_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `LAPELA_PAYMENTS_MODE=simulated`. Las dos URLs deben ser loopback. La clave de servicio prepara cuentas confirmadas y adelanta únicamente los vencimientos de las filas creadas en la prueba. Cada sesión entra por el formulario habitual. Para verificar también el registro y la confirmación de correo, proporciona `LAPELA_INTEGRATION_MAIL_URL` con la URL de Mailpit en loopback.

```sh
npx playwright install chromium
npx playwright test --config playwright.integration.config.ts
```

La suite utiliza el proveedor de pagos simulado de la app para repetir los recorridos comerciales sin una cuenta externa. La prueba con Stripe Checkout usa un sandbox dedicado y su webhook firmado. El informe HTML se guarda en `playwright-report/integration/`.


Para ejecutar también Stripe, proporciona `LAPELA_STRIPE_INTEGRATION_URL`, `LAPELA_STRIPE_SELLER_STATE` y `LAPELA_STRIPE_BUYER_STATE`. Son la URL local del piloto en modo `stripe_test` y los archivos Playwright de una cuenta ficticia Connect con cobros ya activos y una cuenta compradora ficticia. El piloto necesita recibir el webhook firmado del sandbox. Conserva esos archivos de sesión fuera del repositorio. La prueba rechaza una tarjeta, reintenta el mismo pedido con una tarjeta válida y espera la confirmación por webhook.

## Auditoría de integridad

Ejecuta `psql -X -v ON_ERROR_STOP=1 -f integration/audit-integrity.sql` desde una conexión a la base local del piloto. La auditoría usa una transacción de solo lectura y muestra recuentos de coherencia de importes, pedidos, anuncios, pujas, avisos, mensajes y valoraciones. Véanse [los hallazgos reproducidos](integrity-findings.md).
