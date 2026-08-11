# 010 · Calidad de datos y rendimiento — Salario — Plan

## Enfoque

Un fix por hallazgo, todos dentro de la misma feature. Frontend y backend
en paralelo ya que son independientes; los cambios de `useChartData`/
`jobServices.js` tocan las 4 gráficas que los usan (mecánico, una línea
cada una) porque el riesgo que corrigen (pool agotado sin cancelación) no
es exclusivo de `SalaryChart`.

**Hallazgo propio importante detectado durante el diseño**:
`countries.name` en la BD real está en **inglés** ("Germany", no
"Alemania" — confirmado en `api/schema.sql`, seed de la tabla
`countries`, y replicado en `src/mocks/handlers.js`). Usar ese campo tal
cual en el eje X regresionaría el idioma de la UI. La fuente de verdad
para nombres de país sigue siendo `NOMBRES_PAISES` (`filterUtils.js`, ya
usado en el resto de la UI); `country_name` del backend queda como
fallback defensivo, no como fuente primaria.

## Implementación

### 1. `src/lib/roleLabels.js` — selección de roles por volumen real

Nueva función, no toca `extractRoles` (la sigue usando
`DemandByRoleChart`, fuera de alcance):

```js
// rankRolesByVolume
// Devuelve los roles presentes en las filas, ordenados de mayor a menor
// según el total de ofertas agregado (sumando job_count entre todos los
// países) — no el orden de llegada de la API, que responde al ORDER BY
// del backend (país alfabético, salario descendente dentro de cada país)
// y no tiene relación con qué roles son más demandados. Ejemplo real
// (periodo=90d, Austria): con el orden de llegada, "qa_testing" entraba
// en el "top 5" con solo 3 ofertas mientras "backend" con 62 quedaba
// fuera.
export function rankRolesByVolume(rows) {
  const totals = new Map();
  for (const { role_category, job_count } of rows) {
    totals.set(
      role_category,
      (totals.get(role_category) ?? 0) + Number(job_count ?? 0),
    );
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([role]) => role);
}
```

En `SalaryChart.jsx`: `const allRoles = rankRolesByVolume(rows);`
sustituye a `extractRoles(rows)`. `effectiveSelected =
allRoles.slice(0, 5)` no cambia — solo cambia el criterio detrás del
array.

### 2. `src/lib/filterUtils.js` — traducción del filtro de contrato

```js
// CONTRATO_LABELS
// El backend usa los valores crudos del CHECK de Postgres ('permanent'/
// 'contract'), y el filtro del sidebar expone esos mismos valores en
// inglés (config/filters.js) porque coinciden 1:1 con la API. Mapeo a
// español para pills y notas — mismo patrón que NOMBRES_PAISES.
export const CONTRATO_LABELS = {
  Permanent: "permanente",
  Contract: "temporal",
};
```

En `describeFiltros` (afecta a TODAS las gráficas, no solo SalaryChart —
mismo bug de raíz, arreglarlo a medias sería peor):
```js
// antes: partes.push(`contrato ${filters.contrato.toLowerCase()}`);
partes.push(
  `contrato ${CONTRATO_LABELS[filters.contrato] ?? filters.contrato.toLowerCase()}`,
);
```
Verificado sin riesgo: `filterUtils.test.js` no tiene assert sobre el
texto exacto del pill de contrato hoy.

### 3. `src/lib/errorMessages.js` (nuevo)

```js
// errorMessages.js
// Traduce mensajes de error crudos del backend (texto de PostgreSQL en
// inglés) a mensajes en español comprensibles. Centralizado porque
// ChartCard es el único punto de render de error de todas las gráficas.
// Patrones confirmados con errores reales de esta sesión: "canceling
// statement due to statement timeout" (statement_timeout) y "unable to
// check out connection from the pool after 15000ms" (pool agotado).
// Devuelve null si no reconoce el mensaje — ChartCard usa null como
// señal de "sin traducción, muestra el mensaje crudo".
const TIMEOUT_PATTERNS = [/statement timeout/i, /canceling statement/i];
const POOL_PATTERNS = [/pool/i];

export function describeError(rawMessage) {
  if (!rawMessage) return null;
  if (TIMEOUT_PATTERNS.some((re) => re.test(rawMessage))) {
    return "Esta consulta está tardando demasiado y el servidor la ha cancelado. Prueba a acotar los filtros (por ejemplo, un periodo más corto) o inténtalo de nuevo en unos segundos.";
  }
  if (POOL_PATTERNS.some((re) => re.test(rawMessage))) {
    return "El servidor está recibiendo muchas peticiones a la vez. Espera unos segundos y vuelve a intentarlo.";
  }
  return null;
}
```

### 4. `src/components/ui/ChartCard.jsx` — error traducido + aviso de carga lenta

```jsx
{!loading && error && (
  <p className="text-sm text-destructive">
    {describeError(error) ?? `Error: ${error}`}
  </p>
)}
```
Verificado contra `ChartCard.test.jsx` — mensajes no reconocidos (ej.
"Error 500 en /api/skills/top") siguen mostrando `Error: ...`
exactamente igual.

Prop opcional `slowHint` (string), opt-in — sin ella, cero cambio de
comportamiento para las otras gráficas. Timer de 6s, solo durante la
carga **inicial** (no en recargas con datos previos visibles):
```jsx
const SLOW_LOADING_MS = 6000;
const showSpinner = loading && isInitialLoad;
const [showSlowHint, setShowSlowHint] = useState(false);
useEffect(() => {
  if (!showSpinner || !slowHint) { setShowSlowHint(false); return; }
  const timer = setTimeout(() => setShowSlowHint(true), SLOW_LOADING_MS);
  return () => clearTimeout(timer);
}, [showSpinner, slowHint]);
// dentro del bloque showSpinner:
{showSlowHint && (
  <p className="mt-2 text-xs text-muted-foreground/70">{slowHint}</p>
)}
```
`SalaryChart` pasa `slowHint="Esta consulta puede tardar 15-20 segundos incluso sin problemas — gracias por tu paciencia."`.

### 5. `src/components/ui/ChartDescription.jsx` — testid en pills

Añadir `data-testid="chart-filter-pills"` al `<div>` contenedor de las
pills de filtros activos — necesario para no romper un test existente
(ver Riesgos) y útil para cualquier chart futuro con el mismo riesgo.

### 6. `src/hooks/useChartData.js` — `AbortController`

```js
export function useChartData(fetchFn, deps, initialData = []) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const staleDataRef = useRef(initialData);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(staleDataRef.current);

    fetchFn(controller.signal)
      .then((result) => {
        staleDataRef.current = result;
        setData(result);
        setIsInitialLoad(false);
      })
      .catch((err) => {
        // fetch rechaza con DOMException name="AbortError" al cancelar —
        // no es un error real, el próximo efecto ya dispara la petición
        // nueva.
        if (err.name === "AbortError") return;
        setError(err.message ?? "Error desconocido");
      })
      .finally(() => {
        // Si ESTA petición fue la cancelada, no toques loading — la
        // petición nueva ya puso loading=true y su propio finally se
        // encarga de bajarlo cuando termine.
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, isInitialLoad, error };
}
```
Mantiene el patrón stale-while-revalidate existente (comentario de
cabecera actual sigue siendo válido, no tocar). Verificado contra
`useChartData.test.js`: ningún test inspecciona los argumentos de
`fetchFn`.

### 7. `src/services/jobServices.js` — `signal` en `fetchJson` y las 4 funciones usadas vía `useChartData`

```js
async function fetchJson(path, { signal } = {}) {
  const response = await fetch(`${API_URL}${path}`, { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? `Error ${response.status} en ${path}`);
  }
  return response.json();
}

export async function getTopSkills(filters = {}, signal) { /* fetchJson(..., { signal }) */ }
export async function getDemandByRole(filters = {}, signal) { /* ídem */ }
export async function getSalaryByRoleAndCountry(filters = {}, signal) { /* ídem */ }
export async function getOffersByCountry(filters = {}, skill = null, signal) { /* ídem */ }
```
`getSkillsList`, `getSummaryStats`, `getSkillCoOccurrence` (no pasan por
`useChartData`) no se tocan.

**Call sites (mecánico, una línea cada uno):**
- `SalaryChart.jsx`: `(signal) => getSalaryByRoleAndCountry(filters, signal)`
- `DemandByRoleChart.jsx`: `(signal) => getDemandByRole(filters, signal)`
- `TopSkillsChart.jsx`: `(signal) => getTopSkills(filters, signal)`
- `EuropeMap.jsx`: `(signal) => getOffersByCountry(filters, selectedSkill, signal)`

### 8. `src/components/Charts/SalaryChart.jsx` — el componente

`pivotData` (named export, para testear aislado):
```js
export function pivotData(rows) {
  const byCountry = {};
  for (const row of rows) {
    const code = row.country_code.toUpperCase();
    const country = NOMBRES_PAISES[code] ?? row.country_name ?? code;
    if (!byCountry[country]) byCountry[country] = { country };
    byCountry[country][row.role_category] = Number(row.median_salary_eur);
    byCountry[country][`${row.role_category}__meta`] = {
      job_count: Number(row.job_count),
      avg_salary_eur: Number(row.avg_salary_eur),
    };
  }
  return Object.values(byCountry);
}
```

`TooltipSalario` (named export): añade número de ofertas + media en una
línea muted bajo la mediana, y un aviso `⚠ muestra pequeña` cuando
`job_count < 5` — reutilizando la paleta ámbar que `DemandByRoleChart` ya
usa para su aviso de "Periodo insuficiente" (`text-amber-600
dark:text-amber-400`, no un color nuevo).

**Umbral `MUESTRA_PEQUEÑA_THRESHOLD = 5`**: con `n ≤ 4` la mediana la
determina, como mucho, 1-2 valores centrales — un solo dato puede
cambiarla por completo. Mismo orden de magnitud que
`SMALL_SET_THRESHOLD = 4` ya usado en `heatmapUtils.js` (fase 008) para
el mismo razonamiento. 13.2% de las celdas reales caen bajo este umbral.

Señal visual — opacidad reducida vía `<Cell>` por combinación país×rol
(permite variar el fill dentro de un mismo `<Bar>`):
```jsx
<Bar key={role} dataKey={role} fill={getRoleColor(role)} radius={[4, 4, 0, 0]}>
  {data.map((entry) => (
    <Cell
      key={`${role}-${entry.country}`}
      fillOpacity={
        (entry[`${role}__meta`]?.job_count ?? Infinity) < MUESTRA_PEQUEÑA_THRESHOLD
          ? 0.45
          : 1
      }
    />
  ))}
</Bar>
```

`nota` combinada (criterio de selección + contrato traducido):
```jsx
nota={[
  "Por defecto se muestran los 5 roles con más ofertas (sumando todos los países).",
  filters.contrato !== "Todos"
    ? `Mostrando solo contratos "${CONTRATO_LABELS[filters.contrato] ?? filters.contrato.toLowerCase()}". Los salarios varían entre contrato permanente y temporal.`
    : null,
].filter(Boolean).join(" ")}
```

Mensaje "sin datos" — antes del bloque de `RoleSelector`, mismo patrón
que `TopSkillsChart.jsx`:
```jsx
{rows.length === 0 && !loading ? (
  <p className="text-sm text-muted-foreground">
    No hay datos para los filtros seleccionados. Prueba a ampliar el
    periodo o quitar algún filtro.
  </p>
) : ( /* RoleSelector + gráfico, como ahora */ )}
```

`slowHint` pasado a `ChartCard` (ver punto 4). Import de
`CONTRATO_LABELS`, `NOMBRES_PAISES` desde `@/lib/filterUtils`, `Cell`
desde `recharts`.

### 9. Backend — `api/src/salaryQuery.js` (nuevo) + `api/src/index.js`

Lógica pura extraída, mismo patrón que `buildFilters.js` ("testear sin
BD ni Express"). Combina las dos queries actuales (`Promise.all` con
agregación + `COUNT(DISTINCT j.id)` separado) en una sola con
`SUM(COUNT(*)) OVER ()` — mismo patrón que `/api/skills/top`:

```js
// salaryQuery.js
export function buildSalaryByRoleCountryQuery(conditions) {
  return {
    text: `SELECT
       j.country_code,
       c.name AS country_name,
       j.role_category,
       COUNT(*) AS job_count,
       ROUND(AVG(j.salary_mid)) AS avg_salary_eur,
       ROUND(
         PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY j.salary_mid)::numeric
       ) AS median_salary_eur,
       SUM(COUNT(*)) OVER ()::int AS total_matching_jobs
     FROM jobs j
     JOIN countries c ON c.code = j.country_code
     WHERE ${conditions.join(" AND ")}
     GROUP BY j.country_code, c.name, j.role_category
     ORDER BY j.country_code, median_salary_eur DESC NULLS LAST`,
  };
}

export function shapeSalaryRows(rows) {
  const total_matching_jobs = rows[0]?.total_matching_jobs ?? 0;
  return {
    rows: rows.map(({ total_matching_jobs: _t, ...row }) => row),
    total_matching_jobs,
  };
}
```

`index.js`:
```js
import { buildSalaryByRoleCountryQuery, shapeSalaryRows } from "./salaryQuery.js";
...
app.get("/api/salary/by-role-country", async (req, res) => {
  try {
    const { conditions, values } = buildFilters(req.query);
    conditions.push("j.role_category IS NOT NULL");
    conditions.push("j.salary_mid IS NOT NULL");
    conditions.push("j.salary_is_predicted = FALSE");
    conditions.push("j.salary_mid >= 1000");
    const { text } = buildSalaryByRoleCountryQuery(conditions);
    const result = await pool.query(text, values);
    res.json(shapeSalaryRows(result.rows));
  } catch (err) {
    errorHandler(res, err, "salary-by-role-country");
  }
});
```

### 10. `api/schema.sql`

**Índice nuevo** (junto a `idx_jobs_salary_mid`, que NO se elimina — sin
visibilidad de si algún proceso externo lo usa):
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_by_role_country
    ON jobs (country_code, role_category, salary_mid)
    INCLUDE (posted_at, contract_type, contract_time, remote)
    WHERE is_active = TRUE
      AND salary_is_predicted = FALSE
      AND salary_mid >= 1000
      AND role_category IS NOT NULL;

ANALYZE jobs;
```
**Restricción del entorno**: El índice se entrega como texto en
`schema.sql` **y** como script standalone `010-apply-index.sql` para el
SQL editor de Supabase — la feature funciona igual con o sin el índice
aplicado (es una optimización, no una dependencia). Se puede reintentar
la conexión directa; si se bloquea otra vez, queda pendiente de
aplicación manual.

**`v_salary_by_role_country`**: se elimina (no se marca deprecated) — no
la usa ningún endpoint (grep confirmado, ninguna vista de `schema.sql`
se usa), y ya estaba desincronizada en silencio de
`v_salary_stats_by_country`. La query real vive ahora en
`salaryQuery.js`.

**`CHECK` de `role_category`**: documentación únicamente, no se ejecuta
contra producción (la BD real ya acepta estos 16 valores):
```sql
CHECK (role_category IS NULL OR role_category IN (
    'backend', 'frontend', 'fullstack',
    'data_engineering', 'data_science', 'data_analyst',
    'devops', 'cloud', 'sysadmin',
    'ai_ml', 'security', 'mobile', 'qa_testing', 'erp_sap',
    'management', 'other'
))
```

### 11. `AGENTS.md`

```markdown
## Zonas congeladas — no tocar

- `src/components/landing/` — la landing está congelada. Ninguna modificación.
- Ningún archivo `.env*` (incluye `.env.local`) — **nunca leer ni
  imprimir su contenido**, ni siquiera para depurar. Es la única
  excepción permanente de este proyecto. Solo lectura de
  `.env.example`, que no contiene valores reales.

> `api/` dejó de estar congelado a partir de la feature 010: el usuario
> dio acceso completo para leer y editar el backend (`api/src/`,
> `api/schema.sql`, tests). Sigue aplicando el resto de reglas del
> flujo de trabajo (spec → plan → tasks, una feature activa a la vez).
```

### 12. ⚠️ `api/src/devCache.js` — caché temporal de desarrollo (RECORDAR QUITAR)

Añadida a petición del usuario tras la verificación en vivo de esta
feature, cuando la BD real estuvo fallando/tardando 15-120s+ de forma
consistente y se volvió difícil seguir trabajando. No es parte de la
auditoría de `SalaryChart` — es infraestructura de desarrollo.

Caché en **disco**, no en memoria — `node --watch` reinicia el proceso
en cada guardado durante el propio desarrollo, lo que borraría una caché
en memoria constantemente justo cuando más se necesita:

```js
// devCache.js
import fs from "fs";
import path from "path";
import crypto from "crypto";

const CACHE_DIR = path.join(process.cwd(), ".dev-cache");
const TTL_MS = 5 * 60 * 1000; // 5 minutos

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function keyToFile(key) {
  const hash = crypto.createHash("md5").update(key).digest("hex");
  return path.join(CACHE_DIR, `${hash}.json`);
}

export function devCacheMiddleware(req, res, next) {
  if (req.method !== "GET") return next();
  const file = keyToFile(req.originalUrl);

  if (fs.existsSync(file)) {
    try {
      const { time, body } = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Date.now() - time < TTL_MS) {
        res.setHeader("X-Dev-Cache", "HIT");
        return res.json(body);
      }
    } catch {
      // archivo corrupto o a medio escribir — se trata como miss
    }
  }

  res.setHeader("X-Dev-Cache", "MISS");
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200) {
      fs.writeFileSync(file, JSON.stringify({ time: Date.now(), body }));
    }
    return originalJson(body);
  };
  next();
}
```

`index.js` (una línea, después de `express.json()` y antes de las
rutas):
```js
import { devCacheMiddleware } from "./devCache.js";
// ⚠️ TEMPORAL — quitar esta línea (y devCache.js) cuando ya no haga falta.
app.use(devCacheMiddleware);
```

`.gitignore`: `api/.dev-cache/`.

**Verificado con datos reales**: `/api/skills/list` pasó de 40.3s (MISS)
a 14.8ms (HIT) en la segunda petición idéntica, y sigue en `HIT` incluso
después de reiniciar el servidor (`touch src/index.js` para forzar el
reinicio de `node --watch`, comprobado que el PID cambió y la caché
seguía sirviendo).

**Cómo quitarlo cuando ya no haga falta:**
1. Borrar `api/src/devCache.js`.
2. Quitar el import y la línea `app.use(devCacheMiddleware)` de
   `api/src/index.js`.
3. Quitar la entrada `api/.dev-cache/` de `.gitignore`.
4. Borrar la carpeta `api/.dev-cache/` si existe localmente (no se sube
   a git, pero conviene limpiarla).

## Decisiones (descartes explícitos, con razón)

- **Paginación/límite de barras** — no se implementa. El fix del punto 1
  ya quita el problema real (el default deja de ser arbitrario);
  ver-todos sigue siendo decisión informada del usuario vía
  `RoleSelector`.
- **Rediseño de `ROLE_COLORS`** — pertenece al design system Halo (fase
  007), no a esta feature de calidad de datos.
- **Eliminar `idx_jobs_salary_mid`** — sin visibilidad de si algo
  externo lo usa; solo se añade el nuevo, no se retira el existente.
- **`country_name` como fallback, no fuente primaria** — ver hallazgo
  propio arriba (está en inglés en la BD real).

## Riesgos

- **Test existente roto por el fix de idioma**: `SalaryChart.test.jsx` →
  "muestra datos globales..." hace `queryByText(/alemania|españa|.../i)`
  sobre todo el documento; con el fix, "Alemania"/"España" pasan a
  aparecer legítimamente como etiquetas del eje X. Fix: `data-testid`
  en pills (punto 5) + reescribir ese test con
  `within(screen.getByTestId("chart-filter-pills"))`.
- **Índice no aplicable desde este entorno** — ver punto 10, plan
  funcional sin él.
- **Coste de `<Cell>` por datapoint** — 8 países × hasta 16 roles = 128
  celdas máximo, negligible para Recharts.

## Verificación

1. `npx vitest run` (frontend) y `npx vitest run` (`api/`) — 100%.
2. `npm run build` sin errores.
3. Contra el backend real: confirmar `total_matching_jobs` de la query
   combinada coincide con el valor de la versión de dos queries (antes
   de dar por buena la migración). Si se logra aplicar el índice:
   comparar tiempo de respuesta antes/después.
4. `api/schema.sql` sigue en `.gitignore`; `.env.local` nunca leído.
5. Confirmar que la landing no se ha tocado.
