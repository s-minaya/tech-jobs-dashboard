# 014 · Auditoría KPI cards y stats de la landing — Tareas

## Preparación

- [x] Confirmado con el usuario antes de empezar la implementación
- [x] `.env.local` no se lee en ningún paso (solo se usa internamente por
      `dotenv.config()`/el pool de `pg` para conectar, nunca se imprime ni
      se lee su contenido con las herramientas de este agente).

## Backend

- [x] `api/src/salaryQuery.js`: nueva `salaryQualityConditions(alias)`
      (hallazgo 6) — función, no array fijo (se resolvió así en vez de
      cómo se planteó en `014-plan.md`: `statsQuery.js` necesita la misma
      regla con 2 alias distintos — `j` y `j2` — para no colisionar entre
      la query principal y su subconsulta de salario).
- [x] `api/src/index.js`: handler de `/api/salary/by-role-country` usa
      `...salaryQualityConditions()` en vez de los 3 `conditions.push`
      sueltos.
- [x] `api/src/statsQuery.js` (nuevo): `buildStatsSummaryQuery()` — usa
      `salaryQualityConditions`, alias `j` en `FROM jobs j`,
      `MAX(j.last_seen_at)` en vez de `MAX(j.posted_at)` (hallazgo 5).
- [x] `api/__tests__/statsQuery.test.js` (nuevo, 9 tests): la query
      generada incluye las condiciones de `salaryQualityConditions`, usa
      `last_seen_at` y no `posted_at`, no depende de ningún parámetro.
- [x] `api/src/statsCache.js` (nuevo): `getCached(computeFn)` con TTL de
      10 minutos + `_resetCacheForTests`.
- [x] `api/__tests__/statsCache.test.js` (nuevo, 4 tests,
      `vi.useFakeTimers()`): primera llamada ejecuta `computeFn`; segunda
      llamada dentro del TTL no lo re-ejecuta; tras superar el TTL, sí;
      un rechazo de `computeFn` no deja la caché envenenada.
- [x] `api/src/index.js`: el handler de `/api/stats/summary` delega en
      `statsQuery.js` + `statsCache.js`.
- [x] `EXPLAIN (ANALYZE, BUFFERS)` de la query real, vía scripts
      temporales con el mismo pool/config de `index.js` (sin imprimir
      `DATABASE_URL`, borrados tras usarlos) — ver "Resultado del
      EXPLAIN" abajo.
- [x] `schema.sql`: índice nuevo `idx_jobs_active_summary` — **aplicado
      contra la BD real** (confirmado vía `pg_indexes`).
- [x] Probado, con `EXPLAIN` aislado, si reescribir la subconsulta de
      `total_skills`/`top_skills_30d` ayudaba — ver "Resultado del
      EXPLAIN": se documenta como límite estructural, no se reescribe
      (mismo criterio que la fase 013 con `skills/top`: el índice ayuda a
      la parte que puede ayudar, el resto queda mitigado por la caché en
      vez de perseguir cada milisegundo).

### Resultado del EXPLAIN — diseño del índice y semántica de negocio

**Query original (5 campos, antes de la ampliación de alcance)**:
22,7s directa (sin caché), 56,1s bajo `EXPLAIN ANALYZE`. Desglose:
InitPlan de `total_skills` (`Nested Loop` de 244.026 filas de
`job_skills` contra `jobs` por PK, `Memoize` al 60,6% de aciertos):
36,3s. Resto de la agregación vía `idx_jobs_country` (no cubre
`salary_mid`/`salary_is_predicted`/`last_seen_at`, heap fetch en casi
cada fila): 19,7s.

**Query ampliada (7 campos, con `median_salary_90d`/`top_skills_30d`
para la landing)**: 88s directa, sin caché. `EXPLAIN ANALYZE` de la
query completa dio *statement timeout* (supera el límite de la
conexión) — se aisló cada subconsulta nueva por separado:
- `median_salary_90d` sola: **29s**. `Bitmap Heap Scan` vía
  `idx_jobs_salary_mid` (no cubre `is_active`/`posted_at` — recheck y
  heap fetch para ~97.000 filas candidatas).
- `top_skills_30d` sola: **8,9s**. `Hash Join` razonable vía
  `idx_jobs_active_posted_at`, pero con `Sort` externo a disco
  (`work_mem` insuficiente para el `GROUP BY` completo antes del
  `LIMIT 3`) y bastantes heap fetches en el índice (páginas no
  `all-visible`, mismo matiz que la fase 013).

**Índice nuevo, diseñado a partir de esta evidencia** (cubre la query
base + `median_salary_90d`, que comparten necesidad de columnas de
`jobs` filtradas por `is_active`):
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_summary
    ON jobs (id)
    INCLUDE (country_code, salary_mid, salary_is_predicted, last_seen_at, posted_at)
    WHERE is_active = TRUE;
```
**Aplicado contra la BD real** en 27s. **Resultado real, verificado en
vivo contra el servidor**: primera petición tras limpiar toda caché,
**37s** (baja desde 88s — el índice ayuda a 2 de las 3 partes caras,
pero `total_skills`/`top_skills_30d` siguen sin índice propio, ver
abajo). Segunda petición (dentro del TTL de 10 min): **71-95ms**.

**`total_skills` (36s) y `top_skills_30d` (8,9s) quedan sin índice
dedicado** — son un patrón distinto (recorren `job_skills`, no `jobs`;
un índice de `jobs` no los cubre) y, a diferencia de la fase 013, aquí
**no** es la única mitigación disponible: con la caché de 10 minutos
puesta, este coste se paga como mucho una vez cada 10 minutos, no en
cada carga. Documentado como candidato a un índice específico de
`job_skills`/reescritura de la subconsulta en una ronda futura si
demuestra ser un problema real en producción — no se persigue más aquí,
mismo criterio que la fase 013 con el límite de `<2s`.

**Semántica de negocio corregida durante la implementación**: el pedido
original de la card de salario era "últimos 6 meses". Verificado con
los datos reales: `median_salary_6m` (ventana de 6 meses) y el salario
mediano global SIN ninguna ventana dieron el **mismo valor exacto**
(45.000€) — confirma en la práctica lo que la fase 013 ya había
documentado (una oferta activa nunca supera ~90-98 días de antigüedad,
`is_active` pasa a `FALSE` en origen sobre esa marca). "6 meses" habría
sido una ventana decorativa, sin ningún efecto real — mismo tipo de bug
silencioso que la fase 013 corrigió para el filtro de periodo, evitado
aquí desde el origen. Renombrado a `median_salary_90d`, reusando el
mismo número que ya usa el selector de periodo del sidebar.

## Frontend

- [x] `src/components/ui/ChartCard.jsx`: `export` en `SLOW_LOADING_MS`.
- [x] `src/hooks/useSummaryStats.js` (nuevo): fetch compartido con
      promesa en vuelo a nivel de módulo (dedup de peticiones
      simultáneas) + `_resetInFlightForTests`.
- [x] `src/components/layout/SummaryStats.jsx`: usa `useSummaryStats()`
      en vez de su fetch propio; aviso de carga lenta tras
      `SLOW_LOADING_MS` (hallazgo 3); descripción de "Ofertas activas"
      interpola `stats.total_countries` (hallazgo 4); descripción de
      "Países cubiertos" usa `Object.keys(NOMBRES_PAISES)` (hallazgo 4);
      descripción de "Última actualización" → "última sincronización con
      la fuente" (hallazgo 5).
- [x] `src/components/landing/LandingPage.jsx` — **ampliación de
      alcance, ver más abajo**: no se quedó en "solo lógica" — el usuario
      pidió además un rediseño visual del bloque de stats tras leer
      `014-plan.md` (ver esa sección).
- [x] `src/mocks/handlers.js`: `last_updated` se mantiene igual (sigue
      siendo un ISO string, el consumidor no distingue de dónde viene) —
      se añaden `median_salary_90d`/`top_skills_30d` (ver ampliación).

## Tests

- [x] `src/tests/hooks/useSummaryStats.test.js` (nuevo, 6 tests): dos
      montajes solapados comparten una sola petición real (mock de
      `getSummaryStats` llamado 1 vez); error propagado; desmontar antes
      de resolver no produce ningún warning de "state update on
      unmounted component"; una petición ya resuelta no se reutiliza en
      un montaje posterior (dispara una nueva).
- [x] `src/tests/components/layout/SummaryStats.test.jsx`: adaptado al
      hook nuevo; nuevos casos — descripción de "Ofertas activas"
      interpola el país real (2 tests, incluido un valor distinto de 8),
      descripción de "Países cubiertos" lista `NOMBRES_PAISES`,
      descripción de "Última actualización" ya no dice "oferta más
      reciente", aviso de carga lenta (mock de `ChartCard` con
      `SLOW_LOADING_MS` reducido para no depender de fake timers
      mezclados con fetch interceptado por MSW — ver comentario en el
      archivo).
- [x] `npx vitest run` (frontend) — **393/393**.
- [x] `npx vitest run` (`api/`) — **73/73**.
- [x] `npm run build` sin errores.

## Verificación contra el backend real

- [x] `GET /api/stats/summary` — primera petición (caché fría, tras
      limpiar `.dev-cache/` y con el índice ya aplicado): **37s**.
      Segunda petición con distinta URL (`?_bypass_devcache=1`, para
      forzar que el middleware de dev-cache marque MISS y así probar
      específicamente `statsCache.js`, no la caché de disco): **95ms** —
      confirma que la caché en memoria funciona independientemente de
      `devCache.js`.
- [x] `pct_with_salary` idéntico antes/después de centralizar la
      condición (35,6-35,7%, variación normal por ingesta continua entre
      mediciones, no por el refactor).
- [x] `last_updated` refleja `last_seen_at` (verificado: `posted_at` y
      `last_seen_at` de la oferta activa más reciente diferían en 38
      minutos en una medición — confirma que no son intercambiables).
- [x] Recargar la landing y entrar rápido al dashboard: verificado por
      E2E (ver más abajo) que la landing carga con datos reales.
- [x] Verificación manual: "Ofertas activas"/"Países cubiertos" con
      descripciones siempre consistentes entre sí (cubierto también por
      test unitario con `total_countries` distinto de 8).

## Ampliación de alcance — rediseño del bloque de stats de la landing

Tras leer `014-plan.md`, el usuario pidió ir más allá del fix de lógica:
rediseñar el contenido de las 3 stats de la landing, quitar el badge
superior, animar los contadores, y que investigue un loader percibido
como roto. Ver `014-spec.md`, "Ampliación de alcance", para el permiso
explícito ampliado sobre la zona congelada (solo este bloque, nunca el
resto de la landing).

- [x] `api/src/statsQuery.js`: `median_salary_90d` (no 6 meses, ver
      "Resultado del EXPLAIN" arriba) y `top_skills_30d` nuevos en la
      misma query/caché.
- [x] `src/lib/formatRelativeTime.js` (nuevo) + 6 tests.
- [x] `src/hooks/useCountUp.js` (nuevo) + 4 tests. **Bug real encontrado
      al testear**: `start = performance.now()` capturado FUERA del
      callback de `requestAnimationFrame` y comparado contra el `now`
      que ese callback recibe puede venir de una base de reloj distinta
      en jsdom (confirmado con datos reales del test: `progress`
      terminaba siendo un número negativo enorme, ej. -126809953) — se
      corrigió capturando `start` dentro del PRIMER tick, garantizando la
      misma base de reloj en todas las lecturas. No se puede descartar
      que sea un matiz específico de jsdom y no de navegadores reales,
      pero el patrón corregido es de todos modos más robusto y es
      justo el recomendado para código de animación con rAF.
- [x] `src/components/landing/LandingPage.jsx`: badge superior
      eliminado; 3 cards rediseñadas — título + icono + métricas +
      contador animado (`RiEarthLine`/`RiMoneyEuroCircleLine`/
      `RiFireLine`, verificados como iconos reales de `react-icons/ri`
      antes de usarlos).
- [x] `src/components/ui/PageLoader.jsx`: animación `infinite` en vez de
      `1` — con iteration-count 1 y sin `animation-fill-mode`, superar
      los 2s dejaba el logo congelado a opacidad completa (el "logo que
      se queda" reportado).
- [x] `src/App.jsx`: `isLoading` deja de ser un `setTimeout` fijo de
      800ms — espera un mínimo de 500ms y a que `useSummaryStats()`
      indique `loading=false`, con techo duro de 4000ms. Llama a
      `useSummaryStats()` también aquí — gracias a la deduplicación no
      añade una petición nueva.
- [x] `src/mocks/handlers.js`: mock de `/api/stats/summary` con
      `median_salary_90d`/`top_skills_30d`.
- [x] `src/tests/hooks/useCountUp.test.js`, `src/tests/lib/formatRelativeTime.test.js` (nuevos).
- [x] `e2e/dashboard.spec.js`: test E2E nuevo para la landing (Lightfall
      es WebGL — no se puede testear con RTL/jsdom sin contexto WebGL
      real, mismo motivo por el que `MainContent` tampoco tiene test
      unitario; se verifica con Playwright/Chromium real en su lugar) —
      confirma las 3 cards nuevas, que el badge desapareció, y que los
      contadores terminan mostrando un número real.
- [x] Verificación manual + E2E: landing con las 3 cards nuevas,
      contadores animando, loader esperando a los datos reales.

### Bug pre-existente descubierto (no relacionado con esta feature)

Al ejecutar el E2E completo por primera vez desde la traducción del
sidebar (fase 013), 2 tests fallaban:
`e2e/dashboard.spec.js` buscaba botones de país por su código crudo
(`/^DE$/`, `/^FR$/`), pero el sidebar muestra el nombre traducido
("Alemania", "Francia") desde `OPTION_LABELS` (fase 013). Nadie lo había
detectado porque el E2E completo no se había vuelto a ejecutar desde
entonces (no es obligatorio en cada feature, solo "al final de una
completa" — `AGENTS.md`). Corregido: los selectores ahora buscan el
texto traducido. Sin relación con el trabajo de esta fase, más allá de
haber sido la primera en ejecutar el E2E completo tras la 013.

- [x] `e2e/dashboard.spec.js`: selectores de país corregidos a
      `/^Alemania$/`/`/^Francia$/`.

### Verificación E2E completa (Playwright, Chromium real)

- [x] **11/11 tests pasan** — incluidos los 2 arreglados y el nuevo de
      la landing. `landing → dashboard`, `landing: 3 cards`,
      `sessionStorage`, `KPI cards`, `Top Skills`, `Evolución mensual`,
      `Salario`, `Heatmap`, `Filtros` (x2), `Tema`.

## Segunda ampliación de alcance — loader de la landing y KPI cards del dashboard

Ver `014-plan.md`, "Segunda ampliación de alcance", para el diseño
completo. El usuario probó la primera ronda, aclaró que el loader debía
tapar la carga *inicial* de la landing (no solo la transición), y tomó
las decisiones pendientes de las KPI cards del dashboard.

### Backend

- [x] `api/src/statsQuery.js`: `total_companies`
      (`COUNT(DISTINCT j.company)`) y `total_role_categories`
      (`COUNT(DISTINCT j.role_category)`) en la agregación principal.
- [x] `api/__tests__/statsQuery.test.js`: test nuevo confirmando ambos
      campos en la query generada.
- [x] `schema.sql`: se intentó ampliar `idx_jobs_active_summary` con
      `company`/`role_category` — **no se pudo aplicar** (3 intentos,
      `DROP INDEX CONCURRENTLY` con `statement timeout` contra la BD
      real). Documentado con la definición objetivo para reintentar más
      adelante; el índice se queda en su versión anterior (sigue
      cubriendo 5 de las 7 columnas de la query).
- [x] Verificado en vivo contra el servidor real: `total_companies:
      "23248"`, `total_role_categories: "16"` en la respuesta.

### Frontend

- [x] `src/hooks/useCountUp.js`: el último frame fija `value = target`
      exacto (sin redondear) — necesario para `pct_with_salary` (35.7).
- [x] `src/tests/hooks/useCountUp.test.js`: test nuevo con target
      decimal.
- [x] `src/components/landing/LandingPage.jsx`: `PageLoader` como early
      return mientras `useSummaryStats().loading` (con techo
      `LANDING_LOADER_MAX_MS = 8000`); `fmt()` redondea explícitamente
      (`useCountUp` ya no lo hace por defecto).
- [x] `src/tests/components/landing/LandingPage.test.jsx` (nuevo):
      mientras carga, se ve el loader (logo) y no el hero/CTA — el resto
      (Lightfall montado, cards, contadores) no se puede testear con
      RTL/jsdom (WebGL), se cubre con E2E.
- [x] `src/components/layout/SummaryStats.jsx`: "Ofertas activas"/
      "Países cubiertos" → "Empresas analizadas"/"Roles analizados";
      las 4 cards numéricas animan con `useCountUp`; "Última
      actualización" no anima (es una fecha).
- [x] `src/mocks/handlers.js`: `total_companies`/`total_role_categories`
      añadidos al mock (23.248 y 16 — valores reales, no arbitrarios: un
      mock de 4 dígitos no habría ejercitado el separador de miles real,
      ver nota abajo).
- [x] `src/tests/components/layout/SummaryStats.test.jsx`: reescrito —
      labels/valores nuevos, `waitFor` con timeout ampliado (2s) para
      dar tiempo a la animación (1200ms por defecto).

### Hallazgo curioso descubierto al testear (no es un bug)

`(3210).toLocaleString("es-ES")` → `"3210"` (sin separador), pero
`(26023).toLocaleString("es-ES")` → `"26.023"` (con separador) —
comportamiento real y documentado de `Intl.NumberFormat` con
`useGrouping: "auto"`: la configuración regional de `es-ES` no agrupa
números de 4 dígitos, solo a partir de 5. Confirmado en Node
directamente, no es un bug de la app. El mock de `total_companies` se
ajustó a un valor de 5 dígitos (23.248, el real) para que el test
ejercite el caso que un usuario real vería.

### Verificación

- [x] `npx vitest run` (frontend) — **393/393** (28 archivos, incluido
      `LandingPage.test.jsx` nuevo).
- [x] `npx vitest run` (`api/`) — **74/74**.
- [x] `npm run build` sin errores.
- [x] Servidor real: primera petición tras limpiar caché (sin el índice
      ampliado) — 66,9s; segunda (caché en memoria) — 8,6ms.
- [x] **E2E completo — 11/11**, incluidos 3 tests actualizados (anclaban
      la espera de "las KPI cards ya cargaron" al texto "Ofertas
      activas", ahora usan "Skills rastreadas", sin cambios de nombre).

## Ronda 3 — el loader seguía sin funcionar bien en pruebas reales

Tras la ronda 2, el usuario probó en Firefox y Chrome: en Firefox el
loader dejó de aparecer del todo tras el primer éxito (incluso
reiniciando todo); en Chrome aparecía un instante y la página quedaba
"mal cargada". Un subagente de exploración se cortó por límite de
sesión; se investigó directamente (lectura de código) + 2 preguntas de
diagnóstico al usuario (Network tab en Chrome, ventana privada en
Firefox).

### Diagnóstico

Ambos síntomas encajaban con una sola causa: `LANDING_LOADER_MAX_MS`
(8000ms) era muchísimo más corto que el tiempo real en frío de
`/api/stats/summary` (**37-90s**, medido en la ronda 1 con
`EXPLAIN ANALYZE`). Cualquier visita tras un reinicio del servidor
(`node --watch` reinicia en cada guardado) o tras >10 min de
inactividad golpeaba el camino frío: el loader se rendía a los 8s y
revelaba la landing con `stats` todavía `null` (los "…" que el usuario
describió como "no cargó bien"/"el skeleton"). Una vez esa primera
petición lenta terminaba en segundo plano, la caché quedaba caliente y
todas las visitas siguientes eran instantáneas — de ahí "ya nunca vuelve
a salir el loader" tras el primer intento.

### Fix — 3 cambios coordinados

- [x] `api/src/index.js`: calienta `statsCache.js` justo al conectar con
      la BD al arrancar el servidor (fire-and-forget, no bloquea el
      arranque) — así la query cara corre una vez por arranque de forma
      proactiva en vez de esperar al primer visitante real.
- [x] `api/src/statsCache.js`: TTL de 10 → **30 minutos** (los datos
      cambian ~1 vez/día, 30 min sigue siendo imperceptible en
      frescura).
- [x] `src/components/landing/LandingPage.jsx`: `LANDING_LOADER_MAX_MS`
      de 8000 → **20000ms**.
- [x] `src/App.jsx`: `MAX_LOADER_MS` de 4000 → **10000ms** (mismo
      motivo, defensa en profundidad para la transición al dashboard).

### Bug real encontrado al verificar el calentamiento contra el servidor real

Al reiniciar el servidor y medir el calentamiento, la primera petición
tardó **87s** — más lento que el peor caso ya medido (66-88s), no
menos. Investigado: `getCached()` no deduplicaba llamadas
**concurrentes** — solo evitaba recomputar si ya había un valor
cacheado, pero mientras `computeFn()` estaba en curso (el propio
calentamiento), una segunda llamada (mi petición de verificación) veía
`cachedValue === null` igual y lanzaba **una segunda ejecución completa
de la misma query pesada en paralelo**, compitiendo por los mismos
recursos de la BD — exactamente el mismo tipo de problema que
`inFlightPromise` ya resuelve en el frontend (`useSummaryStats.js`),
que no se había aplicado en el backend.

- [x] `api/src/statsCache.js`: `getCached()` ahora comparte una
      `inFlightPromise` entre llamadas concurrentes — la segunda (y
      siguientes) esperan la MISMA ejecución en vez de arrancar una
      nueva. No cachea rechazos (comportamiento ya existente,
      preservado).
- [x] `api/__tests__/statsCache.test.js`: 2 tests nuevos — llamadas
      simultáneas comparten una sola ejecución de `computeFn`; tras
      resolver, la siguiente llamada ya usa la caché.
- [x] **Verificado en vivo tras el fix**: servidor reiniciado, petición
      de prueba justo tras el arranque → **57,3s** (una sola query, dentro
      del rango normal, ya no doblada) → siguiente petición → **10ms**
      (caché caliente confirmada).

### Limitación conocida que queda (documentada, no se resuelve aquí)

Con `node --watch` reiniciando en cada guardado durante desarrollo
activo, cualquier visita en los primeros ~60-90s tras un reinicio
seguirá viendo el camino frío (ahora sin duplicar trabajo, pero la query
en sí sigue tardando lo que tarda). El calentamiento + TTL de 30 min
hacen esto raro en uso real (solo justo tras un reinicio/deploy, no cada
10 min); eliminarlo del todo requeriría bajar el tiempo de la query en
frío (índice más agresivo, tabla resumen materializada — ya documentado
como candidato a una ronda futura en `014-tasks.md`, ronda 1) o
desacoplar el arranque del servidor de la disponibilidad de la ruta.

### Verificación final

- [x] `npx vitest run` (frontend) — **393/393**.
- [x] `npx vitest run` (`api/`) — **76/76**.
- [x] `npm run build` sin errores.
- [x] E2E completo — **11/11** (1 flake transitorio en "Top Skills",
      contención de recursos por las pruebas de calentamiento en
      paralelo — confirmado no relacionado, pasa limpio en aislado).

## Cierre

- [x] Validado contra todos los criterios de `014-spec.md`.
- [x] `spec/README.md` actualizado.
- [x] `spec/constitution/roadmap.md` actualizado.
- [ ] Commit (solo tras confirmación explícita del usuario).
