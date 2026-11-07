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

Esto levanta MongoDB y la API (carga datos demo automáticamente).

| Servicio | URL |
|---|---|
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| Health | http://localhost:3000/api/health |

**Usuario demo:** `admin@croper.com` / `Admin123*`

> El frontend se agrega en el Paso 2.

## Backend (`/backend`)

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | — | Registro (rate limit 5/min) |
| POST | `/api/auth/login` | — | Login → JWT (rate limit 5/min) |
| GET | `/api/products?page=&limit=&search=&category=&sortBy=&order=` | JWT | Lista paginada |
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
- **Fuerza bruta:** `@nestjs/throttler` (100 req/min general, 5/min en login y registro).
- **Cabeceras y CORS:** `helmet` y CORS restringido al origen del frontend.
- **Búsqueda:** el texto se escapa antes de construir el `RegExp` (evita ReDoS / inyección de regex).
- **Docker:** build multi-etapa, imagen final solo con dependencias de producción y usuario no-root.

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
backend/            API REST NestJS
frontend/           App Angular
docs/               Respuestas teóricas y uso de IA
docker-compose.yml  Orquestación de servicios
```
