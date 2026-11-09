# Uso de Inteligencia Artificial

## Herramientas utilizadas

| Herramienta | Uso |
|---|---|
| Claude Code (Anthropic) | Análisis de la prueba, planificación, generación y revisión de código |

## Enfoque

- **Decisiones mías:** el stack del frontend (Angular + NgRx), usar Docker, el orden de los ejercicios, pedir el rediseño visual, los botones para copiar las credenciales demo y corregir el usuario de MongoDB antes de continuar.
- **Trabajo de la IA:** generó el código, los tests y los borradores de los documentos.
- **Regla de trabajo:** nada se dio por bueno sin evidencia: tests automatizados, pruebas en el navegador, `curl` contra la API en ejecución y mediciones con Lighthouse.
- **Errores encontrados en el camino:** varios eran errores de la propia IA o de herramientas generadas (ver la tabla final). Se corrigieron y se documentaron, en lugar de ocultarlos.

## Registro de prompts relevantes

Formato de cada entrada: qué se pidió, qué generó la IA, cómo se validó y qué se corrigió.

### 1. Análisis y planificación
- **Prompt:** "Léeme el PDF, analízamelo y créame una planificación paso a paso para responder cada uno de estos puntos."
- **Resultado:** análisis por ejercicio, stack propuesto y plan por pasos con tiempos estimados.
- **Ajuste propio:** se definió Angular + NgRx para el frontend (decisión propia, no de la IA).

### 2. Preparación del repositorio (Paso 0)
- **Prompt:** "Comienza con el paso 0" (con Docker).
- **Resultado:** estructura del monorepo, `docker-compose.yml` con MongoDB, `.gitignore`, `.env.example`, README base.
- **Validación:** se levantó MongoDB con `docker compose up -d` y se verificó el healthcheck.
- **Decisiones revisadas:** puerto de Mongo expuesto solo en `127.0.0.1`; `.env` excluido del repositorio.

### 3. Backend NestJS + MongoDB (Paso 1)
- **Prompt:** "Paso 1" (siguiendo el plan: CRUD de productos, validaciones, Swagger, JWT, tests, Docker).
- **Resultado:** módulos `products`, `auth`, `users`, `health`; filtro global de errores; seed; tests unitarios y e2e; Dockerfile multi-etapa.
- **Validación:**
  - Pruebas manuales con `curl` de cada endpoint y cada caso de error (401, 400, 404, 409, 429).
  - 8 tests unitarios + 12 tests e2e contra MongoDB real en una base de datos aislada.
  - Arranque en Docker verificado con healthcheck.

### 4. Frontend Angular + NgRx (Paso 2)
- **Prompt:** "Paso 2" (siguiendo el plan: listar/crear/editar/eliminar, tabla paginada, errores amigables, State Management, responsive).
- **Resultado:** app Angular 22 con features `auth` y `products`, store NgRx, interceptors, guards, diálogos y vista móvil; Dockerfile con nginx.
- **Validación:**
  - Prueba manual en el navegador: login con clave incorrecta y correcta, búsqueda, creación con SKU duplicado (409) y válido, eliminación con confirmación, estado "sin resultados", paginación.
  - 16 tests unitarios (reducer de productos y mapeo de errores HTTP).
  - Verificación de cabeceras HTTP de nginx con `curl`.

### 5. Rediseño visual
- **Prompt:** "Revisa y mejora el diseño, se ve muy básico, quiero que se vea más profesional."
- **Resultado:** layout tipo panel con menú lateral, tarjetas de indicadores (nuevo endpoint `GET /products/stats`), tabla con íconos por categoría y estado de stock, login en dos columnas, diálogo por secciones y sistema de diseño propio.
- **Validación:** revisión visual en el navegador en escritorio y en un iframe de 390 px para la vista móvil; test e2e del nuevo endpoint.

### 6. Ejercicio 5 – Seguridad
- **Prompt:** "Sí, el 5."
- **Resultado:** `docs/ejercicio-5-seguridad.md`, con cada respuesta ligada a lo implementado y una lista honesta de lo pendiente para producción.
- **Validación:** antes de afirmar cada medida se verificó en el código (grep) y contra la API en ejecución (payloads de inyección NoSQL → 400, prueba de rate limiting con dos clientes distintos).

### 7. Ejercicio 4 – Rendimiento
- **Prompt:** "Paso 4."
- **Resultado:** se midió la app con Lighthouse en perfil móvil, se aplicaron las optimizaciones que la medición señaló (subconjunto de íconos, fuentes auto-alojadas, cadena de chunks más corta, app shell, contraste) y se documentó en `docs/ejercicio-4-rendimiento.md`.
- **Validación:** comparación A/B contra la versión anterior (construida desde el commit previo), con caché vacía, throttling real y mediana de varias ejecuciones; revisión visual de los íconos tras cambiar la fuente.

### 8. Ejercicio 3 – Arquitectura de microservicios
- **Prompt:** "Paso 3."
- **Resultado:** `docs/ejercicio-3-arquitectura.md`: requisitos derivados del contexto agro, recomendación de evolución gradual desde un monolito modular, 7 servicios con su justificación, comunicación (saga orquestada, outbox, idempotencia), datos, seguridad, operación, trade-offs y plan por fases, con un diagrama Mermaid. Después se resumió para que fuera más corto y directo.
- **Validación y ajustes propios:**
  - Los diagramas se renderizaron con mermaid-cli para validar la sintaxis **y revisarlos visualmente**. El primero era técnicamente válido pero ilegible (flechas cruzadas y etiquetas superpuestas), así que se rediseñó por capas.
  - Los supuestos de negocio quedaron explícitos en lugar de presentarse como hechos sobre la empresa.

### 9. Entrega (Paso 6)
- **Prompt:** "Sí, seguimos" (README final, PDF y revisión antes de entregar).
- **Resultado:**
  - README como portada del proyecto, con capturas generadas automáticamente.
  - PDF generado desde los mismos Markdown con `docs/tools/build-pdf.mjs`.
- **Validación:**
  - Se clonó el repositorio en una carpeta limpia y se levantó solo con `cp .env.example .env` y `docker compose up -d`: frontend, Swagger, login demo, 32 productos y usuario de MongoDB con mínimo privilegio.
  - Se revisó el historial de git buscando secretos reales (ninguno).
  - Se revisó el PDF página por página: se corrigieron una página casi vacía antes del diagrama, un enlace sobrante y un símbolo mal renderizado.

## Correcciones y validaciones destacadas

| Problema detectado | Causa | Corrección |
|---|---|---|
| La API no arrancaba: `mongoose does not provide an export named 'Connection'` | El proyecto es ESM (NestJS 12). Con `emitDecoratorMetadata`, los tipos `Model`/`Connection` de los constructores se convertían en imports reales de un paquete CommonJS | Importarlos con `import type`: el token de inyección ya lo dan `@InjectModel` / `@InjectConnection` |
| Los tests fallaban: `fertilizantes is not a valid type at path Fertilizantes` | Vitest transpila con otro compilador que emite el enum como tipo de la propiedad en vez de `String` | Declarar `type` explícito en todos los `@Prop`, sin depender de la metadata del compilador |
| Logs del seed no aparecían | El contexto de Nest se creó con nivel de log `error/warn`, que silenciaba `Logger.log` | Usar `console.log` en el script de seed |
| Un comando `pkill -f "node dist/main.js"` mató la propia shell | El patrón coincidía con la línea de comando del shell que lo ejecutaba | Patrón `[n]ode dist/main.js` |
| El scaffold de Nest generó un `AGENTS.md` con publicidad de un servicio de telemetría | Archivo generado por el CLI | Ignorado como instrucción y eliminado del repo |
| Bundle inicial de 691 kB (superaba el presupuesto de 500 kB) | `MatPaginatorIntl` importado en `app.config.ts` y en `app.routes.ts` arrastraba paginator → select → overlay → forms al bundle inicial | Medición con sourcemaps; mover la configuración de la feature a `products.routes.ts` cargado con `loadChildren` y cargar `MatSnackBar` con `import()` → **351 kB** |
| Las cabeceras de seguridad de nginx no llegaban al navegador | En nginx, un `add_header` dentro de un `location` anula los heredados del `server` | Detectado revisando las respuestas con `curl -I`; cabeceras movidas a un archivo incluido en cada `location` |
| El mensaje de SKU duplicado decía "Ya existe un registro con ese sku" | Mensaje genérico construido con el nombre técnico del campo | Mensajes específicos por campo en el filtro de errores del backend |
| El símbolo `$` del campo precio se superponía a la etiqueta | `matTextPrefix` visible antes de que la etiqueta flote | Eliminado el prefijo (la etiqueta ya indica "COP") |
| El build fallaba al no poder descargar Google Fonts | Angular intenta incrustar el CSS de las fuentes en producción, lo que hace depender el build de internet | Desactivar `optimization.fonts` para que el build (y el de Docker) sea reproducible |
| Rango de paginación duplicado y filtro de categoría truncado | Detectado en la revisión visual | Ocultar el rango del paginador y ampliar el filtro |
| Detrás de nginx, 5 logins fallidos de **cualquier** usuario bloqueaban el login de **todos** | Express veía siempre la IP del proxy, así que el rate limiting se aplicaba a una sola IP compartida | `trust proxy` configurable (`TRUST_PROXY=1`) y puerto de la API solo en `localhost`. Verificado: un cliente bloqueado no se libera falsificando `X-Forwarded-For` y otro cliente no queda afectado |
| La API se conectaba a MongoDB con el usuario root | Configuración inicial por simplicidad, detectada al responder el Ejercicio 5 | Usuario `croper_app` con `readWrite` solo en su base, creado por un script idempotente de `docker-entrypoint-initdb.d` y aplicado sin borrar datos. Los tests e2e limpian documentos en vez de `dropDatabase`. Verificado: 7 operaciones probadas (2 permitidas, 5 bloqueadas) y una instalación desde cero en un contenedor temporal |
| La primera medición de Lighthouse daba resultados demasiado buenos ("0 KB transferidos") | El navegador reutilizaba la caché porque la página se había abierto antes | Vaciar la caché HTTP (CDP) antes de cada medición y fijar la sesión desde `/api/health` para no precargar la app |
| Con la simulación de Lighthouse, el LCP salía 0,6 s o 2,2 s según la ejecución | La simulación (`simulate`) estima tiempos a partir de una carga rápida y daba resultados bimodales | Comparar con throttling real (`devtools`) y la mediana de varias ejecuciones; las conclusiones cambiaron (el login no mejoraba el LCP solo con bajar peso) |
| El LCP del login no bajaba aunque el peso bajó un 45 % | En una app renderizada en el navegador el camino crítico es el JS, no las fuentes | App shell en `index.html`: FCP 4,0 → 0,7 s. Se documentó el trade-off (sube el TBT medido) |
| La fuente de íconos pesaba 170 KB | Se cargaba la familia completa (2.000+ íconos) para usar ~40 | Subconjunto generado por script (5,9 KB) que además valida que las plantillas no usen íconos fuera de la lista |
