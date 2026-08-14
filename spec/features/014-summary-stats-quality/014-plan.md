# 014 · Plan — Auditoría KPI cards y stats de la landing

Ver `014-spec.md` para el qué/por qué, la excepción acotada de la
landing y los criterios de aceptación. Este documento detalla el cómo,
con la evidencia real que sustenta cada hallazgo.

## 1+2+3. Rendimiento, petición duplicada y skeleton sin aviso — un solo fix combinado

Los tres hallazgos comparten una única causa raíz (`GET /api/stats/summary`
es cara y se pide dos veces) y se resuelven con un solo cambio de
arquitectura: **caché en memoria del proceso Express**, con un índice de
apoyo para el caso de fallo de caché.

### Por qué caché y no (solo) un índice

A diferencia de las gráficas filtradas (fases 010/011/013), esta query no
tiene combinatoria de filtros — siempre devuelve exactamente la misma
respuesta hasta que el pipeline de ingesta vuelve a correr. Verificado en
vivo: nada se ha ingerido/visto "hoy" en el momento de la comprobación, y
el último `last_seen_at` real es de ayer — la cadencia real de cambio es
de horas/días, no de peticiones. Una caché con TTL corto (minutos) es
indistinguible de "datos en tiempo real" para el usuario y elimina el
99% del coste sin ningún riesgo de mostrar datos obsoletos de forma
perceptible.

**`api/src/statsCache.js` (nuevo)**:
```js
// Caché en memoria (proceso), TTL corto — a diferencia de devCache.js
// (herramienta temporal de desarrollo en disco, ver ese archivo), esta
// es una decisión de diseño permanente: los datos que resume
// /api/stats/summary cambian solo cuando corre el pipeline de ingesta
// (~1 vez/día, verificado en vivo), muchísimo más despacio que
// cualquier TTL razonable aquí.
const TTL_MS = 10 * 60 * 1000; // 10 minutos

let cachedValue = null;
let cachedAt = 0;

export async function getCached(computeFn) {
  const now = Date.now();
  if (cachedValue && now - cachedAt < TTL_MS) return cachedValue;
  cachedValue = await computeFn();
  cachedAt = now;
  return cachedValue;
}

// Solo para tests — resetea el estado del módulo entre casos.
export function _resetCacheForTests() {
  cachedValue = null;
  cachedAt = 0;
}
```
`index.js`:
```js
app.get("/api/stats/summary", async (req, res) => {
  try {
    const stats = await getCached(async () => {
      const { text } = buildStatsSummaryQuery();
      const result = await pool.query(text);
      return result.rows[0];
    });
    res.json(stats);
  } catch (err) {
    errorHandler(res, err, "stats-summary");
  }
});
```
Tests (`api/__tests__/statsCache.test.js`, `vi.useFakeTimers()`): primera
llamada ejecuta `computeFn`; segunda llamada dentro del TTL NO vuelve a
ejecutarlo (devuelve el valor cacheado); tras superar el TTL, vuelve a
ejecutarlo; un error en `computeFn` no deja la caché en un estado
envenenado (no cachea rechazos).

### Índice de apoyo (para el propio cache-miss)

**Evidencia** (`EXPLAIN ANALYZE`, BD real, sin caché — ver `014-spec.md`
hallazgo 1): 56,1s totales — 36,3s en la subconsulta de `total_skills`
(`Nested Loop` de 244.026 filas de `job_skills` contra `jobs` por PK, con
`Memoize` al 60,6% de aciertos) y 19,7s en el resto de la agregación
(`Index Scan` sobre `idx_jobs_country`, que no cubre
`salary_mid`/`salary_is_predicted`/`last_seen_at` — heap fetch en casi
cada fila).

**Propuesta inicial** (a confirmar/ajustar con un nuevo `EXPLAIN ANALYZE`
durante la implementación, mismo criterio que fases 010/011/013 — el
índice se diseña a partir de evidencia, no a ciegas):
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_summary
    ON jobs (id)
    INCLUDE (country_code, salary_mid, salary_is_predicted, last_seen_at)
    WHERE is_active = TRUE;
```
Cubre la parte de la agregación principal (Index Only Scan sin heap
fetch, salvo páginas aún no `all-visible` — mismo matiz ya documentado
para `idx_jobs_active_posted_at` en la fase 013). La subconsulta de
`total_skills` (el 65% del coste total) es un patrón distinto — un
`Nested Loop` de `job_skills` contra `jobs` por PK no se arregla con un
índice de `jobs` nuevo. Durante la implementación se probará si
reescribir la subconsulta (p. ej. `WHERE job_id IN (SELECT id FROM jobs
WHERE is_active = TRUE)` en vez de `JOIN`) empuja al planner hacia un
`Hash Join` más barato — se documenta el resultado real en
`014-tasks.md`, se adopta la forma que resulte más rápida con `EXPLAIN`.
Con la caché puesta, este coste solo se paga una vez cada 10 minutos como
máximo, así que no es tan crítico como lo fue para `skills/top` en la
fase 013 — pero sigue mereciendo la pena reducirlo para el primer
usuario que golpee cada ventana de caché fría (y tras cada reinicio del
servidor).

### Deduplicación en el frontend (hallazgo 2)

**`src/hooks/useSummaryStats.js` (nuevo)** — hook compartido por
`SummaryStats` y `LandingPage`. Antes cada uno llamaba a
`getSummaryStats()` de forma independiente en su propio `useEffect`; como
la transición landing→dashboard tarda ~600ms y la petición 22-56s (sin
caché), casi cualquier usuario disparaba las dos — la de la landing
quedaba en vuelo, se desmontaba, y `SummaryStats` lanzaba una segunda
idéntica al montar.
```js
import { useEffect, useState } from "react";
import { getSummaryStats } from "@/services/jobServices";

// Promesa compartida a nivel de módulo (no por instancia): si
// SummaryStats monta mientras la petición de LandingPage sigue en
// vuelo, reutiliza la MISMA petición en vez de arrancar una segunda.
// No sustituye a la caché del backend (statsCache.js) — esto solo evita
// peticiones duplicadas *simultáneas*, no repetidas entre recargas.
let inFlightPromise = null;

export function useSummaryStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!inFlightPromise) {
      inFlightPromise = getSummaryStats().finally(() => {
        inFlightPromise = null;
      });
    }
    inFlightPromise
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}

// Solo para tests — evita que un test reutilice la promesa de otro.
export function _resetInFlightForTests() {
  inFlightPromise = null;
}
```
También corrige, de paso, el "setState sobre componente desmontado" que
hoy sufre `LandingPage` sin ningún guard (`getSummaryStats` no admite
`AbortController`, a diferencia de las 4 gráficas desde la fase 010 —
aquí no hace falta: la petición nunca se cancela, solo se ignora su
resultado si el componente ya no está montado).

**Consumidores**:
- `src/components/layout/SummaryStats.jsx`: sustituye su `useState`/
  `useEffect`/`getSummaryStats()` propio por
  `const { stats, loading, error } = useSummaryStats();`.
- `src/components/landing/LandingPage.jsx` (**dentro de la excepción
  acotada** — solo lógica, cero JSX/clases nuevas): sustituye su bloque
  equivalente por `const { stats } = useSummaryStats();`; se elimina el
  import de `getSummaryStats` (ya no se usa directo) y se añade el de
  `useSummaryStats`. `useState`/`useEffect` de React se quedan (los usa
  también `leaving`/`streakCount`).

### Aviso de carga lenta en `SummaryStats` (hallazgo 3, solo dashboard)

`SummaryStats` no usa `ChartCard` (layout propio de stat tiles), así que
no puede recibir `slowHint` como prop — se exporta la misma constante que
ya usa `ChartCard` y se replica localmente el mismo temporizador de 6s:
```js
// ChartCard.jsx
export const SLOW_LOADING_MS = 6000; // ya existía, se añade `export`
```
```js
// SummaryStats.jsx
const [showSlowHint, setShowSlowHint] = useState(false);
useEffect(() => {
  if (!loading) { setShowSlowHint(false); return; }
  const timer = setTimeout(() => setShowSlowHint(true), SLOW_LOADING_MS);
  return () => clearTimeout(timer);
}, [loading]);
```
Texto exacto a definir durante la implementación con el tiempo real
post-caché (mismo criterio que `SalaryChart`: el hint cita un número
medido, no una estimación) — solo debería llegar a mostrarse en el caso
raro de caché fría. La landing conserva su placeholder "…" actual sin
ningún cambio (fuera de la excepción: sería contenido/comportamiento
visual nuevo).

## 4. Texto hardcodeado de "países cubiertos"

**Fix** (`SummaryStats.jsx`, importa `NOMBRES_PAISES` de
`@/lib/filterUtils`, ya usado en otras gráficas):
```jsx
<KpiCard
  label="Ofertas activas"
  value={formatNumber(stats.total_active_jobs)}
  description={`en los ${formatNumber(stats.total_countries)} países cubiertos`}
/>
<KpiCard
  label="Países cubiertos"
  value={formatNumber(stats.total_countries)}
  description={Object.keys(NOMBRES_PAISES).join(", ")}
/>
```
El número de la primera card ahora es siempre el mismo dato que la
segunda (no puede desincronizarse). La lista de códigos de la segunda
pasa a tener una única fuente canónica (`NOMBRES_PAISES`) en vez de dos
copias independientes (`filterUtils.js` + este string suelto).

## 5. Etiqueta "Última actualización"

**Decisión propuesta** (juicio propio, fácil de revertir si se prefiere
la alternativa): cambiar el **dato**, no la etiqueta — usar
`MAX(j.last_seen_at)` en vez de `MAX(j.posted_at)`. Motivo: este es un
proyecto de portfolio (`mission.md`) y "última actualización" leído como
"el pipeline sigue vivo y sincronizando" es una señal más valiosa para
quien lo visita que "fecha de publicación de la oferta más reciente en
el mercado" — y es justo el dato que la etiqueta actual ya promete. La
alternativa más conservadora (cambiar la etiqueta a "Oferta más
reciente" y dejar `posted_at`) queda anotada por si se prefiere al
revisar esto.

**Fix**: `MAX(j.last_seen_at) AS last_updated` en `statsQuery.js`.
Descripción de la card (`SummaryStats.jsx`) pasa de "oferta más
reciente" (ya no describiría el dato nuevo) a "última sincronización con
la fuente".

## 6. Regla de salario duplicada — punto único de verdad

**Fix**: nueva constante exportada desde `api/src/salaryQuery.js` (dueño
natural de esta regla de negocio):
```js
export const SALARY_QUALITY_CONDITIONS = [
  "j.salary_mid IS NOT NULL",
  "j.salary_is_predicted = FALSE",
  "j.salary_mid >= 1000",
];
```
`index.js`, handler de `/api/salary/by-role-country`:
```js
conditions.push(...SALARY_QUALITY_CONDITIONS);
```
`statsQuery.js` la importa y la reusa en el `CASE WHEN` de
`pct_with_salary` (requiere alias `j` en el `FROM jobs j` de esta query,
que hoy no tiene ningún alias — cambio menor, sin efecto en el
resultado). `schema.sql`: comentario del índice
`idx_jobs_salary_by_role_country` actualizado para referenciar
`SALARY_QUALITY_CONDITIONS` como fuente de verdad (DDL no puede
"importar" una constante JS, así que el comentario deja explícito que
debe mantenerse en sync a mano si el criterio cambia algún día).

## 7. `api/src/statsQuery.js` (nuevo) — mismo patrón que `salaryQuery.js`/`demandQuery.js`/`skillsQuery.js`

```js
import { SALARY_QUALITY_CONDITIONS } from "./salaryQuery.js";

export function buildStatsSummaryQuery() {
  return {
    text: `
      SELECT
        COUNT(*)                                              AS total_active_jobs,
        COUNT(DISTINCT j.country_code)                        AS total_countries,
        (SELECT COUNT(DISTINCT js.skill_id)
         FROM job_skills js
         JOIN jobs j ON j.id = js.job_id
         WHERE j.is_active = TRUE)                            AS total_skills,
        ROUND(
          SUM(CASE WHEN ${SALARY_QUALITY_CONDITIONS.join(" AND ")}
                   THEN 1 ELSE 0 END) * 100.0
          / NULLIF(COUNT(*), 0)
        , 1)                                                  AS pct_with_salary,
        MAX(j.last_seen_at)                                   AS last_updated
      FROM jobs j
      WHERE j.is_active = TRUE
    `,
  };
}
```
`api/__tests__/statsQuery.test.js` (nuevo): el texto generado contiene
las 3 condiciones de `SALARY_QUALITY_CONDITIONS`, no depende de ningún
parámetro (siempre la misma query, sin `$N`), usa `last_seen_at` y no
`posted_at`. `index.js` delega en este módulo (ver bloque de código de
la sección 1+2+3).

## Evaluado, no es un bug

- **`total_skills` (JOIN) vs `/api/skills/list` (EXISTS)**: mismo
  resultado en vivo (478) — el criterio de la fase 009 se mantiene
  correcto. Sin cambios.
- **Coerción de tipos numéricos** (`total_active_jobs`/`total_countries`/
  `total_skills` llegan como string desde Postgres): ambos consumidores
  ya hacen `Number(n)` antes de formatear. Sin cambios.
- **`salary_is_predicted = FALSE`**: hoy excluye 0 filas (verificado en
  vivo — ninguna oferta activa tiene `salary_is_predicted = TRUE`), pero
  es una condición defensiva correcta, no dead code — se queda igual.

## Implementación (orden previsto)

1. `api/src/salaryQuery.js` — `SALARY_QUALITY_CONDITIONS` (hallazgo 6).
2. `api/src/index.js` — handler de `/api/salary/by-role-country` usa
   `...SALARY_QUALITY_CONDITIONS` en vez de los 3 `conditions.push`
   sueltos.
3. `api/src/statsQuery.js` (nuevo) — `buildStatsSummaryQuery` (hallazgos
   5, 6, 7). `api/__tests__/statsQuery.test.js`.
4. `api/src/statsCache.js` (nuevo) — `getCached`/`_resetCacheForTests`
   (hallazgos 1, 2). `api/__tests__/statsCache.test.js`.
5. `api/src/index.js` — el handler de `/api/stats/summary` delega en
   `statsQuery.js` + `statsCache.js`.
6. `EXPLAIN (ANALYZE, BUFFERS)` contra la BD real (query ya con
   `last_seen_at`/alias `j`) → confirmar/ajustar `idx_jobs_active_summary`
   → `schema.sql` (+ intento de aplicación real, mismo procedimiento que
   fases anteriores) → probar la reescritura de la subconsulta de
   `total_skills` si el `EXPLAIN` lo sugiere.
7. `src/components/ui/ChartCard.jsx` — `export` en `SLOW_LOADING_MS`.
8. `src/hooks/useSummaryStats.js` (nuevo) —
   `src/tests/hooks/useSummaryStats.test.js` (nuevo): dedup de peticiones
   simultáneas (mock de `getSummaryStats` llamado 1 vez con 2 montajes
   solapados), error, cleanup sin warning tras desmontar antes de
   resolver.
9. `src/components/layout/SummaryStats.jsx` — usa el hook nuevo; aviso de
   carga lenta; descripciones dinámicas de país (hallazgo 4); descripción
   de "Última actualización" (hallazgo 5).
10. `src/components/landing/LandingPage.jsx` — usa el hook nuevo (única
    modificación permitida, ver excepción en `014-spec.md`).
11. `src/tests/components/layout/SummaryStats.test.jsx` — adaptar al
    hook nuevo (mock a nivel de `jobServices` sigue funcionando igual,
    MSW no cambia); nuevos casos: descripciones dinámicas, aviso de carga
    lenta tras `SLOW_LOADING_MS`.
12. `src/mocks/handlers.js` — ajustar `last_updated` del mock si hace
    falta para que las fechas sigan siendo representativas.

## Ampliación de alcance — rediseño del bloque de stats de la landing

Más allá del fix de lógica ya diseñado arriba: rediseñar el contenido de
las 3 stats de la landing, quitar el badge superior, animar los
contadores, e investigar un loader percibido como roto. Ver
`014-spec.md`, "Excepción a la zona congelada", para el permiso
explícito ampliado.

### Backend — dos campos nuevos en `/api/stats/summary`

Se añaden a la misma query de `statsQuery.js` (mismo `FROM jobs j`, misma
caché de 10 min — no son peticiones ni queries aparte):
```sql
-- Card 2: salario mediano, ventana propia de 6 meses (no la reglobal de
-- pct_with_salary, que es sobre TODAS las activas sin ventana)
(SELECT ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY j2.salary_mid)::numeric)
 FROM jobs j2
 WHERE j2.is_active = TRUE
   AND j2.posted_at >= NOW() - INTERVAL '6 months'
   AND ${SALARY_QUALITY_CONDITIONS.map(c => c.replace('j.', 'j2.')).join(" AND ")}
) AS median_salary_6m,

-- Card 3: top 3 skills por nº de ofertas, ventana de 30 días — mismo
-- criterio que /api/skills/top (is_active + posted_at), json_agg con
-- LIMIT dentro de la subconsulta para quedarnos solo con el top 3.
(SELECT json_agg(t) FROM (
   SELECT s.name, COUNT(DISTINCT js.job_id)::int AS count
   FROM job_skills js
   JOIN jobs j3 ON j3.id = js.job_id
   JOIN skills s ON s.id = js.skill_id
   WHERE j3.is_active = TRUE
     AND j3.posted_at >= NOW() - INTERVAL '30 days'
   GROUP BY s.name
   ORDER BY count DESC LIMIT 3
 ) t
) AS top_skills_30d
```
**Corrección sobre el pedido original**: la ventana de la card de salario
pasa de "últimos 6 meses" a **"últimos 90 días"** — una oferta activa
nunca supera ~90-98 días de antigüedad (evidencia real de la fase 013:
`is_active` pasa a `FALSE` en origen sobre esa marca), así que "6 meses"
habría sido, en la práctica, exactamente lo mismo que no poner ninguna
ventana — mismo tipo de bug silencioso que la fase 013 corrigió para el
filtro de periodo, evitado aquí desde el origen en vez de introducirlo.
90 días además reusa el mismo número que ya usa el selector de periodo
del sidebar ("Últimos 90 días"), lenguaje ya familiar en la UI. Campo
renombrado a `median_salary_90d`.

Alias `j2`/`j3` distintos para no chocar con el `j` del `FROM` principal
ni entre subconsultas. `EXPLAIN ANALYZE` de estas dos subconsultas
durante la implementación (mismo criterio que el resto de esta feature)
— candidatas a necesitar su propio índice si salen caras, documentado en
`014-tasks.md`; con la caché de 10 min puesta, el coste solo se paga una
vez por ventana.

### Frontend — piezas nuevas y reutilizables

- **`src/lib/formatRelativeTime.js`** (nuevo): `formatRelativeTime(iso)`
  → `"hace 2 h"` / `"hace 3 d"` / `"hace un momento"`. Puro, testeable
  sin DOM.
- **`src/hooks/useCountUp.js`** (nuevo): `useCountUp(target, durationMs)`
  anima de 0 al valor final con `requestAnimationFrame` y easing
  ease-out — sin librería nueva. Devuelve el entero actual de la
  animación; los consumidores lo pasan por `formatNumber` igual que hoy.
- **`src/components/landing/LandingPage.jsx`** (dentro de la ampliación
  de excepción): badge superior eliminado; las 3 `statItems` pasan de
  `{icon, label, value}` a un formato por card con título + 1-3 métricas:
  - Card 1 — `RiEarthLine`, "Explora el mercado por país":
    `stats.total_countries` (animado) + `stats.total_active_jobs`
    (animado) + `formatRelativeTime(stats.last_updated)`.
  - Card 2 — `RiMoneyEuroCircleLine`, "Compara salarios en Europa":
    `stats.median_salary_6m` (animado, formateado en €) + "últimos 6
    meses".
  - Card 3 — `RiFireLine`, "Descubre dónde está la demanda":
    `stats.top_skills_30d` (lista de 3, nombre + puesto) + "últimos 30
    días".
  Estética: reutiliza el mismo lenguaje visual del badge que se elimina
  (pill de cristal — `border-white/20 bg-white/10 backdrop-blur-sm`) en
  vez de inventar un patrón nuevo.

### Loader de transición (`PageLoader`/`App.jsx`)

**Diagnóstico**: `isLoading` (controla si `PageLoader` está montado) se
apaga con un `setTimeout` fijo de 800ms en `handleEnter`
(`App.jsx`), sin ninguna relación con si `SummaryStats` ya tiene datos.
Además, la animación CSS del logo (`loaderPulse 2s ease-in-out **1**`)
solo corre una vez — si el loader llegara a estar montado más de 2s, el
logo se quedaría congelado a opacidad completa en vez de seguir
pulsando.

**Fix**:
1. `PageLoader.jsx`: `1` → `infinite` en la animación — si el loader
   está visible más tiempo, sigue pulsando en vez de congelarse.
2. `App.jsx`: `isLoading` se apaga cuando se cumplen **dos** condiciones
   — un mínimo de 500ms (evita un parpadeo demasiado rápido) **y**
   `!statsLoading` (datos reales ya listos) — con un techo duro de 4000ms
   por si acaso, para no depender 100% de que la petición siempre
   resuelva rápido:
   ```js
   const MIN_LOADER_MS = 500;
   const MAX_LOADER_MS = 4000;
   const { loading: statsLoading } = useSummaryStats();
   const [minElapsed, setMinElapsed] = useState(false);

   useEffect(() => {
     if (!isLoading) return;
     const minTimer = setTimeout(() => setMinElapsed(true), MIN_LOADER_MS);
     const maxTimer = setTimeout(() => setIsLoading(false), MAX_LOADER_MS);
     return () => { clearTimeout(minTimer); clearTimeout(maxTimer); };
   }, [isLoading]);

   useEffect(() => {
     if (isLoading && minElapsed && !statsLoading) setIsLoading(false);
   }, [isLoading, minElapsed, statsLoading]);
   ```
   `App.jsx` llama a `useSummaryStats()` — gracias a la deduplicación del
   hallazgo 2, esto NO añade una petición nueva: comparte la misma
   promesa en vuelo que ya disparó `LandingPage`. Con la caché del
   hallazgo 1 puesta, `statsLoading` debería resolver casi al instante en
   el caso normal (caché caliente) — el techo de 4000ms es una red de
   seguridad para el caso raro de caché fría, no el camino habitual.

## Segunda ampliación de alcance — loader de la landing y KPI cards del dashboard

### Loader: de "transición" a "gate de carga inicial"

El fix de la sección anterior (loader ligado a `statsLoading` durante la
transición landing→dashboard) no cubría el problema real: hacía falta
usar `PageLoader` para tapar la carga *inicial* de la propia landing
(Lightfall + los stats), no solo el salto hacia el dashboard.

**Diagnóstico de Lightfall** (`src/components/ui/Lightfall.jsx`): usa
`ogl` con un shader GLSL definido inline (strings `vertex`/`fragment` en
el propio archivo) — sin `fetch`, sin texturas externas, sin ninguna
carga asíncrona. Su `useEffect` de montaje es síncrono. Conclusión: lo
único que de verdad hay que esperar es `useSummaryStats()`.

**Fix** (`LandingPage.jsx`): early return antes del JSX que monta
Lightfall —
```jsx
const { stats, loading } = useSummaryStats();
const [forceReveal, setForceReveal] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setForceReveal(true), LANDING_LOADER_MAX_MS);
  return () => clearTimeout(timer);
}, []);

// ... hooks de useCountUp, siempre llamados, nunca condicionados ...

if (loading && !forceReveal) return <PageLoader />;
```
`LANDING_LOADER_MAX_MS = 8000`: red de seguridad si la petición nunca
resuelve (red caída) — sin esto, un fallo total de la API dejaría al
usuario sin poder ni pulsar "Comenzar". Con la caché del hallazgo 1
puesta, el caso normal resuelve en milisegundos — este techo es para el
caso raro, no el camino habitual.

`fmt()` (helper local de `LandingPage.jsx`) pasa a hacer `Math.round()`
explícito: antes asumía que `useCountUp` ya devolvía enteros; ver más
abajo por qué dejó de ser así.

La transición landing→dashboard (`App.jsx`, sección anterior) **no se
toca** — sigue siendo válida y útil: para cuando el usuario puede pulsar
"Comenzar", los stats ya están cargados (la landing no revela el CTA
antes de eso), así que esa segunda espera resuelve casi al instante en
la práctica, sin conflicto con este cambio.

### `useCountUp`: soporte de decimales

`pct_with_salary` (35.7) es ahora también una card animada. La
implementación original hacía `Math.round(target * eased)` en cada
frame, incluida la última — con un target decimal, el resultado final
quedaba redondeado a un entero (36 en vez de 35.7). Fix: el último frame
(`progress >= 1`) fija `value = target` exactamente, sin pasar por
redondeo; los frames intermedios siguen sin redondear tampoco (el
consumidor decide cómo formatear — entero para conteos, `toFixed(1)`
para el porcentaje). Esto obligó a auditar los 3 usos ya existentes en
`LandingPage.jsx` (países, ofertas, salario) para que redondeen
explícitamente al formatear, ya que antes confiaban en que el hook lo
hacía por ellos.

### KPI cards del dashboard

Sustituye "Ofertas activas"/"Países cubiertos" (esos números ya viven en
la card "Explora el mercado por país" de la landing) por:

- **"Empresas analizadas"** — `total_companies`, `COUNT(DISTINCT j.company)`.
  Verificado en vivo: 23.248 hoy. **Semántica revisada**: cuenta strings
  distintos, no empresas deduplicadas — hay variantes reales de la misma
  razón social ("Sii" con 1.681 ofertas y "Sii Sp. z o.o." con 3.381,
  casi con toda seguridad la misma empresa) — documentado como
  limitación conocida, mismo criterio que `total_skills` (fase 009, NLP
  sin deduplicar). Deduplicar razones sociales de verdad es un problema
  de fuzzy-matching fuera de alcance de una KPI card.
- **"Roles analizados"** — `total_role_categories`,
  `COUNT(DISTINCT j.role_category)`. Verificado en vivo: 16 (las 16
  categorías del `CHECK` de `schema.sql` tienen todas ≥1 oferta activa
  hoy, ninguna "dormida" como pasaba con `skills.category = 'soft'` en
  la fase 013). Incluye `'other'` a propósito — es una categoría real y
  seleccionable en `SalaryChart` (`RoleSelector` no la excluye, `allRoles`
  tampoco — solo se excluye del top-5 *por defecto*), así que quitarla
  del conteo subestimaría la granularidad real que esta card promete
  "previsualizar".

Ambos campos se añaden a la agregación principal de `statsQuery.js` (sin
subconsulta propia, mismo `FROM jobs j WHERE j.is_active = TRUE` que el
resto). Las 3 cards sin cambios ("Con salario declarado", "Última
actualización", "Skills rastreadas") se mantienen tal cual, a petición
explícita.

**Animación**: las 4 cards numéricas (no la fecha) usan `useCountUp`,
mismo hook que la landing, con `formatNumber`/`.toFixed(1)` según el
tipo de dato.

**Índice**: `idx_jobs_active_summary` no cubría `company`/`role_category`
—se intentó ampliar su `INCLUDE` (`DROP` + `CREATE CONCURRENTLY`, Postgres
no soporta `ALTER INDEX` para añadir columnas) pero el `DROP INDEX
CONCURRENTLY` no se pudo completar contra la BD real en 3 intentos
(`statement timeout`, con y sin el `CREATE` en el mismo script). El
índice se quedó en su versión anterior (5 de 7 columnas cubiertas) — no
es una regresión respecto a antes de esta ronda, solo una mejora que no
se pudo aplicar. Documentado en `schema.sql` con la definición objetivo
para reintentarlo más adelante. La caché de 10 minutos sigue siendo la
mitigación real para el camino normal.

## Verificación

1. `npx vitest run` (frontend y `api/`) — 100%, sin regresiones.
2. `npm run build` sin errores.
3. Contra la BD real (servidor real, no solo mocks):
   - Timing de `GET /api/stats/summary`: primera petición (caché fría)
     vs segunda dentro del TTL — debe verse una diferencia drástica
     (segundos → milisegundos).
   - `X-Dev-Cache` de `devCache.js` y la caché nueva son independientes
     (capas distintas) — confirmar que no interfieren entre sí durante
     la verificación manual.
   - `pct_with_salary` idéntico antes/después de centralizar la
     condición (mismo criterio, solo cambia dónde vive).
   - `last_updated` ahora refleja `last_seen_at`, verificado contra el
     valor real de la BD.
4. Verificación manual en navegador: recargar la landing y entrar rápido
   al dashboard — solo una petición real a `/api/stats/summary` en la
   pestaña de red (Network) durante ese flujo; "Ofertas activas"/"Países
   cubiertos" con descripciones consistentes entre sí.
5. `.env.local` nunca leído.
6. `LandingPage.jsx`: diff revisado a mano para confirmar que solo cambia
   el bloque de datos (imports + 2 líneas), cero cambio en el JSX
   renderizado.
