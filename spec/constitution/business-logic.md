# Semántica de negocio y modelo de dominio

Reglas de negocio y mecánicas de datos no obvias, acumuladas en las
auditorías "tabla por tabla" (features 008-015). Es la referencia que
decide qué significa cada dato — antes de tocar cualquier query o
componente que dependa de `jobs`/`skills`/`countries`, léela.

No documenta el modelo de datos completo (para eso está `api/schema.sql`,
que no se sube al repo — ver `.gitignore`) ni el historial de cómo se
descubrió cada regla (eso vive en `spec/features/0NN-*/`); documenta solo
la regla vigente y su motivo.

## Ofertas de empleo (`jobs`) — ciclo de vida y fechas

- **`is_active`** — `TRUE` mientras la oferta se considera vigente en el
  mercado. El mecanismo exacto que la pone en `FALSE` vive en el
  pipeline de ingesta, fuera de este repo (no hay ningún `.py` ni
  `transform.py` versionado aquí) — no es auditable ni corregible desde
  el dashboard.
- **No equivale a "vista recientemente en el scraping"**: hay ofertas
  activas cuyo `last_seen_at` lleva semanas sin actualizarse. La ventana
  real es de **~90-98 días desde `posted_at`**, con independencia de
  cuándo se confirmó la oferta por última vez (verificado con medición
  directa: 0 ofertas activas superan 98 días de antigüedad; p95 ≈ 84
  días; mediana ≈ 42 días).
- **`posted_at`** — fecha de publicación (`created` de Adzuna), un dato
  del *mercado*. **`last_seen_at`** — última vez que el pipeline
  confirmó la oferta, un dato del *pipeline*. Pueden divergir varios
  minutos u horas entre sí; no son intercambiables. `last_updated` en
  `GET /api/stats/summary` usa `MAX(last_seen_at)`, no `posted_at` — la
  etiqueta "Última actualización" promete frescura del pipeline, no del
  mercado.
- **Filtro `periodo`** (`buildFilters.js`) compara siempre contra
  `posted_at` (`30d`/`90d`/`180d`), nunca `last_seen_at`. `"all"`/ausente
  con alias `all` no añade condición de fecha — es histórico completo
  entre las ofertas que siguen `is_active = TRUE` (nunca incluye
  inactivas: el dashboard es una foto del mercado actual, no un archivo).
- **`is_active = TRUE` es incondicional** en `buildFilters()` — todo
  endpoint que la use solo ve ofertas activas, sin excepción.
- **"Evolución mensual de ofertas" atribuye cada oferta a su mes de
  `posted_at`, una sola vez** — nunca se reparte entre los meses en que
  siguió activa. Es la única semántica posible: no existe ninguna
  columna de fecha de cierre, así que no hay forma de saber en qué meses
  "estuvo viva" más allá de su publicación.
- **El último mes de una serie mensual puede estar incompleto** — la
  ingesta es continua, así que un mes en curso puede mostrar menos
  ofertas que los anteriores sin que la demanda esté cayendo de verdad.

## KPIs globales (`GET /api/stats/summary`) — ventanas propias, no un descuido

Cada campo usa la ventana que responde a su propia pregunta de negocio,
no la misma ventana por defecto:

| Campo | Ventana | Pregunta que responde |
|---|---|---|
| `total_active_jobs`, `total_countries`, `total_skills`, `total_companies`, `total_role_categories`, `pct_with_salary` | Ninguna (todas las activas) | "¿Cuánto hay ahora mismo en el radar?" |
| `median_salary_90d` | 90 días | "¿Cuánto se paga *recientemente*?" (90d, no 6 meses: con el techo de ~90-98 días de arriba, una ventana de 6 meses sería idéntica a no poner ninguna) |
| `top_skills_30d` | 30 días | "¿Qué se pide *ahora mismo*?" |

**Este endpoint no acepta ningún filtro del sidebar** — representa el
estado global del dataset siempre, independientemente de lo que el
usuario tenga filtrado en el resto del dashboard. Es intencional (da
contexto de volumen/calidad antes de que el usuario filtre nada) y está
comunicado en pantalla: `SummaryStats.jsx` muestra una nota fija ("Datos
globales del mercado — no varían con los filtros").

## Salario (`salary_min`/`salary_max`/`salary_mid`/`salary_is_predicted`)

- **`salary_mid`** = `(salary_min + salary_max) / 2`, calculado en el
  pipeline de ingesta — es el campo de referencia para todo el dashboard.
- **Se agrega con mediana, no con media** — más robusta frente a
  outliers. Verificado con datos reales: percentiles por país
  consistentes con salarios **anuales** (medianas 28.800€-80.000€ según
  país); no hay campo de unidad en el schema, es una asunción verificada
  contra la distribución real, no solo asumida.
- **Regla de calidad — "salario declarado y verificado"**
  (`salaryQualityConditions()` en `api/src/salaryQuery.js`, reusada por
  `GET /api/salary/by-role-country` y las 2 subconsultas de salario de
  `GET /api/stats/summary`; punto único de verdad, no la dupliques):
  1. `salary_mid IS NOT NULL`
  2. `salary_is_predicted = FALSE` (hoy nunca es `TRUE` en producción —
     condición defensiva, no dead code)
  3. `salary_mid >= 1.000€` — por debajo, patrón confirmado de error de
     escala del origen (ej. rangos `840-1140` en puestos senior, que
     multiplicados ×100 dan cifras plausibles), no salarios reales bajos
  4. `NOT (salary_min = salary_max AND contract_time IS NULL AND
     salary_mid >= 500.000€)` — techo dirigido contra un cluster de 32
     ofertas corruptas confirmado en vivo (31 valores idénticos de
     500.000€ en NL repartidos en decenas de roles sin relación, más 1
     de 1.904.448€ en FR) — no es un corte numérico plano: un salario
     alto con un rango real (`min != max`) no se excluye por serlo.
- **Jornada parcial (`contract_time = 'part_time'`) SÍ afecta la
  comparabilidad**: el salario viene pro-rateado a la jornada real
  (mediana `part_time` ≈ mitad de `full_time`: 25.002€ vs. 50.000€,
  verificado). `SalaryChart` avisa con una nota cuando el filtro de
  jornada está activo, mismo patrón que la nota de `contrato`.
- **Moneda EUR única** — asunción de diseño del pipeline (los 8 países
  cubiertos usan EUR), no verificable desde este repo contra la API
  cruda de origen.
- **Bruto/neto** — no hay ningún dato que lo indique; no derivable.
- **`avg_salary_eur` es más sensible a outliers que la mediana** — al
  mostrarlo en tooltips, tenerlo en cuenta si aparecen nuevos clusters
  de datos corruptos en el futuro (el techo de arriba es dirigido a un
  cluster concreto, no un filtro general de outliers).

## Roles (`role_category`)

- 16 categorías reales (sincronizado en `schema.sql`, verificado contra
  la BD real).
- **`'other'`** es una categoría real y seleccionable en `SalaryChart`
  (vía `RoleSelector`) — se excluye solo de la selección automática por
  defecto (top-5 por volumen), nunca del roster completo ni de
  `total_role_categories`, que la incluye a propósito para no subestimar
  la granularidad real del dataset.
- `role_category IS NULL` existe (clasificador NLP sin categoría
  asignada) — excluido explícitamente en `demand-by-role` y
  `salary/by-role-country` (`role_category IS NOT NULL`), ~7% de las
  ofertas activas+recientes bajo los filtros por defecto.

## Empresas (`company`)

- **`total_companies` cuenta strings distintos de `company`, no empresas
  reales deduplicadas** — existen variantes de razón social del mismo
  empleador (ej. "Sii" / "Sii Sp. z o.o.") sin normalizar. Limitación
  conocida y aceptada, mismo criterio que `total_skills` (abajo).

## Skills (`skills` / `job_skills`)

- La tabla `skills` se puebla progresivamente por un pipeline NLP de
  extracción — contiene artefactos sin ninguna oferta real detrás
  (fragmentos de texto, nombres compuestos como "React/Angular").
- **"Skill real"** = tiene al menos una oferta **activa** vinculada vía
  `job_skills` (patrón `EXISTS` correlacionado). Regla compartida por
  `GET /api/skills/list` (autocomplete) y `total_skills` de
  `GET /api/stats/summary` (`COUNT(DISTINCT)` vía `JOIN`, misma
  semántica, formulación SQL distinta — verificadas equivalentes:
  478 = 478 con datos reales).
- **~30% de las ofertas activas/recientes tienen alguna skill extraída**
  — el 70% restante no es un backlog de ingesta, está repartido por toda
  la ventana temporal. Por eso `total_matching_jobs` de
  `GET /api/skills/top` y `GET /api/skills/cooccurrence` **cuenta
  directamente sobre `jobs`, sin `JOIN` a `job_skills`** — iguala la
  semántica de "X ofertas" con el resto de gráficas (que no exigen
  relación con skills) en vez de mostrar un número ~3x menor sin
  explicación.
- `skills.category` acepta `'soft'` en su `CHECK` de BD, pero el sidebar
  no la ofrece — no hay ninguna skill `soft` con ofertas reales todavía.
  Si el pipeline empieza a etiquetar alguna, se colaría en "Todas" sin
  que el usuario pueda filtrarla — revisar si esto cambia.
- **Co-ocurrencia** (`js1.skill_id < js2.skill_id`) evita duplicar el
  par (A,B)/(B,A). No se agrupa por `role_category` — fragmentaría cada
  par real en varias filas con un `co_count` parcial.

## Países (`countries`)

- 8 países UE cubiertos (DE, FR, ES, NL, PL, IT, AT, BE). UK excluido a
  propósito: no pertenece a la UE y Eurostat no publica datos de UK
  post-Brexit.
- Todos usan EUR — no hace falta tabla de conversión de moneda.

## Filtros del sidebar — qué aplica cada endpoint y por qué

`buildFilters.js` es la base común (país/periodo/contrato/jornada/remote
+ `is_active` incondicional). Cada endpoint decide qué subconjunto usa;
las exclusiones son decisiones de negocio, no huecos:

| Endpoint | Filtros que ignora | Por qué |
|---|---|---|
| `jobs/offers-by-country` (mapa) | `país` | El mapa necesita mostrar todos los países a la vez |
| `skills/top` | `jornada` (`TOP_SKILLS_IGNORED_FILTERS`) | Qué tecnología pide un puesto no depende de si es jornada completa o parcial |
| `skills/cooccurrence` | `país`/`contrato`/`jornada`/`remote` (`COOCCURRENCE_IGNORED_FILTERS`) | Fragmentar la muestra deja pocas co-ocurrencias estadísticamente fiables |
| `salary/by-role-country`, `jobs/demand-by-role` | Ninguno de los 5 | Cada uno responde una pregunta real por país/contrato/jornada/remote |
| `skills/*` (todos) | `skillCategoria` no aplica a `salary/by-role-country`, `demand-by-role`, `offers-by-country` | Ningún endpoint salvo `skills/top` hace `JOIN` con `skills` |
| `stats/summary` | Todos | Estado global, ver sección de KPIs arriba |

Cuando un endpoint ignora un filtro que el usuario tiene activo, la UI
avisa con el icono ⓘ (`getWarningNodes` + `excludeFilters`/`warning` en
`ChartCard`/`ChartDescription`) — verificado que el filtro ignorado
sigue devolviendo exactamente el mismo resultado que sin él (no es una
divergencia silenciosa).

`applyDefaultPeriodoFallback` (usado por `skills/top` y
`skills/cooccurrence`) solo actúa si `periodo` está **totalmente
ausente** de la query string — nunca si vale `"all"` explícito, que
significa histórico completo real.

`SkillHeatmap` sí aplica el filtro de categoría de skill, con la
semántica "ambas skills del par pertenecen a la categoría" —
implementado client-side en `heatmapUtils.js`.

## Reconciliación entre gráficas — invariantes verificados

Bajo el mismo estado de filtros, `EuropeMap`/`TopSkillsChart`/
`SkillHeatmap` calculan la misma población base (`is_active` + filtros
que cada uno aplica) — verificado byte a byte con datos reales, no solo
por lectura de código. La aritmética interna de `demand-by-role` y
`salary/by-role-country` (`SUM(job_count)` de las filas = su propio
`total_matching_jobs`, vía `SUM(COUNT(*)) OVER()`) se mantiene exacta.
Si al tocar estas queries `SUM(job_count) != total_matching_jobs`, es un
bug real, no una diferencia esperada.

## Umbrales de "muestra pequeña" — señal visual, no exclusión de datos

- `SalaryChart` — con menos de **5 ofertas** en una combinación
  país×rol, la barra se muestra con opacidad reducida y un aviso "⚠
  muestra pequeña" en el tooltip (`MUESTRA_PEQUEÑA_THRESHOLD`,
  `SalaryChart.jsx`). El dato se sigue mostrando — no se oculta.
- `SkillHeatmap`/`heatmapUtils.js` — una skill sobrevive en la matriz
  solo si co-ocurre con al menos `minDegree` (2 por defecto) otras
  skills del conjunto, cada una respaldada por al menos `minEdgeCount`
  (2 por defecto) ofertas reales (k-core). Con conjuntos muy pequeños
  (≤4 candidatas) se usa el criterio original (≥1 conexión) — un umbral
  de grado 2 sería desproporcionado con tan pocas skills.

## Ver también

- `spec/constitution/tech-stack.md` — stack y convenciones de código.
- `spec/features/015-business-logic-audit/015-spec.md` — auditoría que
  originó la mayoría de estas reglas, con la evidencia completa de cada
  verificación en vivo.
