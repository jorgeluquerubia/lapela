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

## Validación de la integración conjunta

Los recorridos Stripe adicionales comprueban que el comprador no puede cerrar Checkout, que el vendedor puede expirar una sesión abierta antes de confirmar el cobro presencial y que repetir esa confirmación produce un único aviso. Se verifica el estado expired consultando Stripe y volviendo a abrir la página de Checkout. Un pago por tarjeta registrado por webhook conserva su modo de pago y bloquea la confirmación presencial.

Para estos recorridos, proporciona STRIPE_SECRET_KEY de prueba al runner. Los archivos de sesión pertenecen a cuentas ficticias de la misma instancia local, con un vendedor Connect de sandbox ya habilitado. El runner recibe los secretos mediante variables de entorno. Los secretos y las sesiones permanecen fuera del repositorio.

## Sesión guiada en el piloto

El escenario de edición guiada publica cinco artículos simulados en la base aislada, dos con cierre a las 24 horas y tres a las 48 horas. El informe Playwright identifica la ejecución. Los ejemplos de la web se consultan aparte en `/subastas?examples=1`.

Para una sesión con seis a ocho personas, usar el piloto con pagos simulados. Repartir dos papeles de venta y el resto de compra y puja. Documentar dispositivo, paso, expectativa y resultado. Alternar un iPhone y un Android físicos para los recorridos principales.

1. Empezar un anuncio, salir, volver al borrador y publicar con una foto.
2. Reservar una pieza, explicar qué ocurre con el pago y encontrar el pedido desde Por hacer.
3. Pujar en la edición. Un segundo comprador supera la puja y el primero vuelve desde Novedades. Tras un cierre, el ganador abre el pedido desde su aviso.
4. Registrar una incidencia de entrega. En soporte, localizar su referencia y marcarla como resuelta.
5. Con cuentas de prueba, comprobar llegada y apertura de los correos de confirmación y recuperación. Mailpit cubre la confirmación de registro y la recuperación de contraseña automatizadas. La entrega a buzones de invitados requiere verificar el proveedor del entorno que se use.

Entregar a cada participante su cuenta de prueba cuando se confirme la sesión.
