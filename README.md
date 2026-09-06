# La Pela

Marketplace español de segunda mano para comprar a precio cerrado o participar en subastas, sin regateos.

La web se ha reconstruido alrededor de una regla sencilla: el precio queda fijado en el anuncio. El chat no aparece antes de la compra; se habilita únicamente cuando el pedido está pagado y sirve para organizar envío o recogida.

## Estado actual

- Catálogo responsive con búsqueda, categorías, precios, ubicación, orden y filtro de subastas.
- Anuncios con precio cerrado o subasta, precio de compra inmediata, ampliación anti-sniping y cierre automático.
- Publicación con hasta seis fotografías, validación de tipo/tamaño y bloqueo de datos de contacto en el texto.
- Reservas atómicas y un solo pedido activo por artículo.
- Pedidos con estados de pago, envío, recepción, cancelación y disputa.
- Chat privado ligado a un pedido pagado.
- Denuncia de anuncios y retirada de anuncios sin pujas.
- Modo de prueba activo: pagos simulados, sin cargos reales.
- Integración preparada para Stripe Connect cuando se decida abrir los cobros.

## Desarrollo

```text
npm install
npm run dev
npm run build
```

La aplicación local arranca en `http://localhost:3011` cuando se usa el puerto de la sesión actual. El catálogo de prueba contiene anuncios y cuentas separadas de la operación futura.

## Arquitectura MVC

- `src/models`: acceso a Supabase, mapeo de anuncios y funciones de dominio.
- `src/controllers`: endpoints de catálogo, publicaciones, pujas, reservas, pedidos, chat y pagos.
- `src/app` y `src/components`: vistas responsive y navegación del usuario.
- `supabase/migrations`: tablas, índices, RLS y funciones transaccionales.

Las rutas antiguas de compra, pujas, preguntas y mensajería se conservan en `archive/legacy-api` para consulta y responden con `410`; no pueden saltarse las reglas de la nueva versión.

## Datos y pagos

La migración nueva usa tablas `lp_*` para separar el modelo renovado del esquema anterior. Las operaciones críticas se ejecutan mediante funciones PostgreSQL con bloqueo de fila e idempotencia.

En modo `simulated`, comprar reserva el artículo y permite confirmar un pago simulado desde el pedido. En modo real, el checkout se crea en Stripe y solo el webhook firmado puede marcar el pedido como pagado.

Antes de abrir cobros reales hay que configurar Stripe Connect, el webhook, las condiciones del servicio, privacidad, soporte e incidencias. El cambio de modo de prueba a real es deliberado y queda protegido por configuración del entorno.
