# Ejercicio 5 – Seguridad en APIs y Cloud

> Cada respuesta se apoya en lo implementado en los ejercicios 1 y 2. Las referencias a archivos indican dónde verlo en el código.

---

## 1. OAuth vs JWT

**No son alternativas: resuelven problemas distintos y se usan juntos con frecuencia.**

| | OAuth 2.0 / OpenID Connect | JWT |
|---|---|---|
| **Qué es** | Un **protocolo de autorización** (y OIDC, una capa de autenticación sobre él) | Un **formato de token**: JSON firmado (`header.payload.firma`) |
| **Responde a** | ¿Cómo obtiene una aplicación permiso para actuar en nombre de un usuario, sin ver su contraseña? | ¿Cómo transporto afirmaciones (quién es, qué puede hacer, hasta cuándo) de forma verificable? |
| **Define** | Flujos (Authorization Code + PKCE, Client Credentials…), roles (cliente, servidor de autorización, recurso), scopes, refresh tokens | Estructura, firma (HS256, RS256…) y claims estándar (`sub`, `exp`, `iat`, `aud`) |
| **Ejemplo** | "Iniciar sesión con Google", una app de terceros que lee pedidos de un vendedor | El `accessToken` que devuelve nuestro `POST /auth/login` |

Un servidor OAuth puede emitir sus access tokens **en formato JWT**, y es lo más común.

**Cuándo usar cada uno:**
- **JWT propio (lo que implementé):** una sola aplicación con su propio login, sin terceros. Es simple y *stateless*: la API valida la firma sin consultar la base de datos.
- **OAuth 2.0 / OIDC con un proveedor de identidad** (Keycloak, Auth0, Cognito): varios clientes (web, app móvil, integraciones de distribuidores), login social, SSO entre servicios o terceros que acceden a la API. En una arquitectura de microservicios (Ejercicio 3) es la opción recomendada, porque centraliza la identidad en un solo lugar.

**Buenas prácticas aplicadas o a considerar:**
- Access token de vida corta (`JWT_EXPIRES_IN=3600` s) y secreto de ≥ 32 caracteres, validado al arrancar (`backend/src/config/env.validation.ts`).
- Algoritmo fijado al validar (`algorithms: ['HS256']` en `jwt.strategy.ts`), lo que evita ataques de confusión de algoritmo (`alg: none`).
- El JWT **no es cifrado**, solo firmado: el payload se lee en Base64. Por eso solo lleva `sub` y `email`, nunca datos sensibles.
- **Limitación conocida:** un JWT no se puede revocar antes de que expire. En producción usaría un access token corto (5–15 min) más un **refresh token rotativo en cookie `httpOnly; Secure; SameSite`**, con una lista de revocación (Redis) para el logout y el robo de sesión.

---

## 2. Protección contra fuerza bruta

Ninguna medida basta sola; la defensa se hace en capas:

1. **Rate limiting.** *Implementado* con `@nestjs/throttler`: 5 intentos por minuto por IP en `/auth/login` y `/auth/register`, y 100 por minuto en el resto de la API (`auth.controller.ts`, `app.module.ts`). Al superarlo la API responde `429` y el frontend muestra "Demasiados intentos. Espera un minuto".
   - *Detalle corregido en esta revisión:* detrás de nginx, la API veía a **todos** los usuarios con la IP del proxy, así que 5 fallos de cualquiera bloqueaban a todos. Se configuró `trust proxy` solo para el primer salto (`TRUST_PROXY=1`) y se dejó el puerto de la API accesible solo en `localhost`. Verificado: un cliente bloqueado no puede saltarse el límite enviando un `X-Forwarded-For` falso, y otro cliente sigue pudiendo intentar.
2. **Hash lento de contraseñas.** *Implementado:* bcrypt con 12 rondas (`users.service.ts`). Aunque se filtre la base de datos, probar contraseñas offline es muy costoso. Argon2id sería la alternativa más moderna.
3. **Sin pistas para el atacante.** *Implementado:* mensaje genérico "Email o contraseña incorrectos". Si el email no existe, igual se compara contra un hash ficticio para que el tiempo de respuesta sea el mismo y no se puedan enumerar usuarios (`auth.service.ts`).
4. **Política de contraseñas.** *Implementado:* mínimo 8 caracteres, con letras y números, en el registro.
5. **En producción agregaría:**
   - **Límite por cuenta además de por IP**, con backoff exponencial (1, 2, 4, 8… min) tras N fallos. Así se frenan ataques distribuidos desde muchas IPs contra un mismo usuario.
   - **Contador compartido en Redis** (`ThrottlerStorage`): el almacenamiento actual está en memoria y no funciona con varias réplicas de la API.
   - **CAPTCHA** solo después de varios fallos, para no afectar a usuarios legítimos.
   - **MFA** para cuentas administrativas.
   - **WAF / rate limiting en el borde** (Cloudflare, AWS WAF) y **alertas** ante picos de 401 o 429.

---

## 3. Seguridad en bases de datos MongoDB

| Riesgo | Medida | Estado en el proyecto |
|---|---|---|
| Acceso sin autenticación (causa de muchas filtraciones masivas) | Autenticación siempre habilitada | ✅ Mongo arranca con usuario y clave (`MONGO_INITDB_ROOT_*`) |
| Exposición a internet | Red privada; nunca IP pública ni `0.0.0.0` | ✅ Puerto publicado solo en `127.0.0.1`; la API se conecta por la red interna de Docker |
| Inyección NoSQL (`{"email": {"$gt": ""}}`) | Validar tipos y rechazar campos desconocidos | ✅ DTOs con `class-validator` y `whitelist` + `forbidNonWhitelisted`. Verificado: ambos payloads devuelven `400` |
| ReDoS / inyección en búsquedas con regex | Escapar la entrada del usuario | ✅ `escapeRegex()` en la búsqueda de productos (con test) |
| Exposición de datos sensibles | Proyecciones; no devolver campos internos | ✅ `password` con `select: false` y eliminado del JSON |
| Privilegios excesivos | Usuario de aplicación con mínimo privilegio | ✅ La API usa `croper_app`, con rol `readWrite` **solo** sobre `croper`, creado por `mongo/init/01-create-app-user.js`. Verificado: no puede leer otras bases, ver o crear usuarios, borrar la base ni apagar el servidor. El usuario root queda solo para administración |
| Tráfico interceptado | TLS entre la API y Mongo (`tls=true`) | ⚠️ No aplica en local; obligatorio en la nube |
| Robo de discos o backups | Cifrado en reposo y backups cifrados | ⚠️ Lo ofrece MongoDB Atlas o el disco cifrado del proveedor |
| Pérdida de datos | Backups automáticos con restauraciones *probadas*; réplica de 3 nodos | ⚠️ Infraestructura |
| Actividad sospechosa | Auditoría, alertas y versiones actualizadas | ⚠️ Infraestructura |

**Recomendación:** usar **MongoDB Atlas** con *Private Endpoint / VPC Peering* (sin IP pública), usuarios por servicio con mínimo privilegio, TLS obligatorio, cifrado en reposo, backups *point-in-time* y la cadena de conexión guardada en un gestor de secretos.

---

## 4. Despliegue de microservicios en la nube

Principio general: **defensa en profundidad y mínimo privilegio en cada capa.**

**Red**
- VPC con **subredes privadas** para servicios y bases de datos; solo el balanceador o API Gateway queda en la subred pública.
- **HTTPS en todo el tráfico externo** (certificados gestionados, HSTS) y **mTLS entre servicios** (service mesh como Istio o Linkerd), para que un servicio comprometido no pueda hacerse pasar por otro.
- *Security groups* / *NetworkPolicies* de Kubernetes que solo permitan los flujos necesarios (por ejemplo, Pedidos → Inventario, y no Catálogo → Pagos).
- **WAF** delante del gateway: OWASP Top 10, bots, rate limiting global.

**Identidad y acceso**
- **API Gateway** que valida el JWT u OAuth en el borde, más validación en cada servicio (*zero trust*).
- **IAM con roles por servicio** (IRSA en EKS, Workload Identity en GKE): sin llaves de larga duración en el código.

**Secretos**
- En un gestor de secretos (AWS Secrets Manager, Vault, GCP Secret Manager) con **rotación**, inyectados en tiempo de ejecución. Nunca en el repositorio ni en la imagen.
- *En el proyecto:* `.env` en `.gitignore`, `.env.example` sin valores reales, `.dockerignore` excluye `.env` y la API no arranca si falta el secreto o es débil.

**Contenedores y cadena de suministro**
- Imágenes mínimas y **usuario no root**. *En el proyecto:* build multi-etapa, solo dependencias de producción y `USER node` en la API.
- **CI/CD con controles automáticos:** `npm audit` / Dependabot, escaneo de imágenes (Trivy) y de secretos (gitleaks), SAST. Imágenes firmadas (cosign) y solo se despliegan si pasan los controles.
- Sistema de archivos de solo lectura, *resource limits* y *Pod Security Standards*.

**Operación**
- Logs centralizados **sin datos sensibles** (tokens, contraseñas), trazas distribuidas (OpenTelemetry) y alertas de seguridad.
- Cabeceras HTTP de seguridad. *En el proyecto:* `helmet` en la API y `X-Frame-Options`, `X-Content-Type-Options` y `Referrer-Policy` en nginx.
- En producción: **deshabilitar o proteger Swagger**, CORS restringido a los dominios reales y CSP también en el frontend.

---

## Resumen: implementado vs. pendiente para producción

| Implementado y verificado | Pendiente para producción |
|---|---|
| JWT con expiración, algoritmo fijado y secreto validado | Refresh token en cookie `httpOnly` y revocación |
| Rate limiting por IP real detrás de nginx (5/min en login) | Límite por cuenta y contador compartido en Redis |
| bcrypt (12), mensajes genéricos, tiempo constante | MFA para administradores |
| Validación estricta (anti NoSQL injection), regex escapado | TLS entre la API y Mongo |
| Usuario de Mongo con mínimo privilegio (`readWrite` solo en su base) | Usuario de solo lectura para reportes |
| Mongo y API sin exposición pública; usuario no root en la API | Gestor de secretos, WAF, mTLS, escaneo en CI |
| helmet, cabeceras en nginx, CORS restringido | Swagger protegido o deshabilitado; CSP en el frontend |
