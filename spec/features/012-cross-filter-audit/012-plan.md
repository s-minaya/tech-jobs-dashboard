# 012 · Plan — Auditoría cruzada de filtros

Ver `012-spec.md` para el qué/por qué y los criterios de aceptación. Este
documento detalla el cómo, y deja constancia de toda la discusión de
diseño (útil para no volver a auditar esto desde cero en el futuro).

## Metodología

Dos auditorías de solo lectura en paralelo:
- **Backend**: los 7 endpoints de `api/src/index.js` (`skills/top`,
  `skills/cooccurrence`, `salary/by-role-country`, `jobs/demand-by-role`,
  `jobs/offers-by-country`, `skills/list`, `stats/summary`) +
  `buildFilters.js` completo — comprobando (a) qué filtros aplica cada
  uno, (b) si combinar varios produce fugas de parámetros SQL (`$N` mal
  numerados) o fan-out por `JOIN`, (c) si hay filtros disponibles
  (columna ya en el `FROM`/`JOIN`) que no se aplican.
- **Frontend**: los 5 componentes de gráfica — comprobando que lo que
  `jobServices.js` envía al backend coincide exactamente con lo que la UI
  (`getWarningNodes`/`excludeFilters`) promete que se ignora.

Después, revisión filtro por filtro y gráfica por gráfica contrastando el
diseño original del sistema de filtros (nunca escrito antes en el repo)
contra lo implementado hoy.

## Decisiones de diseño confirmadas (sin cambio de código)

### `TopSkillsChart` — jornada se queda EXCLUIDA

Coincide con el diseño original y con el código actual. Se descarta la
recomendación inicial de esta misma feature de habilitarla — era un
error de razonamiento: "no hay barrera
técnica" (`contract_time` es una columna de `jobs`, ya disponible en la
query) no es lo mismo que "aporta una pregunta de negocio útil". Jornada
no cambia qué tecnologías pide un puesto — un backend pide Python/AWS sea
full-time o part-time. Contrato sí tiene una historia plausible (proyectos
temporales → skills de consultoría/especialización puntual); remoto
también (roles remotos → más cloud/herramientas de colaboración). Jornada
no tiene ese mecanismo.

### `DemandByRoleChart` — jornada se queda HABILITADA

Ya implementado y verificado en la fase 011 con datos reales
(`periodo=90d&country=de`): 38.175 `full_time` / 2.741 `part_time` /
63.675 sin filtro — confirma que el filtro afecta realmente a los datos.
Decisión reconsiderada y confirmada: no se revierte.

**Idea relacionada, diferida** (surgida en esta discusión, no se
planifica aquí): un "chart de tendencias" estilo Halo para explorar
desgloses como jornada sin recargar el área chart principal — encajaría
con la idea ya aparcada de restructurar el dashboard con header/rutas por
sección.

### `SkillHeatmap` — país, contrato, jornada y remote se quedan EXCLUIDOS

Fragmentar la muestra por cualquiera de los cuatro dejaría pocas
co-ocurrencias para que los porcentajes sean estadísticamente fiables —
mismo razonamiento para los cuatro (ya documentado en el código antes de
esta feature para país/contrato/remote; confirmado que también aplica a
jornada, que compartía un texto genérico con `TopSkillsChart` sin haberse
verificado individualmente hasta ahora).

### `SkillHeatmap` — filtro de categoría de skill YA FUNCIONA, sin cambios

**Corrección sobre el análisis inicial de esta misma feature**: se dijo
primero que este filtro "no estaba implementado" porque el análisis solo
miró el SQL de `/api/skills/cooccurrence` (que en efecto no filtra por
categoría — no tiene ningún `WHERE s1.category = ...`). Pero el filtrado
real ya existe, construido antes de esta sesión, y ocurre enteramente en
el cliente:

1. `getSkillCoOccurrence(filters)` (`jobServices.js`) trae **todos** los
   pares de co-ocurrencia (hasta 1000, sin filtrar por categoría) —
   `useHeatmapData.js`, primer `useEffect`, solo depende de `periodo`.
2. Al activar una categoría, el segundo `useEffect` de `useHeatmapData.js`
   llama a `getTopSkills({ skillCategoria: categoria, periodo })`, que sí
   filtra en el backend (`s.category = $N`) — trae solo las skills de esa
   categoría.
3. `selectSkills(skillsData, categoria, maxN)` y
   `filterSkillsWithCoOccurrence(skillsCandidatas, pairs)`
   (`heatmapUtils.js`) restringen qué skills se usan como filas/columnas
   de la matriz a las de esa categoría (con conectividad k-core real
   dentro de ese subconjunto — fase 008).
4. `buildLookup(pairs, skills)` solo construye entradas del diccionario
   para pares donde **ambas** `skill`/`co_skill` están en el array final
   `skills` — es decir, ambas deben pertenecer a la categoría activa.

El resultado neto ya es "pares donde ambas skills son de la categoría
seleccionada", exactamente la semántica que se prefería por legibilidad
(matriz simétrica, sin mezclar categorías en los ejes). No hace falta
tocar `api/src/index.js`, `jobServices.js`, `useHeatmapData.js` ni
`heatmapUtils.js` — solo se añade un test que deje esta garantía
documentada y protegida de una futura regresión accidental (ver Tests).

### `EuropeMap` — país se resalta, no filtra

Comportamiento único de esta gráfica (mapa coroplético: todos los países
se muestran siempre, el seleccionado se resalta con borde blanco) — no
confundir con la exclusión total de país en `SkillHeatmap` (gráficas
distintas: una es un mapa geográfico con resaltado, la otra es una matriz
skill×skill donde país no tiene ningún efecto ni visual).

## Hallazgos a corregir

### 1. Bug real — `/api/skills/cooccurrence` no descarta `contrato`/`remote`

`api/src/index.js` (handler de `GET /api/skills/cooccurrence`):
```js
const { country: _c, jornada: _j, ...restQuery } = req.query;
const { conditions, values } = buildFilters(restQuery);
```
Solo descarta `country` y `jornada`. `contrato` y `remote` quedan en
`restQuery` y `buildFilters` los aplicaría igualmente si llegaran en la
query string — contradice el comentario del propio endpoint ("País,
contrato, jornada y remote no aplican — datos globales") y el texto que
`NOTAS_FILTROS_IGNORADOS`/`FILTROS_IGNORADOS` le prometen al usuario.

Dormido en producción porque `getSkillCoOccurrence` (frontend) ya
descarta los 5 filtros antes de llamar, y `SkillHeatmap.jsx` solo reenvía
`{ periodo }` — pero el contrato de la API en sí está roto para cualquier
otro caller.

**Fix**:
```js
const { country: _c, jornada: _j, contrato: _ct, remote: _r, ...restQuery } = req.query;
```

### 2. Inconsistencia de UI — `EuropeMap.jsx`

```js
warning={getWarningNodes(filters, ["pais"], "mapa")}          // antes
excludeFilters={["pais", "skillCategoria"]}
```
`warning` solo declaraba `pais`; `excludeFilters` declaraba `pais` y
`skillCategoria`. Con `skillCategoria` activo, la pill se ocultaba pero no
aparecía ningún ⓘ. Fix:
```js
warning={getWarningNodes(filters, ["pais", "skillCategoria"], "mapa")}
```

## Evaluado, no es un bug — resto de la auditoría

- **`buildFilters.js`**: probado con 3 combinaciones de filtros distintas
  (incluida "los 5 activos a la vez") — la numeración `$N` se calcula
  siempre con `values.length` justo después de cada `push`, nunca se
  colisiona ni se deja un hueco, sea cual sea el subconjunto de filtros
  presente. Corroborado por `buildFilters.test.js` (ya existente).
- **Fuga por `JOIN` (fan-out)**: ninguna encontrada en los 7 endpoints —
  `job_skills` tiene PK compuesta `(job_id, skill_id)` y `skills.name` es
  `UNIQUE`, así que ningún `JOIN` a skills puede duplicar filas de un
  mismo job para el mismo criterio.
- **`SalaryChart`/`DemandByRoleChart`/`skills/top`/`offers-by-country`**:
  limpios, aplican exactamente los filtros de su diseño (confirmado
  filtro por filtro en la discusión).
- **`skills/list`/`stats/summary`**: sin filtros por diseño (catálogo
  global / KPIs globales) — correcto, no es un hallazgo.
- **`pct_of_all_jobs`** (`/api/skills/top`): cuando `category` está
  activo, pasa a significar "% dentro de la categoría" sin cambiar de
  nombre — pero no se usa en ningún sitio del frontend (confirmado por
  grep, solo aparece en el mock de test). Dato muerto, no se toca.

## Implementación

1. `api/src/index.js` — añadir `contrato: _ct, remote: _r` al destructure
   de `/api/skills/cooccurrence`.
2. `src/components/Charts/EuropeMap.jsx` — añadir `"skillCategoria"` al
   array de `getWarningNodes` en el prop `warning`.

## Tests

- `api/__tests__/` (nuevo caso, en el archivo que corresponda según cómo
  esté organizada la suite de `api/`): condiciones generadas para
  `/api/skills/cooccurrence` con `contrato`/`remote` en la query — tras el
  fix, no deben aparecer `j.contract_type`/`j.remote` en las condiciones.
- `src/tests/lib/heatmapUtils.test.js` (nuevo): con `pairs` que incluya
  pares cruzados entre categorías distintas y una categoría activa,
  `buildLookup` tras `selectSkills`+`filterSkillsWithCoOccurrence` no debe
  contener ningún par donde una de las dos skills no pertenezca a esa
  categoría.
- `src/tests/components/Charts/EuropeMap.test.jsx`: confirmar que el ⓘ
  aparece cuando `skillCategoria` está activo.

## Verificación

1. `npx vitest run` (frontend) y `npx vitest run` (`api/`) — 100%.
2. `npm run build` sin errores.
3. Contra el backend real: `GET /api/skills/cooccurrence?periodo=90d&contrato=permanent`
   vs sin `contrato` — antes del fix deberían diferir (demuestra la fuga),
   después del fix deberían ser idénticos.
4. `.env.local` nunca leído; landing sin modificar.
