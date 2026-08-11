# 010 · Calidad de datos y rendimiento — Salario — Tareas

## Preparación

- [x] Confirmado `api/schema.sql` sigue en `.gitignore`.
- [x] Confirmado `.env.local` no se leyó en ningún paso.

## Backend

- [x] `api/src/salaryQuery.js` (nuevo): `buildSalaryByRoleCountryQuery` +
  `shapeSalaryRows`, combinando `total_matching_jobs` con
  `SUM(COUNT(*)) OVER ()` en vez de una segunda query.
- [x] `api/src/index.js`: endpoint reescrito para usar `salaryQuery.js`,
  una sola query en vez de `Promise.all` con dos.
- [x] `api/__tests__/salaryQuery.test.js` (nuevo) — 8 tests.
- [x] `api/schema.sql`: añadido `idx_jobs_salary_by_role_country` junto a
  `idx_jobs_salary_mid`; eliminada `v_salary_by_role_country` (y su línea
  en el índice de vistas, 10→9 vistas); sincronizado el `CHECK` de
  `role_category` a los 16 valores reales (documentación, no DDL contra
  producción).
- [x] `spec/features/010-salary-chart-quality/010-apply-index.sql`
  (nuevo): script standalone listo para el SQL editor de Supabase.

## Frontend — librerías compartidas

- [x] `src/lib/roleLabels.js`: `rankRolesByVolume` (nuevo, no toca
  `extractRoles`).
- [x] `src/lib/filterUtils.js`: `CONTRATO_LABELS` (nuevo) +
  `describeFiltros` usa el mapeo para `contrato`.
- [x] `src/lib/errorMessages.js` (nuevo): `describeError`.
- [x] `src/hooks/useChartData.js`: `AbortController` + guard contra
  condiciones de carrera en `finally`.
- [x] `src/services/jobServices.js`: `fetchJson` + `getTopSkills` +
  `getDemandByRole` + `getSalaryByRoleAndCountry` + `getOffersByCountry`
  aceptan y reenvían `signal`.
- [x] `src/components/ui/ChartCard.jsx`: `describeError` en el render de
  error; prop `slowHint` + timer de 6s.
- [x] `src/components/ui/ChartDescription.jsx`: `data-testid` en el
  contenedor de pills.

## Frontend — call sites de `useChartData` (mecánico)

- [x] `SalaryChart.jsx`: `(signal) => getSalaryByRoleAndCountry(filters, signal)`.
- [x] `DemandByRoleChart.jsx`: `(signal) => getDemandByRole(filters, signal)`.
- [x] `TopSkillsChart.jsx`: `(signal) => getTopSkills(filters, signal)`.
- [x] `EuropeMap.jsx`: `(signal) => getOffersByCountry(filters, selectedSkill, signal)`.

## Frontend — `SalaryChart.jsx`

- [x] `pivotData`: `country` vía `NOMBRES_PAISES` (fallback
  `country_name` → `code`); añade `${role}__meta` con `job_count` +
  `avg_salary_eur`. Named export.
- [x] `allRoles` usa `rankRolesByVolume` en vez de `extractRoles`.
- [x] `TooltipSalario`: número de ofertas + media + aviso "muestra
  pequeña" (`job_count < 5`). Named export.
- [x] `<Bar>` con `<Cell>` por combinación país×rol: `fillOpacity` 0.45
  si `job_count < 5`.
- [x] `nota`: combina el criterio "top 5 por volumen" + la nota de
  contrato traducida con `CONTRATO_LABELS`.
- [x] Bloque `rows.length === 0` con el mensaje de `TopSkillsChart`,
  antes del bloque de "selecciona un rol".
- [x] `slowHint` pasado a `ChartCard`.

## Tests

- [x] `src/tests/lib/roleLabels.test.js`: `rankRolesByVolume` (4 tests).
- [x] `src/tests/lib/filterUtils.test.js`: `describe("filtro de contrato")`
  + `describe("CONTRATO_LABELS")` (5 tests).
- [x] `src/tests/components/Charts/SalaryChart.test.jsx`: sin datos, nota
  de contrato, `TooltipSalario`, `pivotData`, selección por volumen; fix
  del test "datos globales" con `data-testid` + `within()`.
- [x] `src/tests/components/ui/ChartCard.test.jsx`: `describeError` (2
  tests), `slowHint` (4 tests, con `act()` envolviendo
  `vi.advanceTimersByTime` — sin eso React avisaba de actualización de
  estado fuera de `act`).
- [x] `src/tests/hooks/useChartData.test.js`: `AbortSignal` pasado a
  `fetchFn`, cancelación al cambiar deps, abort al desmontar,
  `AbortError` no expuesto como `error` (4 tests).
- [x] `npx vitest run` (frontend) — **347/347** (316 previos + 31 nuevos).
- [x] `npx vitest run` (`api/`) — **28/28** (20 previos + 8 nuevos).
- [x] `npm run build` sin errores.

## Verificación contra el backend real

- [x] Backend real, endpoint `/api/skills/list` y `/api/stats/summary`
  usados como control de salud general — respondieron con normalidad en
  intentos previos de esta sesión.
- [x] `GET /` (sin BD) responde en ~20ms — confirma que el proceso
  Express está sano; el problema es específico de esta query, no del
  servidor.
- [~] **`total_matching_jobs` de la query combinada no se pudo comparar
  en vivo con el valor de referencia (73840, obtenido con la query vieja
  de dos pasadas más temprano en esta sesión).** 4 intentos reales, todos
  fallidos por el mismo motivo:
  - `periodo=90d` (sin filtro extra): timeout de cliente a los 90s, luego
    `HTTP 500 "canceling statement due to statement timeout"` a los 122s.
  - `periodo=90d&country=de` (filtro adicional, para reducir el volumen
    escaneado): también `HTTP 500` por `statement timeout`, 121s.
  Es exactamente el problema preexistente que esta feature soluciona con
  `idx_jobs_salary_by_role_country` — que no se ha podido aplicar contra
  la BD real en este entorno (ver sección Backend). Sin el índice, la
  query sigue siendo tan lenta como antes de esta feature; el cambio de
  "dos queries" a "una" no basta por sí solo para evitar el
  `statement_timeout` en un dataset de este tamaño sin índice de soporte.
  **Verificación alternativa aplicada, consistente con el patrón de toda
  la sesión cuando la BD real no responde a tiempo:**
  - `api/__tests__/salaryQuery.test.js` confirma que el SQL generado es
    correcto (`PERCENTILE_CONT`, `GROUP BY` con las 3 columnas correctas,
    `SUM(COUNT(*)) OVER ()`, interpolación del `WHERE`) y que
    `shapeSalaryRows` extrae `total_matching_jobs` correctamente.
  - Antes de esta feature, en esta misma sesión, la query VIEJA sí
    respondió con éxito (`HTTP 200`, 21.7s, `total_matching_jobs: 73840`
    para `periodo=90d`) — usado como referencia de forma/volumen de
    datos reales al diseñar `pivotData`/`TooltipSalario`.
  - 347/347 tests de frontend + 28/28 de `api/` pasan, incluyendo los
    nuevos que ejercitan `pivotData` y `TooltipSalario` con datos con la
    forma real confirmada (`country_name` en inglés, `job_count`,
    `avg_salary_eur`).
- [ ] Aplicar `idx_jobs_salary_by_role_country` manualmente (ver
  `010-apply-index.sql`) y comparar tiempo de respuesta antes/después —
  pendiente de que el usuario lo ejecute en el SQL editor de Supabase, o
  de una futura sesión con la BD más disponible.

## ⚠️ Caché temporal de desarrollo — RECORDAR QUITAR

No es parte de la auditoría de `SalaryChart` — se añadió a petición del
usuario porque la BD real estuvo fallando/tardando 15-120s+ de forma
consistente durante la verificación de esta feature, dificultando seguir
trabajando. Ver `010-spec.md` (sección "⚠️ Añadido temporal") y
`010-plan.md` (punto 12) para el detalle completo.

- [x] `api/src/devCache.js` (nuevo): middleware que cachea en disco
  (`api/.dev-cache/`) las respuestas `GET` con 200, TTL 5 minutos.
- [x] `api/src/index.js`: `app.use(devCacheMiddleware)` cableado, con
  comentario `⚠️ TEMPORAL` explícito.
- [x] `.gitignore`: entrada `api/.dev-cache/` añadida.
- [x] Verificado con datos reales: `/api/skills/list` 40.3s (MISS) → 14.8ms
  (HIT); sigue en `HIT` tras reiniciar el servidor (`node --watch`
  reinicia en cada guardado — se comprobó que el PID cambiaba y la caché
  seguía sirviendo).
- [x] `npx vitest run` en `api/` tras añadirlo — 28/28, sin regresiones.
- [ ] **Pendiente — quitar cuando ya no haga falta:** borrar
  `api/src/devCache.js`, la línea `app.use(devCacheMiddleware)` (+ import)
  en `api/src/index.js`, la entrada `api/.dev-cache/` de `.gitignore`, y
  la carpeta `api/.dev-cache/` si existe localmente.

## Cierre

- [x] Validado contra todos los criterios de `010-spec.md` (ver detalle
  abajo).
- [x] `spec/README.md` actualizado — `010-salary-chart-quality/`
  insertado, `halo-responsive-pulido` renumerado a `011`.
- [x] `spec/constitution/roadmap.md` actualizado — feature 010 en "En
  curso 🔜", backlog renumerado.
- [x] `AGENTS.md` actualizado — `api/` fuera de "Zonas congeladas",
  `.env.local` como única excepción permanente.
- [ ] Commit (solo tras confirmación explícita del usuario):
  `feat: audit and fix SalaryChart data quality, UX, and query performance`

### Validación contra `010-spec.md`

- [x] Roles por defecto = top 5 por `job_count` total (`rankRolesByVolume`).
- [x] Tooltip muestra siempre el número de ofertas.
- [x] Barras con &lt;5 ofertas en opacidad reducida (`fillOpacity` 0.45).
- [x] Tooltip muestra la media junto a la mediana.
- [x] Eje X en español (`NOMBRES_PAISES`, no `country_name` en inglés ni
  el código de 2 letras).
- [x] Nota de contrato sin valores en inglés.
- [x] `rows: []` muestra el mensaje de "no hay datos", no el de
  "selecciona un rol".
- [x] Errores de timeout/pool traducidos y sin prefijo `"Error:"` crudo;
  errores no reconocidos mantienen el formato anterior.
- [x] `slowHint` tras 6s de carga inicial, opt-in, solo en `SalaryChart`.
- [x] `AbortController` en las 4 gráficas que usan `useChartData`.
- [x] Backend: una sola query en vez de dos.
- [x] `schema.sql`: índice añadido (documentado; aplicación real
  pendiente, ver arriba), vista duplicada eliminada.
- [x] `npx vitest run` 100% en frontend y `api/`.
- [x] `npm run build` sin errores.
- [x] `api/schema.sql` protegido en `.gitignore`.
- [x] `.env.local` nunca leído.
- [x] `AGENTS.md` refleja el nuevo acceso a `api/`.
- [x] Landing sin modificar.
