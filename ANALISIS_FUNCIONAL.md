# Análisis Funcional de la Aplicación (Marketplace)

Este documento detalla el análisis funcional de la aplicación de marketplace, describiendo sus entidades principales, flujos de trabajo y funcionalidades clave.

## 1. Resumen del Proyecto

La aplicación es un marketplace que combina características de plataformas como Wallapop y eBay. Su objetivo es ofrecer la inmediatez de un mercado de segunda mano con la emoción de las subastas, eliminando el regateo.

## 2. Entidades Principales

Las entidades de datos fundamentales de la aplicación son:

-   **Product**: Representa un artículo a la venta. Puede ser de venta directa o subasta. Contiene información como nombre, descripción, precio (o puja inicial), categoría, imágenes, estado de la venta, etc.
-   **Profile**: Representa a un usuario del sistema. Contiene información básica como nombre de usuario, avatar y email.
-   **Bid**: Representa una puja realizada por un usuario en un producto de tipo subasta.
-   **Question**: Representa una pregunta hecha por un usuario sobre un producto, junto con su posible respuesta por parte del vendedor.
-   **Order**: Representa una transacción de compra, vinculando un producto, un comprador y un vendedor.
-   **ShippingAddress**: Almacena las direcciones de envío de los usuarios.
-   **Message**: Representa un mensaje en el chat entre usuarios sobre un producto.

## 3. Funcionalidades Principales (API Endpoints)

A continuación se detallan los flujos de trabajo y las funcionalidades implementadas a través de la API REST.

### 3.1. Gestión de Productos

-   **`GET /api/products`**:
    -   Obtiene una lista paginada de productos.
    -   Permite filtrar por término de búsqueda, categoría, rango de precios y ubicación.
    -   Excluye productos que ya han sido pagados.
    -   Para productos vendidos, enriquece la respuesta con el nombre de usuario del comprador.

-   **`POST /api/products`**:
    -   (No analizado directamente, pero se infiere que existe para la creación de nuevos productos).
    -   Requiere autenticación de usuario.

-   **`GET /api/products/[id]`**:
    -   Obtiene los detalles completos de un único producto.

-   **`PUT /api/products/[id]`**:
    -   Actualiza los detalles de un producto.
    -   Requiere autenticación y verifica que el usuario sea el propietario del producto.

-   **`DELETE /api/products/[id]`**:
    -   Elimina un producto.
    -   Requiere autenticación y verifica que el usuario sea el propietario del producto.

-   **`GET /api/user-products`**:
    -   Obtiene un listado de todos los productos asociados a un usuario, tanto los que ha puesto a la venta como los que ha comprado.
    -   Requiere autenticación de usuario.
    -   Filtra los productos donde el `user_id` (vendedor) o el `buyer_id` (comprador) coincide con el del usuario autenticado.
    -   Devuelve la lista de productos ordenada por fecha de creación descendente.

### 3.2. Flujo de Compra Directa

1.  **Iniciar Compra (`POST /api/products/[id]/buy`)**:
    -   Un usuario autenticado inicia la compra de un producto.
    -   Se valida que el comprador no sea el vendedor.
    -   Se invoca una función de base de datos (`create_order_and_reserve_product`) que, de forma atómica:
        -   Crea una nueva orden con estado "pending".
        -   Actualiza el estado del producto para reservarlo.
    -   Devuelve la orden recién creada.

2.  **Realizar Pago (`POST /api/orders/[id]/pay`)**:
    -   El comprador confirma el pago de una orden existente.
    -   Requiere la ID de la dirección de envío (`shipping_address_id`).
    -   Invoca una función de base de datos (`pay_order_and_update_product`) que:
        -   Actualiza el estado de la orden a "paid".
        -   Actualiza el estado del producto a "sold" o "paid".
    -   Devuelve la orden actualizada.

### 3.3. Flujo de Subastas

1.  **Realizar una Puja (`POST /api/bids`)**:
    -   Un usuario autenticado realiza una puja por un producto de tipo "auction".
    -   Se valida que:
        -   El producto sea una subasta.
        -   El usuario no sea el propietario del producto.
        -   El importe de la puja sea superior al precio/puja actual.
    -   Se inserta un nuevo registro en la tabla `bids`.
    -   Se actualiza el `price` y `bid_count` del producto.
    -   **Nota**: La inserción de la puja y la actualización del producto no son una operación atómica en el código del endpoint, lo que podría mejorarse con una función RPC.

2.  **Ver Pujas (`GET /api/products/[id]/bids`)**:
    -   Obtiene el historial de pujas para un producto.
    -   Enriquece cada puja con el nombre de usuario del pujador.

### 3.4. Sistema de Preguntas y Respuestas

1.  **Hacer una Pregunta (`POST /api/questions`)**:
    -   Un usuario autenticado publica una pregunta sobre un producto.
    -   La pregunta se asocia al producto y al usuario.

2.  **Ver Preguntas (`GET /api/questions?product_id=[id]`)**:
    -   Obtiene todas las preguntas (y sus respuestas) para un producto.
    -   Enriquece cada pregunta con el nombre de usuario de quien la formuló.

3.  **Responder una Pregunta (`PATCH /api/questions/[id]`)**:
    -   El vendedor del producto (o un usuario autorizado) añade una respuesta a una pregunta existente.
    -   Se actualiza el registro de la pregunta con el texto de la respuesta y la fecha.

## 4. Consideraciones de Diseño y Arquitectura

-   **Uso de Supabase**: La aplicación utiliza Supabase como backend, aprovechando su base de datos PostgreSQL, autenticación y funciones serverless.
-   **Funciones RPC (Remote Procedure Call)**: Se hace un uso inteligente de las funciones de la base de datos para encapsular lógica de negocio crítica y transaccional (ej. crear orden y reservar producto). Esto garantiza la atomicidad y la integridad de los datos en operaciones complejas.
-   **Seguridad**: Los endpoints de modificación y eliminación de recursos implementan comprobaciones de propiedad, asegurando que solo los usuarios autorizados puedan realizar cambios. La autenticación se gestiona mediante tokens (probablemente JWT de Supabase).
-   **API RESTful**: La estructura de la API sigue en gran medida los principios REST, con una organización lógica de los recursos.
-   **Enriquecimiento de Datos**: Varios endpoints `GET` no solo devuelven los datos crudos, sino que los enriquecen con información relacionada (ej. nombres de usuario), simplificando el trabajo del frontend.
