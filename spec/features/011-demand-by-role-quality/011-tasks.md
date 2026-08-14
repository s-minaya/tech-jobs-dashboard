# 011 · Evolución mensual de ofertas por rol — Tareas

## Preparación

- [x] Confirmado `api/schema.sql` sigue en `.gitignore`.
- [x] Confirmado `.env.local` no se leyó en ningún paso.

## Backend

- [x] `api/src/demandQuery.js` (nuevo): `buildDemandByRoleQuery` +
  `shapeDemandRows`, sin `country_code` en `SELECT`/`GROUP BY`,
  `total_matching_jobs` vía `SUM(COUNT(*)) OVER()`.
- [x] `api/src/index.js`: endpoint reescrito para usar `demandQuery.js`,
  una sola query en vez de `Promise.all` con dos.
- [x] `api/__tests__/demandQuery.test.js` (nuevo) — 8 tests.
- [x] `api/schema.sql`: añadido `idx_jobs_demand_by_role`; eliminada
  `v_demand_by_role_monthly` (y su línea en el índice de vistas, 9→8
  vistas).
- [x] `spec/features/011-demand-by-role-quality/011-apply-index.sql`
  (nuevo): script standalone listo para el SQL editor de Supabase.

## Frontend — limpieza

- [x] `src/lib/roleLabels.js`: `extractRoles` eliminada; comentario de
  `rankRolesByVolume` generalizado (ya no exclusiva de `SalaryChart`).
- [x] `src/tests/lib/roleLabels.test.js`: bloque `describe("extractRoles",
  ...)` eliminado.

## Frontend — `DemandByRoleChart.jsx`

- [x] Import: `rankRolesByVolume` en vez de `extractRoles`.
- [x] `allRoles = rankRolesByVolume(rows)`.
- [x] `nota`: menciona "en total" (volumen) y "puede estar incompleto"
  (mes en curso).
- [x] Bloque `rows.length === 0 && !loading` con el mensaje de
  `TopSkillsChart`/`SalaryChart`, como tercera rama junto a
  `periodoInsuficiente`.
- [x] `slowHint` pasado a `ChartCard`.
- [x] Comentario de `pivotData` actualizado (invariante: backend ya no
  fragmenta por país).

## Frontend — mock

- [x] `src/mocks/handlers.js`: mock de `demand-by-role` sin `country_code`
  en las filas.

## Tests

- [x] `src/tests/components/Charts/DemandByRoleChart.test.jsx`: selección
  de roles por defecto (integración ligera), estado "sin datos", nota (3
  tests nuevos sobre los 8 ya existentes).
- [x] `npx vitest run` (frontend) — **347/347** (347 previos − 3
  `extractRoles` eliminados + 3 nuevos de `DemandByRoleChart` = 347, sin
  cambio neto en el total).
- [x] `npx vitest run` (`api/`) — **36/36** (28 previos + 8 nuevos de
  `demandQuery.test.js`).
- [x] `npm run build` sin errores.

## Verificación contra el backend real

- [x] `GET /` (sin BD) responde en ~3ms — confirma que el proceso Express
  está sano.
- [x] `GET /api/jobs/demand-by-role?periodo=90d` (sin filtro de país, el
  caso que expone el hallazgo 1 en su forma más costosa): **2 intentos,
  ambos fallidos**, consistente con la hipótesis del hallazgo 4 (falta de
  índice dedicado — `idx_jobs_demand_by_role` no se ha podido aplicar
  contra la BD real desde este entorno, mismo bloqueo de conexión directa
  visto en fases 009/010):
  - 1er intento: `ECHECKOUTTIMEOUT` — "unable to check out connection
    from the pool after 15000ms" a los 15.4s.
  - 2º intento: `HTTP 500 "canceling statement due to statement timeout"`
    a los 121s.
- [x] `GET /api/jobs/demand-by-role?periodo=90d&country=de` (con filtro de
  país, para reducir el volumen escaneado): **`HTTP 200` en 5.3s.**
  Confirmado con datos reales:
  - Forma de fila: solo `month`, `role_category`, `job_count` — sin
    `country_code` (criterio de aceptación cumplido contra la BD real, no
    solo en el mock/tests).
  - `total_matching_jobs` (63689) == suma de `job_count` de las 64 filas
    devueltas (63689) — confirma que `SUM(COUNT(*)) OVER()` +
    `shapeDemandRows` funcionan correctamente contra la BD real.
  - 64 filas para 90 días × ~16 roles posibles (sin fragmentar por país,
    como se esperaba tras el fix del hallazgo 1).
- **Nota operativa** (no es un bug de la feature): durante la
  verificación, borrar manualmente `api/.dev-cache/` para forzar una
  respuesta sin caché mientras el servidor (`node --watch`) seguía
  arrancado causó un `ENOENT` transitorio al intentar escribir en caché
  (la carpeta se crea una sola vez al cargar el módulo, no en cada
  escritura). Se resolvió recreando la carpeta manualmente; confirmado que
  la caché volvió a funcionar con normalidad (`X-Dev-Cache: HIT` en la
  petición siguiente). No requiere ningún cambio en `devCache.js` — es
  temporal y ya está marcado para eliminación (ver más abajo).
- Contraste con la hipótesis del hallazgo 1 (bug de agregación con "Todos"
  los países): no se pudo comparar directamente contra el comportamiento
  de la query vieja (ya no existe en el repo, y reproducirla manualmente
  contra la BD real habría requerido otra query sin filtro de país, que ya
  falló por timeout dos veces) — la corrección queda verificada por: (a)
  lectura exhaustiva del código antes y después (`011-plan.md`, hallazgo
  1), (b) `demandQuery.test.js` confirmando que el SQL generado ya no
  agrupa por `country_code`, y (c) la respuesta real con `country=de`
  arriba, que confirma que sin ese filtro tampoco hay fragmentación por
  país en las filas devueltas.

## Cierre

- [x] Validado contra todos los criterios de `011-spec.md` (ver detalle
  abajo).
- [x] `spec/README.md` actualizado — `011-demand-by-role-quality/`
  insertado, `halo-responsive-pulido` renumerado a 012.
- [x] `spec/constitution/roadmap.md` actualizado — feature 011 a "Hecho",
  backlog renumerado.
- [ ] Commit (solo tras confirmación explícita):
  `feat: audit and fix DemandByRoleChart data quality, UX, and query performance`

### Validación contra `011-spec.md`

- [x] Con el filtro de país en "Todos" (por defecto), la demanda mostrada
  suma todos los países — confirmado que el backend ya no fragmenta por
  país (`demandQuery.test.js` + verificación real con `country=de`).
- [x] Roles por defecto = top 5 por `job_count` total
  (`rankRolesByVolume`).
- [x] `GET /api/jobs/demand-by-role` responde con una sola query, sin
  `country_code` en `SELECT`/`GROUP BY` — confirmado contra la BD real.
- [x] `schema.sql`: `idx_jobs_demand_by_role` añadido (documentado;
  aplicación real pendiente, ver abajo), `v_demand_by_role_monthly`
  eliminada.
- [x] `rows: []` muestra el mensaje de "no hay datos".
- [x] `slowHint` wireado en `ChartCard`.
- [x] Nota menciona volumen total y mes en curso incompleto.
- [x] `extractRoles` eliminada de `roleLabels.js` y sus tests.
- [x] `npx vitest run` 100% en frontend y `api/`.
- [x] `npm run build` sin errores.
- [x] `api/schema.sql` protegido en `.gitignore`.
- [x] `.env.local` nunca leído.
- [x] Landing sin modificar.

**Pendiente** (no bloqueante, mismo patrón que fases 009/010): aplicar
`idx_jobs_demand_by_role` manualmente contra la BD real (ver
`011-apply-index.sql`) — el entorno bloquea conexiones directas con
credenciales embebidas; queda para ejecución manual en el SQL editor de
Supabase, o una futura sesión con la BD más disponible. **Aplicado con
éxito en la fase 015.**

## Hallazgos post-implementación

Tras cerrar la feature, segunda revisión.
Dos hallazgos accionables, ambos implementados en esta misma feature:

### 1. Filtro de `jornada` estaba mal excluido — habilitado

`contract_time` es una columna directa de `jobs`, de la misma clase que
`contrato`/`remote` (que sí se aplicaban). No había ninguna barrera
técnica para excluirlo, y el texto mostrado al usuario
(`NOTAS_FILTROS_IGNORADOS.jornada` en `ChartDescription.jsx`, "los datos
no cambian significativamente entre ofertas a tiempo completo o parcial")
es un texto **genérico compartido** con `TopSkillsChart` y `SkillHeatmap`
— por su redacción ("estadísticamente fiables", "los porcentajes
perderían representatividad") parece escrito pensando en el heatmap de
co-ocurrencia (que sí tiene una razón real: necesita volumen para que los
pares de skills sean fiables), reutilizado aquí sin verificar si aplicaba.

- [x] `api/src/index.js`: `GET /api/jobs/demand-by-role` deja de
  descartar `jornada` de `req.query` antes de `buildFilters`.
- [x] `src/services/jobServices.js`: `getDemandByRole` deja de descartar
  `jornada` de los filtros antes de construir los params.
- [x] `src/components/Charts/DemandByRoleChart.jsx`: `filters.jornada`
  añadido a las deps de `useChartData`; `jornada` quitado de
  `excludeFilters`/`getWarningNodes` (ya no se avisa de que se ignora,
  porque ya no se ignora).
- [x] `src/tests/components/Charts/DemandByRoleChart.test.jsx`: test
  obsoleto ("muestra aviso cuando jornada está activa") actualizado para
  confirmar lo contrario — que el aviso ya NO aparece.
- [x] **Verificado contra la BD real** (`periodo=90d&country=de`):
  - Sin filtro: `total_matching_jobs = 63675`.
  - `jornada=full_time`: `total_matching_jobs = 38175`.
  - `jornada=part_time`: `total_matching_jobs = 2741`.
  - Los tres números son distintos entre sí — confirma que el filtro
    afecta realmente a los datos, no es un no-op.
  - **Tasa de `contract_time` no declarado** (ni `full_time` ni
    `part_time` — por el `CHECK` de `schema.sql` solo puede ser `NULL`):
    `63675 − 38175 − 2741 = 22759` → **35.7%** de las ofertas de este
    filtro (país=DE, 90 días) no tienen jornada declarada. Es una
    proporción notable pero no invalida el filtro — sigue dejando ~60%
    catalogadas como jornada completa y un ~4% como parcial, una división
    real y útil; simplemente hay que asumir (como con cualquier filtro
    sobre un campo opcional del scraper) que una parte de las ofertas
    quedará fuera de ambas categorías cuando el filtro está activo.

### 2. Consulta desperdiciada con "Últimos 30 días" — eliminada

`periodoInsuficiente` (el aviso que sustituye al gráfico cuando el
periodo no tiene suficientes meses para ver tendencia) se calculaba
**después** de disparar `useChartData`, así que la petición a
`/api/jobs/demand-by-role` se hacía igualmente y su resultado se
descartaba siempre que el periodo fuera "Últimos 30 días".

- [x] `periodoInsuficiente` se calcula ahora antes de `useChartData` y se
  usa para decidir la `fetchFn`: si es `true`, resuelve con
  `{ rows: [], total_matching_jobs: null }` sin tocar la red; si es
  `false`, llama a `getDemandByRole` como antes.
- [x] Efecto secundario aceptado conscientemente: con "Últimos 30 días"
  el badge de "X ofertas" de `ChartDescription` ya no se muestra (antes sí,
  con el total real de esos 30 días, aunque el gráfico no se viera). Se
  documenta aquí para que quede constancia del trade-off: se cambia "un
  número real pero desconectado de lo que se ve en pantalla" por "nada",
  a cambio de no gastar una consulta que nunca se iba a usar.
- [x] `src/tests/components/Charts/DemandByRoleChart.test.jsx`: nuevo test
  que cuenta las llamadas a la API mockeada con "Últimos 30 días" y
  confirma que son 0.

### 3. `skillCategoria` — confirmado que su exclusión SÍ es correcta

Pregunta que surgió en la discusión: ¿no debería la evolución de demanda
por rol poder filtrarse por categoría de skill? Respuesta, con el resto de
endpoints como evidencia: `skillCategoria` en el sidebar solo tiene efecto
real en `GET /api/skills/top` (se traduce a `category` y filtra
`s.category`, una columna de la tabla `skills`). Ningún otro endpoint
(`salary/by-role-country`, `jobs/offers-by-country`,
`jobs/demand-by-role`) hace `JOIN` con `job_skills`/`skills` — todos
cuentan/agregan sobre `jobs` directamente. `demand-by-role` no tiene
ninguna columna de skill que filtrar sin añadir un `JOIN` que cambiaría el
propósito de la query (contar ofertas por rol, no por skill). Se confirma
la exclusión tal y como estaba — sin cambios de código, solo se documenta
el razonamiento aquí para que quede constancia.

### 4. Recomendación (no implementada): `/api/skills/top` tiene el mismo problema de `jornada`

`GET /api/skills/top` también descarta `jornada` de `req.query`
(`api/src/index.js`, sin ningún comentario que lo explique — a diferencia
de `/api/skills/cooccurrence`, que sí documenta "País, contrato, jornada y
remote no aplican (datos globales)"). Estructuralmente `contract_time` es
una columna de `jobs`, ya unida en esa query (`FROM job_skills js JOIN
jobs j ...`) — no hay barrera técnica, igual que en `demand-by-role`. No
se implementa aquí: es una gráfica distinta (`TopSkillsChart`), ya cerrada
en una fase anterior, fuera del alcance de esta feature — se documenta
como candidato a su propia ronda "tabla por tabla" futura.

**Actualización**: resuelto en la fase 012 (Auditoría cruzada de
filtros) — tras discutirlo, se decidió NO habilitarlo. Ver
`spec/features/012-cross-filter-audit/012-tasks.md`: jornada no
correlaciona con qué tecnologías pide un puesto (a diferencia de
contrato/remoto, que sí tienen una historia plausible), así que la
recomendación original de esta sección resultó ser un error de
razonamiento — "sin barrera técnica" no es lo mismo que "aporta una
pregunta de negocio útil".

### 5. "Other" domina el top 5 por defecto — excluido de la selección automática

Verificando la selección de roles por defecto en el navegador
(filtros neutros), los 5 roles mostrados fueron `Other, Backend,
Management, Sysadmins, ERP/SAP` — `other` (el cajón de sastre del
clasificador NLP para títulos que no encajan en ninguna categoría real,
ver `role_category VARCHAR(50), -- clasificacion del rol (NLP sobre
title)` en `schema.sql`) resultó ser el rol con más volumen real.
`rankRolesByVolume` funciona exactamente como se diseñó — el problema no
es de cálculo, es que un rol "sin clasificar" no aporta ninguna
información accionable como "rol destacado" en la selección automática.

- [x] `src/components/Charts/DemandByRoleChart.jsx`: `effectiveSelected`
  filtra `"other"` antes de recortar a 5 cuando `selectedRoles === null`.
  `allRoles` no se toca — `"other"` sigue disponible como botón para
  selección manual en `RoleSelector`, solo deja de ocupar
  automáticamente uno de los 5 huecos por defecto.
- [x] Mismo cambio en `src/components/Charts/SalaryChart.jsx` (fase 010),
  que comparte `rankRolesByVolume` y tiene el mismo problema potencial.
- [x] `rankRolesByVolume` (`roleLabels.js`) sin cambios — sigue
  devolviendo todos los roles incluido `other` en su posición real por
  volumen; el filtro vive en el componente porque es una decisión de qué
  mostrar por defecto, no de cómo se calcula el ranking.
- [x] Tests nuevos en `DemandByRoleChart.test.jsx` y `SalaryChart.test.jsx`:
  con `other` como el rol de mayor volumen en el mock, confirma que no
  aparece resaltado en la selección por defecto pero sí existe como botón
  disponible.

- [x] `npx vitest run` (frontend) tras todos estos cambios — **353/353**.
- [x] `npx vitest run` (`api/`) tras estos cambios — **40/40** (sin
  cambios adicionales en `api/` más allá de los ya contados en la fase
  012).
- [x] `npm run build` sin errores.
