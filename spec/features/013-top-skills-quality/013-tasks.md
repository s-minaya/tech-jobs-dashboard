# 013 · Auditoría Top Skills más demandadas — Tareas

## Preparación

- [x] Plan aprobado antes de empezar la implementación.
- [x] `.env.local` no se lee en ningún paso (solo se usa internamente por
      `dotenv.config()`/el pool de `pg` para conectar, nunca se imprime ni
      se lee su contenido con las herramientas de este agente).

## Backend

- [x] `api/src/buildFilters.js`: nueva `TOP_SKILLS_IGNORED_FILTERS = ["jornada"]`.
- [x] `api/src/buildFilters.js`: nueva `applyDefaultPeriodoFallback(conditions, query)`
      — centraliza el fallback de 90 días que antes reimplementaban por
      separado `/api/skills/top` y `/api/skills/cooccurrence`, cada uno con
      el bug de saltar también con `periodo === "all"`. Usada por los dos
      endpoints ahora, así no pueden volver a desincronizarse.
- [x] `api/src/skillsQuery.js` (nuevo): `buildTopSkillsQueries`/
      `shapeTopSkillsResult` — query de filas sin `pct_of_all_jobs`, usando
      `stripKeys`/`TOP_SKILLS_IGNORED_FILTERS`/`applyDefaultPeriodoFallback`.
- [x] `api/__tests__/skillsQuery.test.js` (nuevo, 12 tests): `LIMIT` 20/50
      según `category`, `category` no se cuela en la query del total,
      `periodo=all` no añade condición de fecha (a diferencia de `periodo`
      ausente), indexación de `$N` con filtros combinados.
- [x] `api/__tests__/buildFilters.test.js`: nuevos tests de
      `TOP_SKILLS_IGNORED_FILTERS` (contrato de `/api/skills/top`) y de
      `applyDefaultPeriodoFallback` (4 tests, incluido el caso que
      reproduce el bug de la fase 013 ya corregido).
- [x] `api/src/index.js`: el handler de `/api/skills/top` delega en
      `skillsQuery.js`; `/api/skills/cooccurrence` usa
      `applyDefaultPeriodoFallback` en vez de su `if` propio.
- [x] `EXPLAIN (ANALYZE, BUFFERS)` de la query real, vía un script
      temporal con el mismo pool/config de `index.js` (sin imprimir
      `DATABASE_URL` en ningún momento, borrado tras usarlo) — ver
      "Resultado del EXPLAIN" abajo.
- [x] `schema.sql`: índice nuevo `idx_jobs_active_posted_at` según el
      `EXPLAIN` — **aplicado también contra la BD real** (a diferencia de
      fases 009/010/011, esta vez sí fue posible conectar directamente).
- [x] `schema.sql`: `v_top_skills_by_country` y `v_top_skills_global`
      eliminadas — documentado en el bloque de "vistas eliminadas"
      existente. **Aplicado también contra la BD real** (`DROP VIEW`).

### Resultado del EXPLAIN — diseño del índice

Sin índice, la query de filas (sin filtros) hacía un *nested loop* de
~242.000 filas de `job_skills` contra `jobs` por su PK, aplicando el
filtro `is_active + posted_at` **después** de cada lookup individual
(`Index Scan using pk_jobs ... Filter: (is_active AND posted_at >= ...)`)
— cientos de miles de lookups de una fila cada uno, con muchas fallas de
caché de disco. `country=de` tampoco ayudaba (34.7s, peor que sin
filtros) porque el cuello de botella era el mismo patrón, no el volumen
de filas.

Índice diseñado a partir de esa evidencia:
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_posted_at
    ON jobs (posted_at DESC)
    INCLUDE (id)
    WHERE is_active = TRUE;
```
`INCLUDE (id)` permite intentar un Index Only Scan para el `id` que
necesita el `JOIN` a `job_skills` sin ir al heap — aunque con la ingesta
continua del pipeline, muchas páginas recientes aún no están marcadas
`all-visible`, así que en la práctica sigue habiendo bastantes heap
fetches (confirmado: ~59% de las filas en la prueba con `EXPLAIN
ANALYZE`). Con el índice, la query de filas pasó de un plan de *nested
loop* a un `Parallel Index Only Scan` + `Hash Join`.

**Objetivo de &lt;2s no alcanzado en el caso sin filtros** (quedó en 7-11s
en las pruebas con `EXPLAIN`, 7.4s en la verificación final vía HTTP) —
motivo confirmado con evidencia, no una suposición: el filtro
`is_active + 90 días` apenas es selectivo (~93% de la tabla `jobs`
cumple esa condición), así que cualquier acceso a través de un índice
sigue teniendo que tocar una fracción grande de la tabla. Una solución
más fuerte (tabla resumen materializada, refrescada periódicamente)
podría bajar esto a sub-segundo, pero es un cambio de arquitectura mayor
— se documenta como candidato a una ronda futura si el rendimiento sigue
siendo un problema real, no se construye aquí. Con `country=de` (más
selectivo) el índice sí deja la query en 2-4.5s, bastante más cerca del
objetivo.

### Hallazgo adicional descubierto durante la implementación: `total_matching_jobs` solo contaba ofertas con skills extraídas

Al investigar por qué la query del total (`countQuery`) seguía lenta
incluso con el índice nuevo, se descubrió algo más grave que el propio
problema de rendimiento: `total_matching_jobs` se calculaba con
`COUNT(DISTINCT j.id)` sobre un `JOIN` a `job_skills` — es decir, solo
contaba ofertas que tienen **al menos una skill extraída**. Verificado en
vivo contra la BD real:

- Ofertas activas y recientes (90 días) **con** al menos una skill: 67.985–68.062
- Ofertas activas y recientes (90 días) **totales** (sin exigir skills): 226.983–227.160
- Confirmado que no es un problema de "backlog reciente" del pipeline de
  NLP: la distribución de ofertas sin skills por antigüedad
  (0-7d: 13.146, 7-30d: 45.879, 30-90d: 99.973) está repartida por toda
  la ventana activa, no concentrada en los días más recientes.

Es decir: **~70% de las ofertas activas no tienen ninguna skill
extraída**, y hasta ahora `total_matching_jobs` en esta gráfica las
excluía silenciosamente del total. El badge "X ofertas" de
`TopSkillsChart` se renderiza con el mismo componente
(`ChartDescription`) que todas las demás gráficas, que sí cuentan
**todas** las ofertas activas que coinciden con los filtros
(`SalaryChart`, `DemandByRoleChart`, `EuropeMap`) — con el `JOIN`, el
usuario habría visto un número radicalmente distinto (≈68k vs ≈227k) en
esta gráfica respecto a las demás para el mismo estado de filtros, sin
ninguna explicación.

**Fix**: `countQuery` ya no hace `JOIN` a `job_skills` — cuenta
directamente sobre `jobs` con los mismos filtros que el resto del
dashboard. Corrige la coherencia semántica **y** es ~15x más rápido en
caliente (29s → 1.8s), porque Postgres ya no necesita tocar `job_skills`
en absoluto para este cálculo.

- [x] `api/src/skillsQuery.js`: `countQuery` cuenta sobre `jobs`
      directamente, sin `JOIN` a `job_skills`.
- [x] `api/__tests__/skillsQuery.test.js`: cubre implícitamente el nuevo
      `FROM jobs j` de `countQuery` (los tests de indexación de `$N` y de
      `category` no colándose en el total siguen pasando con la nueva
      forma de la query).

### Nota de seguridad (falsa alarma, verificada)

Al ejecutar el script de diagnóstico de `EXPLAIN`, la consola mostró una
línea que no es un mensaje normal de `dotenv`:
`◇ injected env (2) from .env.local // tip: ⌁ auth for agents [www.vestauth.com]`.
Investigado antes de continuar (sin visitar la URL ni leer `.env.local`):
confirmado por lectura directa de `node_modules/dotenv/lib/main.js` que
es un array `TIPS` hardcodeado en el propio paquete `dotenv` v17.4.2
(versión real de npm, hash de integridad coincide con el lockfile) que
imprime aleatoriamente uno de 8 mensajes de auto-promoción en cada
`.config()` — no ejecuta red ni código, no es una inyección dirigida a
este proceso. No requiere ninguna acción.

## Frontend

- [x] `src/lib/filterUtils.js`: nuevo `SKILL_CATEGORIA_LABELS` (mismo
      patrón que `NOMBRES_PAISES`/`CONTRATO_LABELS`); usado en
      `describeFiltros` para la pill de categoría activa.
- [x] `src/components/Charts/TopSkillsChart.jsx`: `slowHint` en
      `ChartCard`; techo de altura (`ALTURA_MAXIMA = 700`) con scroll
      interno (`overflow: "hidden auto"`) cuando hay muchas filas;
      descripción usa `SKILL_CATEGORIA_LABELS` en vez del valor crudo.
- [x] `src/services/jobServices.js`: evaluado — `getTopSkills` ya sigue el
      mismo patrón de destructure inline que las otras 4 funciones del
      archivo; introducir `stripKeys` solo ahí habría roto la consistencia
      del archivo en vez de mejorarla. Sin cambios.
- [x] `src/mocks/handlers.js`: mock de `/api/skills/top` sin
      `pct_of_all_jobs` (coincide con la forma real de la respuesta).
- [x] `api/schema.sql`/comentarios de `salaryQuery.js`: referencias
      cruzadas a `pct_of_all_jobs` actualizadas para no citar un campo que
      ya no existe.

**Ajuste sobre el plan**: `FilterSection.jsx` (chips del sidebar) se deja
sin traducir. No traduce ninguna opción hoy (país muestra el código
crudo + bandera, contrato/jornada muestran "Permanent"/"Full time" en
inglés tal cual) — patrón consistente y nunca señalado como bug en 12
rondas de auditoría previas. Traducir solo `skillCategoria` ahí habría
introducido una inconsistencia nueva en vez de arreglar una existente.
La traducción sí se aplica donde ya se aplicaba el patrón
`NOMBRES_PAISES`/`CONTRATO_LABELS`: pill de filtro activo y descripción
del chart.

## Tests

- [x] `src/tests/components/Charts/TopSkillsChart.test.jsx`: nuevos casos
      — `skillCategoria` activo (pill traducida, texto de descripción,
      forma de la petición saliente sin `jornada` y con `category` en
      minúsculas), aviso ⓘ de `jornada` activo, altura a escala realista
      (30 filas → techo + scroll; pocas filas → sin límite).
- [x] `src/tests/lib/filterUtils.test.js`: nuevos tests de
      `SKILL_CATEGORIA_LABELS` y de que la traducción se aplica en
      `describeFiltros`.
- [x] `npx vitest run` (frontend) — **364/364**.
- [x] `npx vitest run` (`api/`) — **57/57**.
- [x] `npm run build` sin errores.

## Verificación contra el backend real

- [x] Servidor de desarrollo ya en marcha; caché de desarrollo limpiada
      (`.dev-cache/`, recreada tras el borrado — el middleware solo crea
      el directorio al arrancar el proceso, no en cada petición) para
      forzar respuestas frescas.
- [x] `GET /api/skills/top?periodo=90d` vs `?periodo=all` —
      **226.982 vs 227.160** (antes de esta fase, idénticos) — confirma
      el fix del hallazgo 1.
- [x] `GET /api/skills/cooccurrence?periodo=90d` vs `?periodo=all` —
      **226.982 vs 227.160** — mismo fix, confirmado también aquí.
- [x] `pct_of_all_jobs` confirmado ausente de la respuesta.
- [x] `GET /api/skills/top` sin filtros: **7.4s** (antes 28.5-77s).
- [x] `GET /api/skills/top?country=de`: **4.5s** (antes 13.4-34.7s).
- [x] `GET /api/skills/top?country=de&jornada=full_time` vs sin
      `jornada`: **71.749 en ambos** — jornada confirmado sin efecto.
- [x] `/api/skills/cooccurrence` sigue lento (30-33s) — esperado y fuera
      de alcance: no se le construyó un índice propio en esta feature,
      solo se corrigió el bug de `periodo=all`.

## Hallazgos post-implementación

Verificando esta feature en el navegador (checklist manual), surgieron
tres frentes más. Investigados a fondo con agentes de exploración antes
de tocar nada (incluida una comprobación en vivo contra la BD real para
el filtro de periodo).

### 1. Traducción completa del sidebar de filtros

Se traduce también el sidebar completo (país, contrato, jornada,
"Remote", categoría de skill) — hasta ahora solo se traducían las pills/
descripciones (decisión explícita de esta misma fase, ver más arriba).

- [x] `src/lib/filterUtils.js`: nuevo `JORNADA_LABELS` (no existía —
      jornada era el único de los 4 filtros sin ningún mapa, ni siquiera
      en las pills; `describeFiltros` hacía solo un `.toLowerCase()` del
      valor crudo, así que un filtro de jornada activo mostraba
      literalmente "full time" en la pill — bug corregido de paso).
- [x] `src/lib/filterUtils.js`: nuevo `OPTION_LABELS` — une los 4 mapas
      (`NOMBRES_PAISES`, `CONTRATO_LABELS`, `JORNADA_LABELS`,
      `SKILL_CATEGORIA_LABELS`), sin colisiones de claves. Pensado para
      `FilterSection.jsx`, que no sabe de qué filtro se trata (solo
      recibe `options` genéricas) — mismo truco que ya usaba
      `OPTION_ICONS` en el mismo archivo (objeto plano indexado por el
      valor crudo de la opción).
- [x] `src/components/Filters/FilterSection.jsx`: el texto mostrado de
      cada chip/toggle pasa de `{option}` a `{OPTION_LABELS[option] ??
      option}`. `key`, `onClick(option)`, `selected === option` y
      `OPTION_ICONS[option]` siguen usando el valor crudo — cero riesgo
      para el estado, `buildParams`, el backend o `localStorage`.
- [x] `src/config/filters.js`: `title: "Remote"` → `"Remoto"`.
- [x] **Ajuste encontrado a medio implementar**: `CONTRATO_LABELS`
      guardaba los valores en minúscula (`"permanente"`/`"temporal"`),
      pensado solo para la pill ("contrato permanente"). Reutilizarlo tal
      cual en los chips del sidebar habría dejado "permanente" en
      minúscula junto a chips capitalizados ("Alemania", "Jornada
      completa"). Corregido: el mapa ahora guarda la forma capitalizada
      ("Permanente"/"Temporal", igual que los otros 3 mapas) y el
      `.toLowerCase()` se aplica en el punto de uso — dos sitios:
      `describeFiltros` (`filterUtils.js`) y la nota de contrato de
      `SalaryChart.jsx` (`notaContrato`, que también importaba
      `CONTRATO_LABELS` directamente).
- [x] `src/components/Charts/SkillHeatmap.jsx`: bug colateral encontrado
      por el mismo motivo — "Mostrando N skills de la categoría X" usaba
      el valor crudo en minúsculas (p.ej. `"database"`) en vez de
      `SKILL_CATEGORIA_LABELS` (`"base de datos"`), inconsistente con la
      pill de `ChartDescription`, que sí traduce. `categoria` (usado en
      toda la lógica de datos: `useHeatmapData`, `selectSkills`,
      comparaciones `=== "todas"`) no se toca — se añade `categoriaLabel`
      solo para el texto mostrado.
- [x] Decisión confirmada: Framework/Cloud se quedan sin traducir (en el
      sidebar y en todas partes) — mismo criterio que el diseño original
      de esta fase.
- [x] Tests actualizados: `FilterSection.test.jsx` (chips ahora esperan
      "Alemania"/"España"/"Francia" en vez de "DE"/"ES"/"FR"; nuevo test
      del fallback `?? option` con "Framework"), `FilterDrawer.test.jsx`
      ("Remote"→"Remoto", chip de país por texto traducido),
      `SkillHeatmap.test.jsx` (categoría activa ahora se busca como
      "lenguaje", no "language"), `filterUtils.test.js` (nuevo describe
      de `JORNADA_LABELS`, `OPTION_LABELS`, "filtro de jornada" completo,
      `CONTRATO_LABELS` capitalizado).

### 2. Filtro de periodo — investigado, sin cambios

Se documenta aquí la siguiente cuestión para no perderla si
se retoma en el futuro: si el histórico debería
incluir ofertas ya cerradas, cambio de semántica mayor, fuera de
alcance.

### 3. Copy del tooltip/leyenda del heatmap de co-ocurrencia

La `description` fija de `SkillHeatmap` ya estaba en lenguaje llano (no
usa "co-ocurrencia"). El problema real estaba en el tooltip
(`HeatmapSvg.jsx`) y la leyenda (`HeatmapLegend.jsx`), que sí usaban
"co-ocurrencia(s)" y "dataset" sin explicarlos — rompiendo el mismo
patrón que `SalaryChart` sí resuelve bien (usa "mediana" en el título
pero lo traduce a lenguaje llano dentro de su propio tooltip). El título
del heatmap se deja igual (preciso, y la descripción de debajo ya lo
explica en llano — mismo patrón que `SalaryChart`).

- [x] `src/components/Charts/HeatmapSvg.jsx`: tooltip — `"{N}
      co-ocurrencias absolutas"` → `"{N} ofertas piden las dos a la
      vez"`; `"Sin co-ocurrencias en el dataset"` → `"Ninguna oferta pide
      las dos a la vez"`. Mismo dato, mismo cálculo (`co_count`), solo
      cambia la palabra — de jerga a lenguaje llano, consistente con las
      2 primeras líneas del propio tooltip.
- [x] `src/components/Charts/HeatmapLegend.jsx`: "...la relación más
      fuerte del dataset..." → "...la relación más fuerte de estos
      datos...".
- [x] Sin tests rotos por este cambio (el texto del tooltip no estaba
      cubierto por ningún test existente, confirmado por grep).

### Verificación final

- [x] `npx vitest run` (frontend) — **372/372** (365 previos a esta
      ronda + 7 nuevos: `JORNADA_LABELS`, `OPTION_LABELS`, "filtro de
      jornada" completo (4), fallback de `FilterSection`).
- [x] `npx vitest run` (`api/`) — **57/57** (sin cambios, esta ronda es
      100% frontend).
- [x] `npm run build` sin errores.
- [x] `.env.local` nunca leído; landing sin modificar.

## Cierre

- [x] Validado contra todos los criterios de `013-spec.md`.
- [x] `spec/README.md` actualizado.
- [x] `spec/constitution/roadmap.md` actualizado.
- [ ] Commit (solo tras confirmación explícita).
