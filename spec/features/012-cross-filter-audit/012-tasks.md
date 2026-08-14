# 012 · Auditoría cruzada de filtros — Tareas

## Preparación

- [x] Confirmado `.env.local` no se leyó en ningún paso.

## Backend

- [x] `api/src/buildFilters.js`: nuevo `stripKeys(query, keys)` +
  `COOCCURRENCE_IGNORED_FILTERS = ["country", "contrato", "jornada", "remote"]`
  — extraído para poder testear el contrato de qué descarta
  `/api/skills/cooccurrence` sin levantar Express ni BD.
- [x] `api/src/index.js`: `/api/skills/cooccurrence` usa
  `stripKeys(req.query, COOCCURRENCE_IGNORED_FILTERS)` en vez del
  destructure inline que dejaba `contrato`/`remote` colarse.
- [x] Test nuevo (`api/__tests__/buildFilters.test.js`): `stripKeys` (3
  tests) + contrato completo de `COOCCURRENCE_IGNORED_FILTERS` +
  `buildFilters` con los 5 filtros activos en la query, confirmando que
  tras el strip solo sobrevive la condición de periodo.

## Frontend

- [x] `src/components/Charts/EuropeMap.jsx`: `warning` incluye
  `"skillCategoria"` además de `"pais"`.
- [x] `src/tests/components/Charts/EuropeMap.test.jsx`: nuevo test — el
  ⓘ aparece cuando `skillCategoria` está activo.
- [x] `src/tests/lib/heatmapUtils.test.js`: nuevo test end-to-end
  (`selectSkills` + `filterSkillsWithCoOccurrence` + `buildLookup`) —
  con una categoría activa, ningún par del lookup final mezcla
  categorías distintas, aunque `pairs` de entrada sí traiga un par
  cruzado.

## Tests

- [x] `npx vitest run` (frontend) — **350/350** (347 previos + 3 nuevos:
  1 en `heatmapUtils.test.js`, 1 en `EuropeMap.test.jsx`, +1 neto del
  ajuste de nombres).
- [x] `npx vitest run` (`api/`) — **40/40** (36 previos + 4 nuevos en
  `buildFilters.test.js`).
- [x] `npm run build` sin errores.

## Verificación contra el backend real

- [x] Servidor de desarrollo reiniciado (`npm run dev`, `node --watch`)
  para recoger los cambios; caché de desarrollo limpiada para forzar
  peticiones frescas.
- [x] `GET /api/skills/cooccurrence?periodo=90d` vs `&contrato=permanent`
  — **idénticos** (mismo `total_matching_jobs`, mismo JSON completo),
  incluso en peticiones secuenciales (~40s de diferencia).
- [x] `GET /api/skills/cooccurrence?periodo=90d` vs `&remote=true` —
  en peticiones secuenciales hubo una diferencia de 5 ofertas
  (224.762 vs 224.757) que en un primer momento pareció sospechosa;
  repetido con **peticiones concurrentes** (mismo instante) el resultado
  fue **idéntico** en ambos casos (224.757, JSON completo igual) —
  confirma que la diferencia inicial era ingesta continua de datos entre
  las dos peticiones secuenciales (~80s de por medio), no un bug.
- [x] `GET /` (sin BD) respondió con normalidad — servidor sano en todo
  momento.

## Hallazgos post-implementación

Verificando esta feature en el navegador (checklist manual, incluía
"reconfirma que el heatmap sigue igual" en el punto de categoría del
heatmap), se encontraron dos cosas más:

### 1. Heatmap sin aviso claro al cambiar de categoría — arreglado

Cambiar la categoría de skill en `SkillHeatmap` atenuaba la tabla pero no
mostraba ningún indicador claro de que estaba actualizando. Investigado:
`ChartCard` ya tiene un mecanismo de "Actualizando..." (atenúa
`children` + badge flotante), pero `SkillHeatmap` solo lo conectaba al
cambio de periodo (`loadingPairs`), no al cambio de categoría
(`loadingSkills`) — y `HeatmapSvg` atenuaba por su cuenta con su propio
prop `loading`, así que conectar `loadingSkills` también a `ChartCard`
sin quitar esa atenuación duplicada habría oscurecido el SVG el doble que
el resto de la tarjeta (0.4 × 0.4).

- [x] `src/components/Charts/SkillHeatmap.jsx`: `loading={loadingPairs || loadingSkills}`
  en `ChartCard` (antes solo `loadingPairs`); `isInitialLoad` sigue
  siendo solo `loadingPairs` (un cambio de categoría nunca es la carga
  inicial).
- [x] `HeatmapSvg` deja de recibir el prop `loading` — `ChartCard` ya
  atenúa todo el contenido, SVG incluido.
- [x] `src/components/Charts/HeatmapSvg.jsx`: prop `loading` y su lógica
  de opacidad eliminados (sin consumidores tras el cambio anterior —
  mismo criterio de limpieza que `extractRoles` en la fase 011).
- [x] El texto inline "Actualizando..." que ya existía en
  `SkillHeatmap.jsx` no se toca — sigue evitando mostrar un conteo de
  skills desactualizado mientras carga la nueva categoría.
- [x] `src/tests/components/Charts/SkillHeatmap.test.jsx`: nuevo test —
  tras la carga inicial, cambiar de categoría con `/api/skills/top`
  colgado muestra el badge de `ChartCard` ("Actualizando...") ADEMÁS del
  texto interno (2 apariciones en vez de 1 — antes del fix, `ChartCard`
  nunca se enteraba de `loadingSkills`).

### 2. `NS_BINDING_ABORTED` en consola — no es un bug, no se toca

Estos mensajes aparecen en la consola de Firefox tras probar varias
gráficas seguidas. Investigado a fondo:
- `src/main.jsx` envuelve la app en `<StrictMode>`, que en desarrollo
  duplica intencionadamente los efectos al montar (monta → limpia →
  remonta) — cancela la primera petición de cada gráfica y lanza la real.
  Comportamiento solo de desarrollo, no aparece en producción.
- `useChartData` crea un único `AbortController` por ejecución del efecto
  y solo cancela en el cleanup (nunca en bucle) — confirmado idéntico en
  las 4 gráficas afectadas (`TopSkillsChart`, `SalaryChart`,
  `DemandByRoleChart`, `EuropeMap`), `AbortError` explícitamente
  ignorado en el `.catch()` (no se muestra como error de UI).

No requiere ningún cambio de código.

- [x] `npx vitest run` (frontend) tras estos cambios — **353/353**.
- [x] `npx vitest run` (`api/`) tras estos cambios — **40/40** (sin
  cambios adicionales en `api/`).
- [x] `npm run build` sin errores.

## Cierre

- [x] Validado contra todos los criterios de `012-spec.md`.
- [x] `spec/README.md` actualizado — `012-cross-filter-audit/` insertado,
  `halo-responsive-pulido` renumerado a 013.
- [x] `spec/constitution/roadmap.md` actualizado — feature 012 a "Hecho",
  backlog renumerado.
- [ ] Commit (solo tras confirmación explícita):
  `fix: close filter leak in skills co-occurrence endpoint and audit cross-chart filter design`
