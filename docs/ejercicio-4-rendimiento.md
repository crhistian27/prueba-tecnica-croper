# Ejercicio 4 – Optimización de rendimiento y UX/UI en móviles

> Las técnicas no son teóricas: se aplicaron sobre la app de los ejercicios 1 y 2 y se **midieron** con Lighthouse en perfil móvil. Al final se explica cómo medí y qué aprendí del proceso de medición.

## Contexto: por qué importa en Croper

Los usuarios de un e-commerce agropecuario suelen conectarse desde **zonas rurales con 3G/4G inestable**, con **celulares de gama media o baja** y **planes de datos limitados**. Cada KB y cada viaje de red cuesta tiempo y dinero. Por eso las métricas que más importan son:

- **LCP** (*Largest Contentful Paint*): cuándo aparece el contenido principal.
- **FCP** (*First Contentful Paint*): cuándo el usuario deja de ver una pantalla en blanco.
- **INP / TBT**: qué tan rápido responde la página a toques y clics.
- **CLS**: que el contenido no "salte" mientras carga.
- **Peso transferido**: los datos que consume el plan del usuario.

## Resultados medidos

Perfil móvil de Lighthouse 13 (Moto G Power, 4G lento, CPU 4× más lenta), **caché vacía** (primera visita) y **throttling real** (`devtools`). Mediana de 3 ejecuciones; la dispersión entre ejecuciones fue menor a 0,1 s.

| Métrica | Login antes | Login después | Productos antes | Productos después |
|---|---|---|---|---|
| **FCP** (primer contenido visible) | 4,0 s | **0,7 s** | 5,1 s | **0,7 s** |
| **LCP** (contenido principal) | 4,0 s | 3,9 s | 5,1 s | **4,4 s** |
| **Speed Index** | 4,0 s | 3,7 s | 4,1 s | **3,1 s** |
| **Peso transferido** | 447 KB | **245 KB (−45 %)** | 507 KB | **304 KB (−40 %)** |
| **CLS** | 0 | 0 | 0,002 | 0,002 |
| **Accesibilidad** | 100 | 100 | 96 | **100** |
| Recursos que bloquean el render | 2 | **0** | 2 | **0** |

Además, en el Ejercicio 2 el **bundle inicial bajó de 691 kB a 351 kB** (161 → 98 kB comprimido) gracias a la carga diferida. Hoy es de 386 kB (106 kB comprimido) tras el rediseño visual (la configuración global de íconos importa `MatIcon` en el bundle inicial).

---

## Técnicas aplicadas

### 1. Dividir y reducir el JavaScript (carga diferida)

**Qué es:** enviar solo el código necesario para la pantalla actual y cargar el resto bajo demanda.

**Cómo se aplicó:**
- **Rutas diferidas** (`loadComponent` / `loadChildren`): el login no descarga el código de la tabla, el store de productos ni los componentes de Material que solo usa el panel.
- **Estado de NgRx por feature** (`provideState` / `provideEffects` en la ruta): el store y los effects de productos viajan en el chunk diferido, no en el bundle inicial.
- **Importación dinámica de lo que no se necesita al inicio:** `MatSnackBar`, y con él todo el sistema de *overlay* del CDK, se carga con `import()` la primera vez que se muestra un mensaje.
- **Detección del problema midiendo, no adivinando:** con *sourcemaps* se descubrió que una sola línea (`MatPaginatorIntl` importado en la configuración global) arrastraba paginator → select → overlay → forms al bundle inicial.
- **Acortar la cadena de peticiones:** el router cargaba el layout y *después* descubría el chunk de productos, es decir, dos viajes de red seguidos antes de poder pedir datos a la API. Al agrupar el área autenticada en un solo chunk (`core/layout/authenticated.routes.ts`) se eliminó un nivel de la cadena: **LCP de productos 5,1 s → 4,4 s**.

**Métricas que mejora:** LCP, TBT/INP (menos JS que parsear en CPUs lentas) y datos consumidos.

### 2. Fuentes e íconos optimizados y auto-alojados

**Qué es:** las fuentes suelen ser de los recursos más pesados y, si vienen de otro dominio, bloquean el render.

**Cómo se aplicó:**
- **Subconjunto de íconos:** la fuente completa de Material Icons pesaba **170 KB** (más que todo el JS inicial) para usar ~40 de sus 2.000+ íconos. `scripts/build-icon-font.mjs` genera una fuente **solo con los íconos usados: 5,9 KB (−96 %)**. El script falla si una plantilla usa un ícono que no está en la lista, así nunca falta un ícono en producción.
- **Auto-alojamiento:** Inter se sirve desde nuestro dominio (`@fontsource-variable/inter`), una sola fuente variable para todos los pesos, y el navegador descarga solo el subconjunto *latin* gracias a `unicode-range`. Se eliminaron las 2 hojas de estilo de Google Fonts que **bloqueaban el render** y la conexión extra a otros dominios (DNS + TLS, muy caros en 3G).
- Se eliminó una fuente monoespaciada (21 KB) usada solo para el SKU; ahora se usa la del sistema.
- `font-display: swap` para el texto (se lee de inmediato con la fuente del sistema) y `block` para íconos (evita mostrar la palabra "delete" en lugar del ícono).

**Métricas que mejora:** peso transferido (−200 KB por página), FCP y Speed Index.

### 3. Percepción de velocidad: app shell, esqueletos y estabilidad visual

**Qué es:** el usuario tolera mejor la espera si ve progreso inmediato y la pantalla no salta.

**Cómo se aplicó:**
- **App shell en `index.html`:** HTML y CSS mínimos en línea (~1 KB) que pintan la marca y "Cargando panel…" **antes** de que llegue el JavaScript. **FCP de 4,0–5,1 s a 0,7 s**: el usuario ve una respuesta 3+ segundos antes en lugar de una pantalla en blanco.
- **Esqueletos (skeletons)** con la forma real de la tabla y de las tarjetas de indicadores mientras llegan los datos, en lugar de un spinner genérico.
- **CLS ≈ 0:** la barra de progreso tiene altura reservada, los esqueletos ocupan el mismo espacio que el contenido final y la tabla se atenúa en lugar de desaparecer al paginar.
- **Respuestas inmediatas a la interacción:** botones deshabilitados con spinner al guardar, `exhaustMap` para evitar envíos dobles con conexiones lentas y el diálogo que no se cierra si falla (no se pierde lo escrito).

**Métricas que mejora:** FCP, CLS y la experiencia percibida.

### 4. Menos datos por la red: paginación, búsqueda eficiente y caché HTTP

**Cómo se aplicó:**
- **Paginación, filtros y orden del lado del servidor:** cada página de 10 productos pesa **~2 KB**. Nunca se descarga el catálogo completo, algo clave cuando crezca a miles de productos.
- **Indicadores calculados en MongoDB** con una agregación (`GET /products/stats`, < 1 KB) en lugar de traer todos los productos para sumarlos en el celular.
- **Búsqueda con `debounceTime(400)`** y mínimo 2 caracteres, más `switchMap`, que **cancela la petición anterior** si el usuario sigue escribiendo o paginando.
- **nginx:** compresión gzip; JS, CSS y fuentes con hash en el nombre se cachean **1 año como `immutable`** (en la segunda visita no se descargan), e `index.html` con `no-cache` para recibir siempre la última versión.

**Métricas que mejora:** datos consumidos, LCP en visitas repetidas e INP.

### 5. Render eficiente y UX táctil

- **Angular *zoneless* + signals + `ChangeDetectionStrategy.OnPush`:** solo se re-renderiza lo que cambió; los componentes leen el store con `selectSignal`.
- **`trackBy` / `@for track`** en listas: al paginar no se recrean filas que no cambiaron.
- **Diseño móvil específico, no solo "encogido":** en pantallas < 600 px la tabla se reemplaza por tarjetas, el botón "Nuevo producto" pasa a ser flotante al alcance del pulgar, las áreas táctiles miden ≥ 44 px y los campos usan `inputmode="numeric"` / `"email"` para mostrar el teclado adecuado.
- **Accesibilidad:** contraste mínimo 4,5:1 (se corrigió un gris de 3,09:1 detectado por Lighthouse: **96 → 100**), respeto a `prefers-reduced-motion`, `aria-label` en botones de ícono y foco visible.

---

## Decisiones y trade-offs

- **El puntaje de Lighthouse no es el objetivo.** Con el app shell, el puntaje de productos bajó de 76 a 71 porque el TBT subió (50 → 540 ms). La causa: TBT solo cuenta las tareas largas que ocurren *después* del primer pintado, y como ahora se pinta mucho antes, el arranque de Angular cae dentro de esa ventana. **El JavaScript no hace más trabajo**; el usuario ve contenido 3,6 s antes. Se priorizó la experiencia real sobre el número.
- **SEO 63 a propósito:** `robots.txt` bloquea la indexación porque es un **panel de administración privado**. En la tienda pública sería al revés: SSR o prerender para SEO.
- **El LCP sigue en ~4 s en 4G lento** porque la app se renderiza en el navegador: el contenido real depende de descargar y ejecutar JS y luego llamar a la API. El siguiente paso para bajarlo está en las propuestas.

## Propuestas para el siguiente paso (no implementadas)

1. **PWA con Service Worker (`@angular/pwa`):** la más importante para el contexto rural.
   - Cachear la app (las visitas siguientes cargan sin red).
   - Cachear el catálogo con estrategia *stale-while-revalidate*: se muestran datos aunque falle la conexión.
   - Encolar altas y ediciones sin conexión con *Background Sync* y enviarlas al recuperarla.
2. **SSR o prerender (Angular SSR)** en la tienda pública: el HTML llega con contenido, lo que baja el LCP y mejora el SEO. En el panel privado, el app shell da gran parte del beneficio sin un servidor Node.
3. **Imágenes de producto** (cuando existan): `NgOptimizedImage`, WebP/AVIF, `srcset` por tamaño de pantalla, `loading="lazy"` bajo el pliegue, `priority` en la imagen LCP y un CDN de imágenes que redimensione.
4. **Listas largas:** *virtual scroll* del CDK si el catálogo se muestra sin paginar (por ejemplo, un selector de productos en un pedido).
5. **Brotli y HTTP/2–3 detrás de un CDN** (~15–20 % menos que gzip y mejor multiplexación en redes con pérdida de paquetes).
6. **Respetar el ahorro de datos:** con `Save-Data` / `navigator.connection.saveData`, evitar imágenes pesadas o precargas.
7. **Medición continua:**
   - **Lighthouse CI** en cada PR con presupuestos (*budgets*) que fallen el build si el bundle o el LCP empeoran.
   - **RUM** (`web-vitals` → analítica) para medir a usuarios reales en campo, porque el laboratorio no reproduce la red de una vereda.

---

## Metodología de medición (y una lección aprendida)

- Script reproducible: `frontend/scripts/lighthouse-audit.mjs`. Usa Lighthouse y puppeteer-core, vacía la caché HTTP antes de cada medición e inyecta la sesión del usuario demo para medir `/products`.
- **Comparación A/B en igualdad de condiciones:** la versión anterior se construyó desde el commit previo y se levantó en otro puerto contra la misma API; se alternaron las ejecuciones de "antes" y "después".
- **Lección:** la primera medición dio "0 KB transferidos" porque reutilizaba la caché del navegador, y la simulación de Lighthouse (`simulate`) dio resultados **bimodales** en esta app (LCP de 0,6 s o 2,2 s según la ejecución). Una sola ejecución habría llevado a conclusiones falsas. Por eso los resultados finales usan **caché vacía, throttling real (`devtools`) y la mediana de varias ejecuciones**.
