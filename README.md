# Croper – Prueba Técnica Full Stack

Gestión de productos para un e-commerce agropecuario.

- **Backend:** NestJS + MongoDB (Mongoose) + JWT + Swagger → `/backend`
- **Frontend:** Angular + NgRx + Angular Material → `/frontend`
- **Documentación:** respuestas teóricas y uso de IA → `/docs`

## Requisitos

- Docker y Docker Compose
- Node.js 20+ (solo para desarrollo local)

## Cómo levantar

```bash
cp .env.example .env
docker compose up -d
```

Esto levanta MongoDB, la API (carga datos demo automáticamente) y el frontend.

| Servicio | URL |
|---|---|
| **Aplicación web** | **http://localhost:4200** |
| API (directa, solo localhost) | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| Health | http://localhost:3000/api/health |

**Usuario demo:** `admin@croper.com` / `Admin123*`


## Backend (`/backend`)

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | — | Registro (rate limit 5/min) |
| POST | `/api/auth/login` | — | Login → JWT (rate limit 5/min) |
| GET | `/api/products?page=&limit=&search=&category=&sortBy=&order=` | JWT | Lista paginada |
| GET | `/api/products/stats` | JWT | Indicadores: total, unidades, valor del inventario, stock bajo/agotado |
| GET | `/api/products/:id` | JWT | Detalle |
| POST | `/api/products` | JWT | Crear |
| PATCH | `/api/products/:id` | JWT | Actualizar parcial |
| DELETE | `/api/products/:id` | JWT | Eliminar |
| GET | `/api/health` | — | Estado de API y BD |

### Decisiones técnicas

- **Seguro por defecto:** `JwtAuthGuard` global; solo los endpoints con `@Public()` quedan abiertos.
- **Validación:** DTOs con `class-validator`; `ValidationPipe` con `whitelist` + `forbidNonWhitelisted` (rechaza campos extra, mitiga inyección de operadores `$` de MongoDB). Variables de entorno validadas al arrancar.
- **Errores uniformes:** filtro global → `{ statusCode, error, message, path, timestamp }`; SKU duplicado → 409, id inválido → 400, inexistente → 404; los errores 500 no exponen detalles.
- **Contraseñas:** bcrypt (12 rondas), `select: false` en el schema y eliminadas del JSON. Login con mensaje genérico y comparación contra hash ficticio para no revelar si el email existe.
- **Fuerza bruta:** `@nestjs/throttler` (100 req/min general, 5/min en login y registro), usando la IP real del cliente detrás de nginx (`TRUST_PROXY`).
- **Cabeceras y CORS:** `helmet` y CORS restringido al origen del frontend.
- **Búsqueda:** el texto se escapa antes de construir el `RegExp` (evita ReDoS / inyección de regex).
- **Docker:** build multi-etapa, imagen final solo con dependencias de producción y usuario no-root.
- **MongoDB con mínimo privilegio:** la API se conecta con `croper_app` (`readWrite` solo sobre su base), creado por `mongo/init/01-create-app-user.js`; el usuario root solo se usa para administración.

### Desarrollo local (sin Docker para la API)

```bash
docker compose up -d mongo
cd backend
cp .env.example .env   # ajustar MONGO_URI con la clave de Mongo y un JWT_SECRET
npm install
npm run seed           # datos demo
npm run start:dev
```

### Tests

```bash
npm test               # unitarios (ProductsService)
npm run test:e2e       # e2e contra MongoDB real (BD aislada croper_e2e)
```

## Estructura

```
mongo/init/         Script que crea el usuario de la API (mínimo privilegio)
backend/            API REST NestJS
frontend/           App Angular
docs/               Respuestas teóricas y uso de IA
docker-compose.yml  Orquestación de servicios
```

## Frontend (`/frontend`)

Angular 22 (standalone, zoneless, signals) + NgRx 22 + Angular Material.

### Estructura

```
src/app/
  core/                 # transversal: modelos, interceptors, guards, layout, utilidades
    interceptors/       # authInterceptor (Bearer) · sessionInterceptor (401 → logout)
    guards/             # authGuard · guestGuard
    utils/http-error.ts # códigos HTTP → mensajes amigables en español
  shared/components/    # ConfirmDialog
  features/
    auth/               # login + store (actions, reducer con createFeature, effects)
    products/
      data-access/      # ProductsApiService
      store/            # actions · reducer (EntityAdapter) · effects
      pages/            # ProductsPage (contenedor)
      components/       # ProductFormDialog · ProductCards (vista móvil)
      products.routes.ts# ruta lazy que registra estado y effects de la feature
```

### Manejo de estado (NgRx)

- **Auth:** sesión (token, expiración, usuario) persistida en `localStorage` y rehidratada al iniciar descartando tokens vencidos.
- **Products:** `EntityAdapter` + estado de consulta (`page`, `limit`, `search`, `category`, `sortBy`, `order`), `total`, `loading`, `saving`, `deletingIds`, `loadError`.
- Acciones separadas por origen: `Products Page` (UI) y `Products API` (resultados).
- Los effects usan `switchMap` para cargar (cancela peticiones obsoletas al escribir/paginar), `exhaustMap` para crear/editar (evita doble envío) y `mergeMap` para eliminar.
- Los componentes leen el store como **signals** (`selectSignal`) con `OnPush`.

### Diseño

- Layout tipo panel: menú lateral (se vuelve panel deslizable en pantallas < 960 px), barra superior con ruta y menú de usuario.
- Tarjetas de indicadores (productos, unidades, valor del inventario, productos que requieren atención) calculadas en MongoDB con una agregación.
- Tabla con ícono y color por categoría, estado de stock (Disponible / Stock bajo / Agotado) y acciones por fila.
- Login en dos columnas con panel de marca; formulario en diálogo organizado por secciones.
- Sistema de diseño propio en `styles.scss`: tokens de color, tipografía Inter, íconos redondeados y ajustes de Material (`*-overrides`).

### UX

- Tabla con **paginación, ordenamiento y filtros del lado del servidor**; búsqueda con `debounce` de 400 ms.
- Formulario en diálogo con validaciones; **solo se cierra si la API confirma**, así un error (ej. SKU duplicado) no hace perder lo escrito.
- Confirmación antes de eliminar; botones deshabilitados y spinners mientras se procesa.
- Estados de carga (esqueletos con la forma de la tabla), vacío, "sin resultados" y error con botón **Reintentar**.
- Mensajes amigables en español para cada tipo de error (sin conexión, 400, 401, 404, 409, 429, 5xx).
- **Responsive:** en pantallas < 600 px la tabla se reemplaza por tarjetas y "Nuevo producto" pasa a botón flotante.

### Rendimiento

- Rutas lazy: el estado, los effects y los componentes de Material de productos no están en el bundle inicial. Bundle inicial: **384 kB (106 kB gzip)**.
- `MatSnackBar` se carga bajo demanda.
- En Docker, nginx sirve con gzip, caché inmutable para assets con hash y `no-cache` para `index.html`.

### Desarrollo local

```bash
cd frontend
npm install
npm start          # http://localhost:4200 (proxy de /api → localhost:3000)
npm test           # tests unitarios (reducer y mapeo de errores)
```
