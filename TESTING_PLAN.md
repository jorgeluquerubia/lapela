# Plan de Testing para la Aplicación "Lapela"

## 1. Introducción

El propósito de este documento es establecer una estrategia de testing clara y completa para la aplicación "Lapela". Los objetivos principales de esta estrategia son:

-   **Aumentar la confianza** en la calidad y estabilidad del software.
-   **Prevenir regresiones** al introducir nuevos cambios o refactorizar el código existente.
-   **Mejorar la mantenibilidad** del código a largo plazo.
-   **Validar** que la aplicación cumple con los requisitos funcionales y de negocio.

## 2. Estrategia de Testing (Pirámide de Testing)

Adoptaremos un enfoque basado en la pirámide de testing para equilibrar la velocidad, el coste y la fiabilidad de nuestra suite de tests.

-   **Tests Unitarios (Base):** Serán la base de nuestra estrategia. Son rápidos de ejecutar y se centran en componentes de UI y funciones de lógica de negocio de forma aislada.
-   **Tests de Integración (Medio):** Verificarán que múltiples unidades (componentes, servicios, hooks) funcionan correctamente juntas. Se centrarán principalmente en las páginas de la aplicación.
-   **Tests End-to-End (Cima):** Simularán flujos de usuario completos en un navegador real. Son más lentos y frágiles, por lo que se reservarán para los flujos más críticos.

## 3. Herramientas y Frameworks

-   **Tests Unitarios y de Integración:** Jest + React Testing Library.
-   **Tests End-to-End (E2E):** Playwright.

## 4. Alcance del Testing

-   **Componentes (`/src/components`):** El objetivo es mantener una alta cobertura de tests unitarios para todos los componentes reutilizables. Cada nuevo componente debe ir acompañado de sus tests.
-   **Páginas y Flujos (`/src/app`):** Se crearán tests de integración para las páginas clave y tests E2E para los flujos de usuario críticos.
-   **API Endpoints (`/src/app/api`):** Se recomienda añadir tests de integración para los endpoints de la API para validar la lógica de negocio del backend, las interacciones con la base de datos (mockeada) y la correcta gestión de la autenticación.

## 5. Plan de Acción y Casos de Test Propuestos

### Fase 1: Ampliar Tests de Integración (Jest)

-   **Página de Publicar Anuncio (`/publish-ad`):**
    -   Simular el rellenado del formulario con datos válidos e inválidos.
    -   Verificar la validación de los campos.
    -   Mockear la llamada a la API de creación de productos y verificar que se llama con los datos correctos.
    -   Comprobar que se muestra una notificación de éxito o error.

-   **Página de Búsqueda (`/search`):**
    -   Testear que los filtros (categoría, precio, etc.) se aplican correctamente.
    -   Mockear la API de productos y verificar que los resultados mostrados se corresponden con los filtros aplicados.

-   **Página de Perfil de Usuario (`/user-profile`):**
    -   Verificar que se muestra la información del perfil del usuario autenticado.
    -   Comprobar que se listan correctamente los productos publicados por el usuario.

### Fase 2: Ampliar Tests E2E (Playwright)

-   **Flujo de Autenticación:**
    -   Un usuario puede registrarse con éxito.
    -   Un usuario puede iniciar sesión con credenciales válidas.
    -   Un usuario no puede iniciar sesión con credenciales inválidas.
    -   Un usuario autenticado puede cerrar sesión.

-   **Flujo de Publicación de Anuncio:**
    -   Un usuario inicia sesión.
    -   Navega a la página de "Publicar Anuncio".
    -   Rellena el formulario y lo envía.
    -   Verifica que el nuevo anuncio aparece en su página de perfil.

-   **Flujo de Compra (Venta Directa):**
    -   Un usuario busca un producto.
    -   Navega a la página de detalles del producto.
    -   Inicia el proceso de compra.
    -   Rellena y envía el formulario de dirección de envío.
    -   Verifica que el estado del producto cambia a "pendiente de pago".

### Fase 3: Tests para la API (Opcional, pero recomendado)

-   Crear tests para los endpoints de la API (`/api/...`) usando Jest y `supertest` (o similar).
-   Testear la creación, lectura, actualización y eliminación (CRUD) de recursos como productos, preguntas y pujas.
-   Verificar la lógica de negocio y las reglas de autorización (por ejemplo, que un usuario solo pueda editar sus propios productos).
