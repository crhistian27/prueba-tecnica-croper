# ---------- Etapa 1: compilación ----------
FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---------- Etapa 2: imagen final (solo dependencias de producción) ----------
FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# No ejecutar como root
USER node
EXPOSE 3000
# Carga datos demo (idempotente) y arranca la API
CMD ["sh", "-c", "node dist/seed.js && node dist/main.js"]
