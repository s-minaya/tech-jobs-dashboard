# 013 · Plan — Auditoría Top Skills más demandadas

Ver `013-spec.md` para el qué/por qué y los criterios de aceptación. Este
documento detalla el cómo, con la evidencia real que sustenta cada
hallazgo.

## Metodología

Dos auditorías de solo lectura en paralelo:
- **Frontend**: `TopSkillsChart.jsx` completo, `getTopSkills`
  (`jobServices.js`), su test, el mock de `/api/skills/top`, la config de
  filtros y todo el historial de decisiones ya tomadas en `spec/` sobre
  esta gráfica/endpoint (fases 007/009/010/011/012).
- **Backend/BD**: el handler completo de `GET /api/skills/top`,
  `buildFilters.js`, `schema.sql` (tablas, índices, vistas), y
  verificación en vivo contra la BD real (servidor ya corriendo en
  localhost:3000, caché de desarrollo en `MISS` para tiempos reales).

Después verifiqué yo mismo, por lectura directa, los hallazgos que me
parecían menos sólidos antes de cerrar el plan inicial: el texto del
aviso de `jornada` (resultó estar bien, no hace falta tocarlo) y si las
vistas de skills están realmente sin usar (confirmado por grep sobre
`index.js`, y de paso encontré que **ninguna** de las 8 vistas del bloque
"VISTAS PARA EL DASHBOARD" se usa, no solo las 2 de skills — documentado
como fuera de alcance en `013-spec.md`).

Tras un primer borrador de este plan, el usuario solicitó una segunda pasada
centrada en semántica (no solo filtros/rendimiento) que encontró el hallazgo 
1 de abajo — el más importante de esta ronda.

## 1. "Todo el histórico" no es todo el histórico — bug de coherencia semántica

**Evidencia**: `api/src/index.js`, en `GET /api/skills/top` (líneas
194-196) y de forma idéntica en `GET /api/skills/cooccurrence` (líneas
275-277):
```js
if (!filtrosAplicables.periodo || filtrosAplicables.periodo === "all") {
  conditionsJobs.push("j.posted_at >= NOW() - INTERVAL '90 days'");
}
```
`buildFilters.js` ya maneja `periodo` correctamente: `30d`/`90d`/`180d` se
mapean a un `INTERVAL`, y `"all"` (o cualquier valor no reconocido) no
añade ninguna condición de fecha — ese es el comportamiento correcto y
esperado de "Todo el histórico". Pero el propio handler, después de
llamar a `buildFilters`, **vuelve a añadir** el cap de 90 días cuando
`periodo === "all"`, deshaciendo esa decisión sin que ningún comentario lo
explique. Confirmado en vivo: `periodo=90d`, `periodo=all` y sin `periodo`
devuelven los tres `total_matching_jobs: 68032` en `/api/skills/top` —
para el usuario, elegir "Todo el histórico" en el sidebar no cambia nada.

Confirmado por grep que `salary/by-role-country` y `demand-by-role` **no**
tienen esta lógica — para esos dos, "Todo el histórico" sí es literal
(hay incluso una nota antigua, `spec/sugerencia-optimizacion-query-salario.md`,
que documenta `periodo=all` tardando 5.3s en el endpoint de salario, prueba
de que ahí sí ejecuta sin cap). La inconsistencia es solo entre
`skills/top`+`skills/cooccurrence` (que comparten este patrón duplicado)
y el resto.

**Fix**: quitar la condición extra sobre `"all"` en los dos endpoints —
solo debe activarse el fallback de 90 días si `periodo` está
**totalmente ausente** de la query (protección razonable para callers que
no lo envíen, como podría pasar si algún caller nuevo se olvida del
parámetro), nunca cuando el usuario pide explícitamente "todo":
```js
if (!filtrosAplicables.periodo) {
  conditionsJobs.push("j.posted_at >= NOW() - INTERVAL '90 days'");
}
```
**Riesgo a verificar durante la implementación**: quitar el cap de
`skills/top` hace que `periodo=all` deje de estar artificialmente
acotado — con el índice nuevo (hallazgo 2) debería seguir siendo rápido,
pero hay que medirlo en vivo, igual que con `skills/cooccurrence` (que no
está en el alcance de rediseño de índices de esta feature — si
`periodo=all` resulta demasiado lento ahí, se documenta como hallazgo
para una ronda futura en vez de rediseñar esa query aquí).

## 2. Rendimiento — índice nuevo para `/api/skills/top`

**Evidencia** (servidor real, `X-Dev-Cache: MISS`):

| Query | Tiempo |
|---|---|
| Sin filtros (periodo 90d) | 28.5s |
| `country=de` | 34.7s |
| `country=de&contrato=permanent` | 10.6s |
| `country=de&remote=true` | 2.4s |

Que `country=de` no acelere la query (28.5s → 34.7s) descarta que el
filtro de país sea el problema — apunta a que el `JOIN job_skills ⋈ jobs`
en sí no está bien cubierto por los índices existentes
(`idx_job_skills_skill`, `idx_job_skills_job` son de una sola columna;
`idx_jobs_active`/`idx_jobs_posted_at` no están combinados en un índice
compuesto que Postgres pueda aprovechar para este patrón concreto).

**Enfoque**: antes de diseñar el índice a ciegas (como no fue posible en
fases 009/010/011 por el bloqueo de conexión directa del sandbox), esta
vez el servidor real ya está conectado y respondiendo — durante la
implementación, ejecutar `EXPLAIN (ANALYZE, BUFFERS)` de la query real
usando el mismo módulo de conexión que ya usa `index.js` (sin imprimir
credenciales), para confirmar si Postgres está haciendo seq scan sobre
`job_skills` o sobre `jobs`, y diseñar el índice exacto a partir de esa
evidencia en vez de una suposición. Documentar el resultado del `EXPLAIN`
en `013-tasks.md`. Si el patrón se confirma igual que en fases 010/011
(falta de índice compuesto), aplicar el mismo procedimiento: añadir el
índice a `schema.sql`, e intentar aplicarlo contra la BD real; si el
sandbox vuelve a bloquear la conexión directa, dejarlo documentado como
script standalone para aplicación manual (mismo patrón que
`011-apply-index.sql`).

También: añadir `slowHint` al `ChartCard` de `TopSkillsChart` (prop que ya
existe y usa `SalaryChart` desde la fase 010) — es la gráfica más lenta
del dashboard y hoy es la única de las 4 con `useChartData` que no lo usa.

**Resultado real (ver `013-tasks.md` para el `EXPLAIN` completo)**:
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_posted_at
    ON jobs (posted_at DESC)
    INCLUDE (id)
    WHERE is_active = TRUE;
```
Aplicado también contra la BD real (esta vez sí fue posible conectar
directamente, a diferencia de fases 009/010/011). Sin filtros: 28.5s →
7.4s. `country=de`: 34.7s → 4.5s. El objetivo de &lt;2s sin filtros no se
alcanzó — confirmado con `EXPLAIN ANALYZE` que es un límite estructural
(el filtro `is_active + 90 días` solo excluye ~7% de la tabla), no falta
de índice; documentado como fuera de alcance (tabla resumen materializada
sería el siguiente paso, cambio de arquitectura mayor).

Al investigar por qué la query del **total** (`countQuery`) seguía lenta
incluso con este índice, se descubrió un hallazgo más importante que el
propio rendimiento — ver el punto 9 más abajo.

## 3. `pct_of_all_jobs` — eliminar, no arreglar

**Evidencia**: con `country=de&category=language`, las 22 filas devueltas
suman exactamente 100.00% de `pct_of_all_jobs`, pero `total_matching_jobs`
sigue siendo 14113 (el total de DE sin restringir a `language`) — el campo
se llama "% de todas las ofertas" pero es "% dentro de la categoría
filtrada". Confirmado por grep que ningún componente de producción lee
`pct_of_all_jobs` (solo aparece en el mock de test).

**Fix**: quitar el `ROUND(... SUM(COUNT(*)) OVER () ...)` de la query (ya
no hace falta la ventana) y el campo de la respuesta. Mismo criterio que
`extractRoles` (fase 011) o el prop `loading` de `HeatmapSvg` (fase 012):
no mantener código/datos sin consumidores. Ajustar el mock de
`src/mocks/handlers.js` y el test que lo referencie si lo hace.

## 4. `jornada` — mecanismo testeable en vez de destructure inline

**Hoy** (`api/src/index.js`):
```js
const { jornada: _j, ...filtrosAplicables } = req.query;
```
Mismo patrón (sin comentario, sin test que lo proteja) que causó el leak
real de `contrato`/`remote` en `/api/skills/cooccurrence`, arreglado en la
fase 012 con `stripKeys`/`COOCCURRENCE_IGNORED_FILTERS`
(`buildFilters.js`). Verificado en vivo que `jornada` hoy no tiene efecto
(`total_matching_jobs` idéntico con y sin `jornada=full_time`) — la
decisión de excluirlo (fase 012) es correcta, solo falta blindarla.

**Fix**: nueva constante `TOP_SKILLS_IGNORED_FILTERS = ["jornada"]` junto
a `COOCCURRENCE_IGNORED_FILTERS` en `buildFilters.js`, reusando
`stripKeys`:
```js
const filtrosAplicables = stripKeys(req.query, TOP_SKILLS_IGNORED_FILTERS);
```
**Resultado real**: `src/services/jobServices.js` se deja sin tocar —
`getTopSkills` ya usa el mismo destructure inline que las otras 4
funciones del archivo (`getDemandByRole`, `getSalaryByRoleAndCountry`,
`getOffersByCountry`, `getSkillCoOccurrence`); introducir `stripKeys`
solo ahí habría creado una inconsistencia nueva en vez de arreglar una
existente, y la protección real (con test) ya vive en el backend.

## 5. Vistas SQL muertas

`v_top_skills_by_country` y `v_top_skills_global` (`schema.sql`) sin
ningún endpoint que las use (confirmado por grep sobre `index.js`).
Eliminar y documentar en el bloque de comentario "vistas eliminadas" ya
existente (`schema.sql:299-325`), mismo formato que
`v_salary_by_role_country`/`v_demand_by_role_monthly`.

## 6. Extraer `api/src/skillsQuery.js`

Mismo patrón que `salaryQuery.js`/`demandQuery.js`: función pura que
construye la query SQL (ya sin `pct_of_all_jobs`, ya usando
`TOP_SKILLS_IGNORED_FILTERS`, ya con el fix del punto 1) + función que da
forma a las filas, ambas testeables sin levantar Express ni BD. El handler
de `index.js` pasa a delegar en este módulo. Añadir
`api/__tests__/skillsQuery.test.js` cubriendo: `LIMIT` 20 vs 50 según
`category`, que `category` no se cuela en la query del total, que
`periodo=all` no añade condición de fecha (a diferencia de `periodo`
ausente), indexación correcta de `$N` con distintas combinaciones de
filtros.

## 7. Techo de altura en `TopSkillsChart`

`alturaPx = Math.max(200, rows.length * 32)` sin límite superior — hasta
1600px con `category` activo (50 filas). **Resultado real**: techo
`ALTURA_MAXIMA = 700` (cubre las 20 filas del caso por defecto sin
scroll) con `overflow: "hidden auto"` en el contenedor exterior cuando se
supera — la altura interna del contenido se mantiene sin recortar (para
que Recharts reparta las barras con su espaciado normal), el recorte lo
hace el `maxHeight` del wrapper.

## 8. Traducción de `skillCategoria`

Mismo patrón que `NOMBRES_PAISES`/`CONTRATO_LABELS`
(`src/lib/filterUtils.js`) — mapa nuevo `SKILL_CATEGORIA_LABELS` que
traduce solo la etiqueta visible; el valor enviado a la API se queda
igual (minúsculas en inglés, coincide con `skills.category`):

```js
export const SKILL_CATEGORIA_LABELS = {
  Language: "Lenguaje",
  Framework: "Framework",
  Cloud: "Cloud",
  Database: "Base de datos",
  Tool: "Herramienta",
  Methodology: "Metodología",
};
```
`Framework`/`Cloud` se dejan igual — préstamos ya asentados en español
técnico (como "backend"/"frontend" en el resto de la app); el resto se
traduce. Afecta a `describeFiltros` (pill) y a la interpolación de
`TopSkillsChart.jsx`.

**Resultado real**: `FilterSection.jsx` (chips del sidebar) se deja sin
tocar. No traduce ninguna opción hoy — país muestra el código crudo +
bandera, contrato/jornada muestran "Permanent"/"Full time" en inglés tal
cual — un patrón consistente y nunca señalado como bug en 12 rondas de
auditoría previas. Traducir solo `skillCategoria` ahí habría introducido
una inconsistencia nueva en vez de arreglar una existente.

## 9. Descubierto durante la implementación — `total_matching_jobs` solo contaba ofertas con skills

Investigando por qué `countQuery` seguía lenta con el índice del punto 2
ya puesto, se descubrió que contaba `COUNT(DISTINCT j.id)` sobre un
`JOIN` a `job_skills` — solo ofertas con al menos una skill extraída.
Verificado en vivo: de ~227.000 ofertas activas/recientes, solo ~68.000
(30%) tienen alguna skill en `job_skills`; el 70% restante queda excluido
del total hoy, repartido por toda la ventana de 90 días (no es backlog de
ingesta reciente — confirmado con una distribución por antigüedad). El
badge "X ofertas" de esta gráfica usa el mismo componente
(`ChartDescription`) que `SalaryChart`/`DemandByRoleChart`/`EuropeMap`,
que sí cuentan todas las ofertas activas sin exigir relación con skills
— el usuario vería un número radicalmente distinto en esta gráfica para
el mismo estado de filtros, sin ninguna explicación.

**Fix**: `countQuery` (en `skillsQuery.js`) cuenta directamente sobre
`jobs`, sin `JOIN` a `job_skills` — iguala la semántica con el resto del
dashboard y de paso es ~15x más rápido en caliente (29s → 1.8s), porque
ya no toca `job_skills` en absoluto para este cálculo. Ver el detalle
completo (números, distribución por antigüedad) en `013-tasks.md`.

## Evaluado, no es un bug

- **Texto del aviso de `jornada`** (`NOTAS_FILTROS_IGNORADOS.jornada`,
  `ChartDescription.jsx`): genérico, encaja correctamente con esta
  gráfica ("los datos no cambian significativamente... jornada completa o
  parcial"). No se toca.
- **`GROUP BY s.name, s.category`**: no fragmenta — `skills.name` es
  `UNIQUE`, un nombre solo puede tener una categoría. No hay el bug de
  fases 008/011.
- **Consulta desperdiciada tipo "Últimos 30 días"** (fase 011): no aplica
  — `TopSkillsChart` siempre se muestra, no hay periodo que oculte el
  gráfico.
- **`contrato`/`remote`**: confirmados con efecto real en vivo
  (2777/2200 ofertas vs 14113 baseline). Correctos.
- **`skillCategoria` como único filtro "propio" de este endpoint**:
  reconfirmado, consistente con fases 011/012.
- **Categoría `soft`**: existe en el `CHECK` de BD pero sin ninguna skill
  con ofertas reales asociadas hoy (`category=soft` → `rows: []`) — no
  contamina el "Todas" por defecto ahora mismo. No se añade como opción de
  filtro (estaría vacía); queda documentado como latente en `013-spec.md`.

## Implementación (orden previsto)

1. `api/src/index.js` — quitar `|| filtrosAplicables.periodo === "all"` en
   `/api/skills/top` **y** en `/api/skills/cooccurrence` (hallazgo 1).
2. `api/src/buildFilters.js` — `TOP_SKILLS_IGNORED_FILTERS`.
3. `api/src/skillsQuery.js` (nuevo) — query sin `pct_of_all_jobs`, usando
   `stripKeys` y ya con el fix del punto 1; `api/__tests__/skillsQuery.test.js`.
4. `api/src/index.js` — el handler de `/api/skills/top` delega en
   `skillsQuery.js`.
5. `EXPLAIN (ANALYZE, BUFFERS)` contra la BD real → diseño del índice →
   `schema.sql` (+ intento de aplicación real, documentado igual que en
   fases 009/010/011 si el sandbox bloquea la conexión directa). Medir
   también `periodo=all` tras el fix del punto 1, con y sin el índice.
6. `schema.sql` — eliminar `v_top_skills_by_country`/`v_top_skills_global`,
   documentar en el bloque de vistas eliminadas.
7. `src/services/jobServices.js` — ajustar `getTopSkills` si aplica tras
   el cambio de `jornada` en el backend.
8. `src/lib/filterUtils.js` — `SKILL_CATEGORIA_LABELS`.
9. `src/components/Charts/TopSkillsChart.jsx` — `slowHint`, techo de
   altura + scroll, usar la traducción de categoría en la descripción.
10. `src/tests/components/Charts/TopSkillsChart.test.jsx` — cubrir los
    huecos listados en `013-spec.md`.
11. `src/mocks/handlers.js` — ajustar si `pct_of_all_jobs` desaparece de
    la forma de la respuesta.
12. `api/__tests__/` — test nuevo/actualizado confirmando que
    `/api/skills/cooccurrence?periodo=all` no añade condición de fecha
    (contrato del punto 1, en el mismo archivo/estilo que
    `buildFilters.test.js`).

## Verificación

1. `npx vitest run` (frontend y `api/`) — 100%, sin regresiones.
2. `npm run build` sin errores.
3. Contra la BD real:
   - `periodo=all` da un `total_matching_jobs` **distinto** (mayor) que
     `periodo=90d` en `/api/skills/top` y en `/api/skills/cooccurrence`.
   - Tiempos de `/api/skills/top` antes/después del índice (objetivo: de
     28-35s a &lt;2s, o el orden de magnitud que confirme el `EXPLAIN`),
     incluyendo el caso `periodo=all` ya sin cap.
   - `pct_of_all_jobs` ya no aparece en la respuesta.
   - `jornada` sigue sin efecto tras pasar a `stripKeys`.
4. Verificación manual en navegador: categorías traducidas en sidebar/
   pill/descripción; altura con scroll cuando `category` está activo y
   hay muchas filas; badge "Actualizando..." (`slowHint`) visible en la
   carga inicial; seleccionar "Todo el histórico" cambia visiblemente el
   resultado.
5. `.env.local` nunca leído; landing sin modificar.
