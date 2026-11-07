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

> En construcción: por ahora solo levanta MongoDB. La API y el frontend se agregan en los siguientes pasos.

## Estructura

```
backend/            API REST NestJS
frontend/           App Angular
docs/               Respuestas teóricas y uso de IA
docker-compose.yml  Orquestación de servicios
```
