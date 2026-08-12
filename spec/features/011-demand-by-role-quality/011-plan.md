# 011 · Plan — Evolución mensual de ofertas por rol

Ver `011-spec.md` para el qué/por qué y los criterios de aceptación. Este
documento detalla el cómo.

## Hallazgos (por orden de severidad, confirmados por lectura del código)

1. **Bug de agregación real cuando "Todos" los países está activo (filtro
   por defecto)**: el backend agrupaba por `(month, country_code,
   role_category)` — cada combinación mes+rol se fragmentaba en una fila
   por país. El frontend (`pivotData` en `DemandByRoleChart.jsx`) nunca
   usa el desglose por país (la gráfica solo tiene un eje de mes y un área
   por rol), pero tampoco sabía que había varias filas por mes+rol:
   `byMonth[label][role_category] = Number(job_count)` **sobrescribía** en
   vez de sumar. Con el filtro de país en su valor neutro ("Todos", el
   estado por defecto que ve cualquier usuario nuevo), solo el último país
   que llegaba de Postgres "ganaba" el valor del mes — el resto
   desaparecía del cómputo sin error visible. Mismo tipo de bug que la
   fase 008 (`role_category` fragmentando la co-ocurrencia de skills): una
   columna de más en el `GROUP BY` que nadie consume aguas abajo. La
   corrección va en el origen: quitar `country_code` del
   `SELECT`/`GROUP BY` del backend (el filtro `country=` sigue
   funcionando igual, es una condición del `WHERE`, no depende de qué
   columnas se seleccionan) — así no hay nada que sumar mal en el frontend
   y de paso se reduce el volumen de filas transferidas (meses × roles en
   vez de meses × países × roles).

2. **Selección de roles por defecto rota** — mismo bug ya arreglado en
   `SalaryChart` (fase 010) y explícitamente diferido para esta gráfica en
   `010-spec.md` ("Fuera de alcance"): `allRoles = extractRoles(rows)`
   conserva el orden de llegada de la API (`ORDER BY month ASC`, sin
   relación con volumen), y `allRoles.slice(0, 5)` se presenta como "los 5
   roles más demandados" en la nota del gráfico, lo cual no era cierto.
   Fix: reusar `rankRolesByVolume` (ya existe en `roleLabels.js`,
   genérica).

3. **Antipatrón de dos queries** — mismo ya eliminado en `SalaryChart`
   (fase 010): `Promise.all` con la agregación por un lado y un
   `COUNT(DISTINCT j.id)` aparte con el mismo `WHERE`, dos escaneos de
   `jobs`. Se combina con `SUM(COUNT(*)) OVER()`.

4. **Sin índice dedicado** — no existía ningún índice que cubriera
   `(role_category, posted_at)` juntos. `idx_jobs_posted_at` es un btree
   plano sin `role_category`; `idx_jobs_role_category` es `(role_category,
   country_code)`, sin `posted_at`. Mismo síntoma estructural que motivó
   `idx_jobs_salary_by_role_country` en la fase 010.

5. **`v_demand_by_role_monthly` en `schema.sql`** — vista sin usar por
   ningún endpoint (grep confirmado) y desincronizada de la query real: le
   faltaba `j.is_active = TRUE`, que el endpoint real sí aplica vía
   `buildFilters`. Mismo patrón que `v_salary_by_role_country`, eliminada
   en la fase 010.

6. **Sin estado "sin datos"** — con `rows: []` no había ningún mensaje,
   solo una gráfica de áreas vacía.

7. **Sin `slowHint`** — mismo patrón estructural (dos queries + sin
   índice dedicado) que causaba timeouts de 16-22s en `SalaryChart` antes
   de la fase 010.

8. **El último mes puede mostrarse incompleto y sugerir una caída de
   demanda ficticia** (hallazgo de negocio nuevo): `generarMesesRango`
   siempre genera el rango terminando en el mes actual, y el mes actual, a
   mitad de mes, tiene menos ofertas acumuladas que un mes ya cerrado — no
   porque la demanda esté cayendo, sino porque la ingesta de datos es
   continua (`ingested_at`/`first_seen_at` en `schema.sql`). Sin ningún
   aviso, el usuario puede leer un "bajón" al final de cada línea como una
   tendencia real.

9. **Filtro de `jornada` sin traducir** — mismo gap ya documentado como
   diferido en la fase 010, confirmado de nuevo fuera de alcance aquí
   (`excludeFilters` ya oculta `jornada` en esta gráfica, así que el
   texto crudo nunca llega a mostrarse).

**Efecto colateral (limpieza, no un bug)**: una vez `DemandByRoleChart` deja
de usar `extractRoles`, esa función se queda sin ningún consumidor en
producción (confirmado por grep). Se elimina junto con su bloque de tests
— mismo criterio que llevó a borrar `v_salary_by_role_country` en la fase
010.

## Enfoque

Mismo patrón que la fase 010: un fix por hallazgo, todo en una sola
feature. El fix de fondo (hallazgo 1) vive en el backend — una vez ahí, el
frontend casi no necesita tocar `pivotData` (el bug desaparece en el
origen, no hace falta sumar defensivamente en el cliente). El resto son
cambios ya practicados en fases anteriores (reusar `rankRolesByVolume`,
mensaje "sin datos", `slowHint`) aplicados a este componente.

## Implementación

### 1. Backend — `api/src/demandQuery.js` (nuevo) + `api/src/index.js`

Mismo patrón que `salaryQuery.js`: lógica pura extraída y testeable sin BD
ni Express. Ya no selecciona ni agrupa por `country_code`:

```js
// demandQuery.js
// Lógica pura de GET /api/jobs/demand-by-role, separada de index.js —
// mismo patrón que buildFilters.js y salaryQuery.js.
//
// No selecciona ni agrupa por country_code: el frontend (DemandByRoleChart)
// nunca desglosa por país, siempre suma la demanda de un rol en un mes
// entre todos los países que pasan el filtro — igual que ocurría con
// role_category en /api/skills/cooccurrence (fase 008). Antes, agrupar por
// country_code fragmentaba cada (mes, rol) en hasta 8 filas (una por país)
// que el frontend tenía que volver a sumar; con "Todos" los países
// seleccionado (el filtro por defecto), pivotData se quedaba solo con la
// última fila que llegaba de Postgres en vez de sumarlas, infrarrepresentando
// la demanda real sin ningún error visible. Quitar country_code del
// SELECT/GROUP BY resuelve el bug en el origen — el filtro `country=` sigue
// funcionando igual (condición del WHERE, independiente de qué columnas se
// seleccionan).
//
// Combina el total en la misma query con SUM(COUNT(*)) OVER() — mismo
// patrón que /api/salary/by-role-country (fase 010) — en vez de una
// segunda query COUNT(DISTINCT j.id) aparte.

export function buildDemandByRoleQuery(conditions) {
  return {
    text: `SELECT
       DATE_TRUNC('month', j.posted_at) AS month,
       j.role_category,
       COUNT(*) AS job_count,
       SUM(COUNT(*)) OVER ()::int AS total_matching_jobs
     FROM jobs j
     WHERE ${conditions.join(" AND ")}
     GROUP BY DATE_TRUNC('month', j.posted_at), j.role_category
     ORDER BY month ASC, j.role_category ASC`,
  };
}

// shapeDemandRows — mismo patrón que shapeSalaryRows.
export function shapeDemandRows(rows) {
  const total_matching_jobs = rows[0]?.total_matching_jobs ?? 0;
  return {
    rows: rows.map(({ total_matching_jobs: _t, ...row }) => row),
    total_matching_jobs,
  };
}
```

`index.js` — el handler pasa de 2 queries en `Promise.all` a 1:
```js
import { buildDemandByRoleQuery, shapeDemandRows } from "./demandQuery.js";
...
app.get("/api/jobs/demand-by-role", async (req, res) => {
  try {
    const { jornada: _j, ...filtrosAplicables } = req.query;
    const { conditions, values } = buildFilters(filtrosAplicables);
    conditions.push("j.role_category IS NOT NULL");
    conditions.push("j.posted_at IS NOT NULL");
    const { text } = buildDemandByRoleQuery(conditions);
    const result = await pool.query(text, values);
    res.json(shapeDemandRows(result.rows));
  } catch (err) {
    errorHandler(res, err, "demand-by-role");
  }
});
```

`api/__tests__/demandQuery.test.js` (nuevo, mismo patrón que
`salaryQuery.test.js`): SQL generado usa `DATE_TRUNC`, `GROUP BY` solo
`(month, role_category)` — sin `country_code` —, `SUM(COUNT(*)) OVER()`,
`ORDER BY month ASC, role_category ASC`; `shapeDemandRows` extrae
`total_matching_jobs` de la primera fila y devuelve `{ rows: [],
total_matching_jobs: 0 }` con array vacío.

### 2. `api/schema.sql`

**Índice nuevo**, junto a `idx_jobs_role_category`/`idx_jobs_posted_at`
(ninguno de los dos se elimina — cada uno cubre un patrón de acceso
distinto):
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_demand_by_role
    ON jobs (role_category, posted_at)
    INCLUDE (country_code, contract_type, remote)
    WHERE is_active = TRUE
      AND role_category IS NOT NULL
      AND posted_at IS NOT NULL;

ANALYZE jobs;
```
`role_category` encabeza el índice (siempre filtrado con `IS NOT NULL` y
siempre parte del `GROUP BY`); `posted_at` es el segundo campo porque se
usa tanto para el filtro de rango (periodo) como para el `DATE_TRUNC` del
`GROUP BY`. `country_code` queda en `INCLUDE` (ya no forma parte del
`SELECT`/`GROUP BY` tras el fix de esta fase, pero sigue siendo un filtro
`WHERE` opcional) junto con `contract_type`/`remote`, los otros dos
filtros opcionales de `buildFilters.js`.

**`v_demand_by_role_monthly`**: se elimina — no la usa ningún endpoint
(grep confirmado) y le falta `is_active = TRUE`. Se actualiza el
comentario de cabecera de "VISTAS PARA EL DASHBOARD (9 vistas)" a 8
vistas, se quita su línea de la lista y se añade un párrafo explicativo
igual que el que ya documenta la eliminación de `v_salary_by_role_country`
en la fase 010.

`spec/features/011-demand-by-role-quality/011-apply-index.sql` (nuevo):
script standalone para el SQL editor de Supabase, mismo formato que
`010-apply-index.sql`, por si el entorno vuelve a bloquear la conexión
directa con credenciales embebidas.

### 3. `src/lib/roleLabels.js` — eliminar `extractRoles`

Sin consumidores tras el cambio. Se elimina la función y se generaliza el
comentario de cabecera de `rankRolesByVolume` (ya no es exclusiva de
`SalaryChart`). `src/tests/lib/roleLabels.test.js`: se elimina el
`describe("extractRoles", ...)` y su import.

### 4. `src/components/Charts/DemandByRoleChart.jsx`

```js
// antes: import { getRoleLabel, getRoleColor, extractRoles } from "@/lib/roleLabels";
import { getRoleLabel, getRoleColor, rankRolesByVolume } from "@/lib/roleLabels";
...
// antes: const allRoles = extractRoles(rows);
const allRoles = rankRolesByVolume(rows);
```

`nota` — dos frases, sin parte condicional (a diferencia de `SalaryChart`,
aquí no hace falta una cláusula de contrato: `describeFiltros` ya traduce
el pill de contrato desde la fase 010, y esta gráfica no tiene ningún
matiz de negocio específico de contrato que documentar):
```jsx
nota="Por defecto se muestran los 5 roles con más ofertas en total (sumando todos los meses y países). El último mes mostrado puede estar incompleto: las ofertas se siguen indexando de forma continua."
```

Mensaje "sin datos" — como tercera rama del condicional existente, entre
`periodoInsuficiente` (que sigue teniendo prioridad) y el contenido
normal:
```jsx
{periodoInsuficiente ? (
  <div className="...aviso periodo insuficiente...">...</div>
) : rows.length === 0 && !loading ? (
  <p className="text-sm text-muted-foreground">
    No hay datos para los filtros seleccionados. Prueba a ampliar el
    periodo o quitar algún filtro.
  </p>
) : (
  <>
    <RoleSelector .../>
    {/* ... resto igual ... */}
  </>
)}
```

`slowHint` en `ChartCard` (prop ya existe desde la fase 010, opt-in):
```jsx
<ChartCard
  title="Evolución mensual de ofertas por rol"
  warning={...}
  loading={loading}
  isInitialLoad={isInitialLoad}
  error={error}
  slowHint="Esta consulta puede tardar varios segundos, sobre todo con 'Todo el histórico' — gracias por tu paciencia."
>
```

`pivotData` — sin cambio funcional (el bug se resuelve en el origen); se
actualiza solo el comentario para dejar constancia del invariante del que
ahora depende:
```js
// Transforma [{ month, role_category, job_count }] en [{ month, backend: 150, ... }].
// Asume que el backend ya devuelve como mucho una fila por (month,
// role_category) — ver demandQuery.js: ya no se agrupa por country_code,
// así que no hay nada que sumar aquí; si el backend volviera a fragmentar
// por alguna dimensión adicional, esta asignación directa volvería a
// perder datos igual que antes de la fase 011.
```

### 5. `src/mocks/handlers.js`

El mock de `GET /api/jobs/demand-by-role` pierde `country_code` en cada
fila (ya no lo devuelve el backend real tras el fix), mismos valores de
`job_count`/`total_matching_jobs` que ya había.

### 6. `src/tests/components/Charts/DemandByRoleChart.test.jsx`

Se mantienen todos los tests existentes. Se añaden: selección de roles por
defecto (integración ligera, mismo patrón que `SalaryChart.test.jsx`),
estado "sin datos", y nota (menciona "en total" y "puede estar
incompleto").

## Decisiones (descartes explícitos, con razón)

- **No se suma defensivamente en `pivotData`** — el fix real vive en el
  backend (quitar `country_code` del `GROUP BY`); sumar también en el
  frontend sería tratar el síntoma dos veces sin necesidad, y no es el
  patrón que sigue `SalaryChart` (que también confía en que el backend no
  fragmenta lo que no debe).
- **No se oculta el mes en curso** — en vez de quitar el último punto de
  la línea (perder información real), se avisa con una nota.
- **`extractRoles` se elimina, no se deja como código muerto** — mismo
  criterio que la eliminación de `v_salary_by_role_country` en la fase
  010.
- **Filtro `jornada` sin traducir** — confirmado de nuevo fuera de
  alcance; sigue pendiente como deuda transversal ya documentada en la
  fase 010, no específica de esta gráfica.

## Riesgos

- **Índice no aplicable desde este entorno** — mismo bloqueo de conexión
  directa visto en fases 009/010; se entrega también como script
  standalone (`011-apply-index.sql`). La feature funciona igual con o sin
  el índice aplicado.
- **Cambio de forma de la respuesta** (ya no incluye `country_code`) —
  solo lo consumía el `GROUP BY` interno de Postgres y el mock de test;
  ningún componente frontend lo leía. Riesgo bajo.
- **Verificación en vivo bloqueada por el mismo motivo que esta feature
  soluciona** — mismo patrón ya documentado en la verificación de la fase
  010.

## Tests nuevos/actualizados

- `api/__tests__/demandQuery.test.js` (nuevo) — SQL generado (sin
  `country_code`, `SUM(COUNT(*)) OVER()`, `ORDER BY`), `shapeDemandRows`.
- `src/tests/lib/roleLabels.test.js` — se elimina el bloque de
  `extractRoles`; `rankRolesByVolume` no cambia.
- `src/tests/components/Charts/DemandByRoleChart.test.jsx` — 3 tests
  nuevos sobre los 8 ya existentes.
- `npx vitest run` (frontend + `api/`) y `npm run build` sin regresiones.

## Verificación

1. `npx vitest run` (frontend) y `npx vitest run` (`api/`) — 100%.
2. `npm run build` sin errores.
3. Contra el backend real: comparar `total_matching_jobs` y una muestra de
   filas de la query nueva (sin `country_code`); si es posible, medir
   tiempo de respuesta con/sin el índice aplicado. Documentar
   transparentemente si el sandbox no puede completarlo.
4. `api/schema.sql` sigue en `.gitignore`; `.env.local` nunca leído.
5. Confirmar que la landing no se ha tocado.
