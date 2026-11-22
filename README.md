# La Pela

Marketplace español de segunda mano para comprar a precio cerrado o participar en subastas, sin regateos.

> **Para cualquier agente de IA:** empieza por [`AGENTS.md`](AGENTS.md), lee el contexto vigente en [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) y consulta [`SPEC_REGISTRY.md`](SPEC_REGISTRY.md). Toda solicitud de producto, corrección o infraestructura debe tener una ficha en [`specs/`](specs/) antes de implementarse.

El trabajo se sigue en [GitHub Issues](https://github.com/jorgeluquerubia/lapela/issues). Cada issue está vinculada a una spec, que conserva el detalle funcional y técnico.

La web se ha reconstruido alrededor de una regla sencilla: el precio queda fijado en el anuncio. El chat privado se habilita al reservar un artículo y permite acordar cómo se realizará el pago y la entrega.

## Estado actual

- Catálogo responsive con búsqueda, categorías, precios, ubicación, orden y filtro de subastas.
- Anuncios con precio cerrado o subasta, precio de compra inmediata, ampliación anti-sniping y cierre automático.
- Publicación con hasta seis fotografías, validación de tipo/tamaño y bloqueo de datos de contacto en el texto.
- Reservas atómicas y un solo pedido activo por artículo.
- Pedidos con estados de pago, envío, recepción, cancelación y disputa.
- Chat privado entre las partes de un pedido desde la reserva.
- Denuncia de anuncios y retirada de anuncios sin pujas.
- Modo de prueba activo: pagos simulados, sin cargos reales.
- Integración preparada para Stripe Connect cuando se decida abrir los cobros.

## Desarrollo

```text
npm install
npm run dev
npm run build
npm run specs:check
```

La aplicación local arranca en `http://localhost:3011` cuando se usa el puerto de la sesión actual. El catálogo de prueba contiene anuncios y cuentas separadas de la operación futura.

### Validación del MVP de beta

Con Node.js 22, Docker y Chromium de Playwright (`npx playwright install chromium`), prepara un Supabase local desde la raíz del repositorio. La prueba registra dos cuentas sintéticas y comprueba compra directa, pago simulado, subasta y caducidad de una reserva.

```bash
mvp_dir=$(mktemp -d)
mkdir "$mvp_dir/supabase"
cp tests/mvp/supabase.toml "$mvp_dir/supabase/config.toml"
cp -R supabase/migrations "$mvp_dir/supabase/"
docker network create --opt com.docker.network.bridge.host_binding_ipv4=127.0.0.1 lapela-mvp-local
npx --yes supabase@3.2.0 start --workdir "$mvp_dir" --network-id lapela-mvp-local \
  -x realtime,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
docker exec -i supabase_db_lapela-mvp psql -X -U postgres -v ON_ERROR_STOP=1 < tests/database/marketplace.sql
(
  source <(npx --yes supabase@3.2.0 status --workdir "$mvp_dir" -o env)
  NEXT_PUBLIC_SUPABASE_URL="$API_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY" \
    SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" LAPELA_MVP_MAIL_URL="${MAILPIT_URL:-$INBUCKET_URL}" \
    npm run test:e2e:mvp
)
npx --yes supabase@3.2.0 stop --workdir "$mvp_dir"
docker network rm lapela-mvp-local
```

El puerto `3081` debe estar libre para que Playwright arranque su propio servidor. `npm run test:e2e` sigue ejecutando las pruebas de navegación pública. El estado y la evidencia de la beta se registran en [LP-INFRA-006](specs/LP-INFRA-006-validacion-mvp.md).

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
