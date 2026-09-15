# Frontend — P26 E-commerce

Frontend de la práctica P2-6 de Programación Web II.

La aplicación implementa un flujo de e-commerce utilizando React y TypeScript. La navegación entre las diferentes vistas se controla mediante estado, sin utilizar un sistema de rutas.

## Tecnologías

* React
* TypeScript
* Vite
* Zustand
* CSS

## Instalación

Desde la carpeta `front`:

```bash
npm install
```

## Ejecución

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación utiliza el servidor de desarrollo de Vite.

El frontend se comunica con el backend GraphQL mediante:

```text
http://localhost:3000/graphql
```

## Estructura

```text id="k5z3t7"
front/
├── src/
│   ├── components/
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── ProductCard.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── services/
│   │   └── graphql.ts
│   ├── store/
│   │   └── cartStore.ts
│   ├── templates/
│   │   ├── Cart.tsx
│   │   ├── CategoryDetail.tsx
│   │   ├── Checkout.tsx
│   │   ├── Home.tsx
│   │   └── ProductDetail.tsx
│   ├── types/
│   │   ├── category.ts
│   │   ├── product.ts
│   │   └── view.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
└── vite.config.js
```

## Flujo de la aplicación

La aplicación implementa el siguiente flujo:

```text id="u2rj0a"
Home
  ↓
Detalle de categoría
  ↓
Detalle de producto
  ↓
Carrito
  ↓
Checkout
  ↓
Pedido confirmado
```

La navegación no utiliza URLs ni React Router.

La vista actual se controla mediante el estado `view` dentro de `App.tsx`.

Las vistas disponibles son:

```ts id="d7t9dy"
type View =
  | 'home'
  | 'category'
  | 'product'
  | 'cart'
  | 'checkout'
```

Cuando el usuario realiza una acción, `App.tsx` cambia el estado de la vista y muestra el template correspondiente.

## Componentes

Los componentes reutilizables principales son:

### TopBar

Contiene el nombre de la tienda, navegación principal y acceso al carrito.

También muestra la cantidad total de productos agregados.

### Sidebar

Muestra las categorías obtenidas desde el backend.

Las categorías no están escritas directamente en el componente, sino que se reciben mediante props.

### ProductCard

Representa un producto dentro del catálogo.

Recibe el producto mediante props y permite seleccionar el producto para consultar sus detalles.

### Hero

Presenta la sección principal de bienvenida de la tienda.

### Footer

Contiene el pie de página de la aplicación.

## Templates

Los templates representan las diferentes vistas principales:

* `Home`: catálogo principal y categorías.
* `CategoryDetail`: productos pertenecientes a una categoría.
* `ProductDetail`: información y selección de cantidad de un producto.
* `Cart`: productos seleccionados, cantidades y total.
* `Checkout`: información del cliente y creación del pedido.

## Estado del carrito

El carrito utiliza Zustand para administrar el estado global.

El store se encuentra en:

```text id="8o9x2q"
src/store/cartStore.ts
```

El estado contiene los productos seleccionados y sus cantidades.

También utiliza persistencia mediante `zustand/middleware`, por lo que el carrito permanece después de recargar la página.

Las principales operaciones son:

```text id="wny5ko"
addToCart
removeFromCart
updateQuantity
clearCart
```

El store también controla que la cantidad agregada no supere el stock disponible.

## Comunicación con GraphQL

Las consultas al backend se centralizan en:

```text id="k7w0ks"
src/services/graphql.ts
```

La aplicación utiliza un único endpoint:

```text id="6v4m8c"
http://localhost:3000/graphql
```

Entre las operaciones utilizadas por el frontend se encuentran:

```text id="7z3vqu"
getCategories()
getCategoryById()
getProductById()
getProducts()
createOrder()
```

## Catálogo paginado

El catálogo principal utiliza paginación basada en cursor.

Inicialmente se solicitan 6 productos:

```text id="q9v3h6"
getProducts(6)
```

Cuando el usuario selecciona `CARGAR MÁS`, se utiliza el cursor recibido por GraphQL para solicitar los siguientes productos.

El comportamiento es:

```text id="n6q9xa"
6 productos
    ↓
CARGAR MÁS
    ↓
12 productos
    ↓
CARGAR MÁS
    ↓
18 productos
    ↓
CARGAR MÁS
    ↓
20 productos
```

Los productos anteriores permanecen visibles mientras se agregan los nuevos.

## Checkout

El checkout obtiene los productos almacenados en el carrito y construye una solicitud GraphQL para crear el pedido.

La mutation utilizada es:

```graphql id="o4i3ah"
crearPedido(input: $input)
```

El backend valida el usuario, verifica el stock, calcula el total y crea el pedido dentro de una transacción.

Después de crear correctamente el pedido, el carrito se limpia y se muestra la confirmación del pedido.

## Diseño

La interfaz utiliza un diseño minimalista inspirado en tiendas deportivas modernas.

Características principales:

* Diseño limpio.
* Tipografía de alto contraste.
* Espacios amplios.
* Tarjetas de producto simples.
* Paleta principalmente blanca y negra.
* Diseño responsive para diferentes tamaños de pantalla.

La información mostrada en el catálogo proviene del backend, por lo que los componentes no dependen de un producto específico.

## Datos dinámicos

El frontend no utiliza productos simulados para el catálogo final.

Las categorías y productos son obtenidos desde GraphQL y almacenados temporalmente en el estado de React.

Los componentes reciben los datos mediante props y trabajan con estructuras genéricas de `Product` y `Category`.

Esto permite cambiar el contenido de la tienda sin modificar la estructura de los componentes.

## Estado actual

El frontend implementa:

* Flujo completo de e-commerce.
* Navegación mediante estado.
* Consulta de categorías.
* Consulta de productos.
* Detalle de categoría.
* Detalle de producto.
* Carrito global con Zustand.
* Persistencia del carrito.
* Control de cantidades y stock.
* Checkout.
* Creación real de pedidos mediante GraphQL.
* Paginación por cursor.
* Estados de carga con skeletons.
* Diseño responsive.

El historial de pedidos y una versión más completa del manejo de errores y reintentos quedan considerados como mejoras para una versión posterior.
