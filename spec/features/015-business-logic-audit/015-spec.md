# 015 · Auditoría de semántica de negocio y cierre de deuda técnica

**Estado:** hecho ✅

> Séptima ronda "tabla por tabla" (tras 008-014), pero distinta: cierra
> la fase 2 del roadmap auditando la semántica de negocio que comparten
> todas las gráficas/KPIs (no una gráfica más), y cierra explícitamente
> la deuda técnica diferida en las 7 rondas anteriores antes de saltar a
> la fase 3 (rediseño).

## Contexto

El roadmap del proyecto tiene 4 macro-fases: (1) implementación de Halo
— hecha, features 001-007; (2) auditoría de calidad "tabla por tabla" de
cada gráfica y KPI — casi completa, features 008-014; (3) rediseño total
de la página para optimizar velocidad y experiencia de usuario — futuro,
sin spec todavía; (4) pulido responsive — backlog.

Las 7 rondas de la fase 2 (008-014) auditaron cada gráfica **por
separado**: sus datos, su query, su UX, sus filtros. Lo que no se ha
hecho nunca es ponerlas **una al lado de la otra** y preguntar si, como
conjunto, cuentan una historia consistente. El ejemplo que motiva esta
feature: si una oferta se publicó en enero y sigue activa en agosto,
¿en qué mes aparece en "evolución mensual de ofertas"? ¿Solo en enero?
¿En los ocho? ¿Y "ofertas activas" en el KPI del hero significa lo mismo
que "activas" en la card de salario o en la de skills demandadas? Según
la respuesta, gráficas que parecen coherentes por separado podrían estar
midiendo preguntas de negocio distintas sin que nada lo señale.

Esta feature audita esa semántica cruzada — no solo fechas, también
salario (unidad, umbral de calidad, outliers, jornada, moneda) — y de
paso cierra explícitamente todo lo que quedó pendiente/diferido en las
features 001-014, para no arrastrar deuda sin resolver a la fase 3
(rediseño). Es la última ronda de la fase 2 antes de saltar a rediseño.

**No se toca ningún aspecto visual.** Es una auditoría de lógica,
datos y documentación — el mismo mandato de las rondas 008-014.

---

## 1. Semántica temporal — ¿qué significa "activa" y "cuándo cuenta"?

### 1.1. Lo que el código hace hoy (confirmado leyendo cada query)

| Endpoint / KPI | Filtro de fecha | Columna usada | `is_active` |
|---|---|---|---|
| `buildFilters` (base de 6 endpoints) | `periodo` (30d/90d/180d/**all**=sin filtro) | `posted_at` | Siempre `TRUE`, incondicional |
| `GET /api/jobs/demand-by-role` ("evolución mensual") | El de `buildFilters` | Agrupa por `DATE_TRUNC('month', posted_at)` | `TRUE` |
| `GET /api/stats/summary` → `total_active_jobs` | Ninguno | — | `TRUE` |
| `GET /api/stats/summary` → `median_salary_90d` | Fijo, 90 días (no parametrizable) | `posted_at` | `TRUE` |
| `GET /api/stats/summary` → `top_skills_30d` | Fijo, 30 días (no parametrizable) | `posted_at` | `TRUE` |
| `GET /api/stats/summary` → `last_updated` | — | `MAX(last_seen_at)` (fase 014) | `TRUE` |
| `GET /api/skills/top` / `GET /api/skills/cooccurrence` | El de `buildFilters` + fallback a 90 días si `periodo` está ausente (nunca si vale `all`) | `posted_at` | `TRUE` |

**Decisión oficial — "evolución mensual" atribuye cada oferta a su mes
de publicación, una sola vez, nunca se reparte entre los meses en que
siguió activa.** No es un defecto: la tabla `jobs` no registra ninguna
fecha de cierre/desactivación, solo `last_seen_at` (última vez vista en
el scraping) y un booleano `is_active`. No hay forma de reconstruir "en
qué meses estuvo viva" una oferta salvo su mes de publicación — cualquier
otra semántica ("repartir la oferta en cada mes activo") exigiría un
dato que no existe, así que la implementación actual es la única
correcta dado el dato disponible. Se documenta explícitamente para que
quede claro que es una decisión informada, no un descuido. La nota ya
existente en `DemandByRoleChart.jsx` ("el último mes mostrado puede
estar incompleto: las ofertas se siguen indexando de forma continua")
sigue siendo la advertencia correcta y se mantiene.

**Decisión oficial — "ofertas activas" no significa la misma ventana en
cada KPI, y eso es correcto, no una inconsistencia.** `total_active_jobs`
responde "¿cuántas ofertas hay ahora mismo en el radar?" (sin ventana:
toda oferta con `is_active = TRUE`, sin importar su antigüedad).
`median_salary_90d`/`top_skills_30d` responden preguntas distintas
("¿cuánto se paga *recientemente*?", "¿qué se pide *ahora mismo*?") que
necesitan una ventana corta para no arrastrar ofertas de hace meses que
distorsionen una foto del "presente". Cada ventana está atada a la
pregunta de negocio que responde, no elegida al azar — se documenta esta
tabla para que la próxima persona que toque el código entienda por qué
`/api/stats/summary` tiene 3 ventanas distintas dentro de la misma
respuesta en vez de una sola.

### 1.2. Verificado en vivo — el corte de ~90-98 días queda confirmado con medición directa

Las fases 013 y 014 repetían, sin una medición directa citada, que
"ninguna oferta activa supera ~90-98 días de antigüedad" — la evidencia
existente era indirecta (un índice con ~93-97% de selectividad, y una
coincidencia de medianas de salario con/sin ventana de 6 meses). Query
ejecutada contra la BD real (2026-08-13, 228.673 ofertas activas):

```sql
SELECT
  MIN(posted_at) AS oldest_posted_at,
  NOW() - MIN(posted_at) AS max_age,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY NOW() - posted_at) AS p95_age,
  PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY NOW() - posted_at) AS median_age,
  COUNT(*) FILTER (WHERE posted_at < NOW() - INTERVAL '90 days') AS older_than_90d,
  COUNT(*) FILTER (WHERE posted_at < NOW() - INTERVAL '98 days') AS older_than_98d
FROM jobs WHERE is_active = TRUE;
```

**Resultado real:**

| Métrica | Valor |
|---|---|
| Oferta activa más antigua (`posted_at`) | 2026-05-15 (≈90 días antes de la fecha de esta verificación) |
| Edad mediana | 42.1 días |
| Edad p95 | 84.4 días |
| Ofertas activas con >90 días de antigüedad | 212 de 228.673 (0.09%) |
| Ofertas activas con >98 días de antigüedad | **0** |

**Confirmado con medición directa, no ya por inferencia**: el corte
estructural existe, es real, y es más ajustado de lo que sugería la cita
repetida ("~90-98 días" era correcto como rango, con el límite duro
exactamente en 98). Se sustituye la evidencia indirecta de fases 013/014
por esta medición directa en `statsQuery.js` y en esta spec.

**Hallazgo adicional, no buscado pero relevante para 1.3**: las 10
ofertas activas más antiguas (todas de Italia, `posted_at` idéntico
2026-05-15T07:29:06Z) tienen `first_seen_at = last_seen_at =
2026-05-20T05:17:27Z` — es decir, se vieron en el scraping **una única
vez**, hace ~85 días respecto a `last_seen_at`, y sin embargo seguían
`is_active = TRUE` en el momento de esta consulta. Esto demuestra que
`is_active` **no** se mantiene en `TRUE` porque el pipeline siga viendo
la oferta recientemente — se mantiene activa durante toda su ventana de
~90-98 días desde `posted_at` con independencia de cuándo fue la última
vez que se confirmó su existencia. Ver 1.3 para la implicación.

### 1.3. Semántica de `is_active` — límite conocido, ahora más preciso

El mecanismo exacto por el que una fila pasa de `is_active = TRUE` a
`FALSE` vive en el pipeline de ingesta (`transform.py` y compañía), que
**no está en este repositorio** (confirmado: cero archivos `.py` en todo
el repo). No es auditable ni corregible desde aquí — sigue siendo un
límite conocido y aceptado del proyecto, no un hallazgo a resolver.

La verificación en vivo de 1.2 sí permite precisar **qué no es**: no es
"activa mientras se siga viendo en el scraping" — hay ofertas activas
cuyo `last_seen_at` lleva ~85 días congelado (una sola pasada de
scraping, nunca vuelta a confirmar) y siguen `is_active = TRUE`. El
patrón observado es consistente con una ventana fija de ~90-98 días
desde `posted_at`, aplicada con independencia de si la oferta se ha
vuelto a ver o no. Es una inferencia razonada a partir de datos reales
(no una lectura del código del pipeline, que sigue sin ser accesible),
pero ahora apoyada en evidencia directa en vez de solo en la
selectividad de un índice.

### 1.4. Pregunta abierta que se deja explícitamente fuera

La fase 013 ya se planteó si `periodo=all` debería incluir también
ofertas con `is_active = FALSE` (hoy nunca las incluye — `is_active =
TRUE` es incondicional en `buildFilters`) y lo dejó fuera por ser "un
cambio de semántica mayor". Se reconfirma la misma decisión aquí: el
dashboard es una foto del mercado *actual* (mission.md: "tendencias
geográficas en tiempo real"), no un archivo histórico de ofertas
cerradas — incluir inactivas cambiaría el propósito del producto, no
solo un filtro. Queda fuera de alcance, con esta razón documentada por
primera vez de forma explícita (antes solo estaba en las tasks de la
fase 013).

---

## 2. Semántica de salario

### 2.1. Unidad asumida: anual — verificado en vivo, confirmado

No existe ningún campo de unidad (hora/mes/año) en `schema.sql` — la UI
(`SalaryChart.jsx`, tooltips, títulos) asume "anual" sin que existiera
una verificación numérica documentada en ninguna spec anterior.
Percentiles reales de `salary_mid` por país (activas, declarado,
`salary_is_predicted = FALSE`, 2026-08-13):

| País | n | p05 | p50 (mediana) | p95 | p99 | máximo |
|---|---|---|---|---|---|---|
| AT | 363 | 3.845 | 60.000 | 119.140 | 438.930 | 476.910 |
| BE | 46 | 426 | 47.500 | 137.350 | 187.200 | 187.200 |
| DE | 22.278 | 16.512 | 57.000 | 90.000 | 115.000 | 475.000 |
| ES | 3.972 | 33.000 | 80.000 | 150.000 | 206.450 | 496.928 |
| FR | 28.905 | 164 | 40.000 | 62.500 | 85.000 | 1.904.448 |
| IT | 569 | 42 | 28.800 | 67.500 | 158.122 | 352.560 |
| NL | 1.961 | 600 | 51.480 | 102.000 | 500.000 | 500.000 |
| PL | 27.435 | 9.544 | 37.940 | 93.966 | 129.649 | 306.010 |

**Confirmado**: las medianas (28.800€-80.000€) son consistentes con
salarios **anuales** de perfiles tech en estos países — un salario por
hora rondaría decenas, uno mensual, miles; nada en el orden de
magnitud de "decenas de miles" salvo una cifra anual. La asunción de la
UI queda verificada con datos reales, no solo asumida. La cola baja
(p05 con valores como 164€ en FR o 42€ en IT) es la misma zona que
cubre el umbral de calidad de 1.000€ — ver 2.2. La cola alta (máximos de
hasta 1,9M€) se trata en 2.3.

**Nota de negocio de paso**: la mediana de España (80.000€) es la más
alta de las 8, por encima incluso de Alemania (57.000€) — con `n=3.972`
no es un caso aislado. No es un bug (no hay ninguna condición que
debiera igualarlas), pero es un dato a tener en cuenta si en el futuro
se compara "coste de vida" vs. "salario tech" por país: el dataset no
pretende ser representativo del mercado laboral general de cada país,
solo de las ofertas indexadas por Adzuna con salario declarado.

### 2.2. Umbral de calidad: `salary_mid >= 1000` — verificado, confirmado con matiz

Hasta ahora solo se justificaba como "datos corruptos del pipeline"
(`salaryQuery.js`), sin distribución real citada. Distribución real de
`salary_mid < 5000€` en tramos de 500€ (activas, declarado, no
predicho):

| Tramo (€) | n |
|---|---|
| 1-495 | 3.216 |
| 500-996 | 589 |
| 1.000-1.488 | 1.022 |
| 1.500-1.996 | 377 |
| 2.000-2.481 | 623 |
| 2.500-2.964 | 891 |
| 3.000-3.494 | 404 |
| 3.500-3.954 | 117 |
| 4.000-4.497 | 97 |
| 4.500-4.988 | 155 |

Y en conjunto: 3.805 filas por debajo de 1.000€, 1.399 entre 1.000-2.000€,
2.287 entre 2.000-5.000€, 78.038 por encima de 5.000€ (total 85.529
filas con salario declarado y no predicho).

**No hay un vacío/salto limpio exactamente en 1.000€** — la distribución
por debajo de 5.000€ es una cola continua, no dos poblaciones separadas
por un hueco claro. Pero la muestra de las filas por debajo de 1.000€
sí confirma que son datos corruptos, con un patrón concreto y
repetido, no solo "números bajos": títulos como *"Staff Software
Engineer"*, *"Principal Software Engineer"*, *"Senior Product Manager"*
aparecen con `salary_min`/`salary_max` como `(900, 1020)`, `(840,
1140)`, `(900, 960)` — rangos casi idénticos al par min/max multiplicado
por 100 daría cifras perfectamente plausibles para esos puestos senior
(90.000-102.000€, 84.000-114.000€, 90.000-96.000€). El patrón es
consistente con un error de escala en el origen (un factor ~100 perdido
en algunos registros), no con salarios por hora o mes mal etiquetados
como anuales completos.

**Decisión**: se mantiene el umbral en 1.000€. No baja el umbral porque
no hay una frontera "natural" distinta que lo justifique mejor (la cola
es continua); no lo sube significativamente porque el objetivo del
filtro es excluir corrupción evidente, no truncar salarios junior
legítimos que empiecen, por ejemplo, en 18.000-25.000€ — subirlo a
5.000€ o más no ganaría precisión adicional (la corrupción ya identificada
está muy por debajo de esa cifra) y sí arriesgaría cortar datos válidos
si algún país/rol tuviera salarios legítimos más bajos de lo esperado.
Se documenta con esta evidencia real en vez de solo la frase genérica
anterior — el valor no cambia, pero deja de ser una afirmación sin
respaldo.

### 2.3. Outliers — techo superior: confirmados y corregidos con un techo dirigido

No existía ningún tope máximo de `salary_mid`, solo el suelo `>= 1000`.
Verificación ampliada (la muestra inicial de "top 10" se quedaba corta —
solo mostraba las primeras filas del cluster real):

**32 ofertas activas** cumplen a la vez `salary_min = salary_max` (rango
plano, no un min/max real) **y** `contract_time IS NULL` (jornada sin
declarar) **y** `salary_mid >= 500.000`:

- **31 ofertas de NL, las 31 con el valor idéntico 500.000€**, repartidas
  en decenas de títulos sin relación entre sí (AI Engineer, Business
  Analyst ×2, Test Engineer, Project Manager, GoLang Developer, Senior
  DevOps Engineer, Azure Databricks Engineer...). Un mismo valor exacto y
  redondo, repetido 31 veces en roles sin ninguna relación salarial
  esperable entre sí, es la firma de un tope/placeholder del origen, no
  de 31 coincidencias reales.
- **1 oferta de FR a 1.904.448€** — *"Formation Monteur Réseaux H/F"*
  (formación de instalador de redes, un puesto de entrada), incompatible
  por completo con el rol.

**Control de que el techo es quirúrgico, no una simple cifra de corte
plana** — se comprobó específicamente que el mismo patrón estructural
(`salary_min = salary_max`, `contract_time` sin declarar) **por debajo**
de 500.000€ no muestra la misma señal de corrupción: valores como
360.000€ (técnico de soporte, FR), 244.172€ (Travel Advisor, PL),
207.745€ (Senior AI Automation Engineer, PL) o 200.000€ (QA Engineer,
NL) son altos pero **no duplicados idénticos entre roles dispares** —
sin evidencia de que sean corruptos, se dejan intactos. También se
confirmó que el máximo real más alto fuera de este cluster (España,
496.928€, valor único, no duplicado) queda justo por debajo del corte de
500.000€, así que el techo no recorta ningún salario alto pero legítimo
detectado.

**Decisión confirmada**: se añade un techo dirigido —
no un número de corte plano aplicado a todo `salary_mid`, sino
exactamente la combinación de los 3 factores que identifican el cluster
corrupto — como 4ª condición de `salaryQualityConditions()`
(`salaryQuery.js`), heredada automáticamente por
`GET /api/salary/by-role-country` y las dos subconsultas de salario de
`GET /api/stats/summary` (`pct_with_salary`, `median_salary_90d`), sin
duplicar la regla. Efecto: 32 filas menos sobre ~85.500 con salario
declarado (0.04%) — imperceptible en cualquier agregado, pero elimina
por completo la contaminación del extremo superior en NL, donde más se
notaba en `avg_salary_eur` (dato mostrado en el tooltip de
`SalaryChart`, más sensible a outliers que la mediana).

**Verificado en vivo tras implementar**: exactamente 32 filas excluidas
en todo el dataset (81.724 → 81.692 con salario declarado y verificado),
igual al conteo del cluster identificado. En Países Bajos, único país
con outliers en este cluster, `avg_salary_eur` pasa de 65.582€ (n=1.841)
a 58.142€ (n=1.810) — una caída del 11.3%, confirmando que estos 31
valores idénticos de 500.000€ sí estaban inflando de forma significativa
el dato de media que se muestra en el tooltip. Ningún otro país se ve
afectado (0 filas excluidas fuera de NL/FR).

### 2.4. `jornada` (`contract_time`) y comparabilidad — verificado, confirma que SÍ hace falta la nota

`jornada` se aplica como filtro real en `SalaryChart` (a diferencia de
otras gráficas donde se ignora deliberadamente), pero — a diferencia de
`contrato`, que sí tiene una nota explicativa cuando está activo — no
existía ninguna advertencia de que un salario de `part_time` puede ser
menor sin que el rol esté "peor pagado" en términos comparables.
Mediana real por `contract_time` (activas, declarado, `salary_mid >=
1000`):

| `contract_time` | n | mediana |
|---|---|---|
| `full_time` | 45.970 | 50.000€ |
| (sin declarar) | 35.301 | 42.500€ |
| `part_time` | 453 | 25.002€ |

La mediana de `part_time` es casi exactamente la mitad de `full_time`
(25.002€ vs. 50.000€) — consistente con que el dato **sí viene
pro-rateado** a la jornada real (no es "el mismo salario anual
completo, pero mal etiquetado"), y confirma exactamente el riesgo que
motivaba este punto: mezclar ambas jornadas sin avisar haría parecer que
un rol "paga menos" cuando en realidad una parte de esas ofertas son de
media jornada.

**Fix de esta feature**: añadir `notaJornada` en `SalaryChart.jsx`,
mismo patrón que `notaContrato` (`SalaryChart.jsx:170-173`), visible
solo cuando `filters.jornada !== "Todos"`, con texto basado en esta
evidencia real (p. ej. "Los salarios de jornada parcial son
proporcionalmente menores — no indican que el rol esté peor pagado").

### 2.5. Moneda — EUR única

Documentado en `schema.sql` como decisión de diseño ("todos los países
usan EUR, sin conversión necesaria") reforzada por un `CHECK` en
`countries`. No es verificable contra la API cruda de Adzuna desde este
repo (no hay acceso a la respuesta original, solo a la BD ya
transformada). Se documenta como asunción de diseño heredada del
pipeline, aceptada sin evidencia adicional posible desde aquí — no es
una laguna accionable.

### 2.6. Bruto / neto

Cero menciones en todo el proyecto. No hay ningún campo que lo indique y
no es derivable de los datos existentes. Se documenta como limitación
conocida y aceptada — no accionable sin cambiar la fuente de datos.

### 2.7. `salary_is_predicted`

Confirmado en la fase 014: en producción, ninguna oferta activa tiene
`salary_is_predicted = TRUE` — es una condición defensiva en el código
(protege contra datos que el pipeline podría marcar así en el futuro),
no un caso vivo hoy. Se documenta así explícitamente para que quede
claro que la condición no es dead code aunque no excluya nada
actualmente.

---

## 3. Deuda técnica — cerrada en esta feature

| # | Ítem | Feature de origen | Resultado en esta feature |
|---|---|---|---|
| 1 | `idx_jobs_salary_by_role_country` nunca aplicado contra la BD real | 010 | **Aplicado** (117.6s, sin timeout) |
| 2 | `idx_jobs_demand_by_role` nunca aplicado contra la BD real | 011 | **Aplicado** (33.6s) |
| 3 | Ampliación de `idx_jobs_active_summary` con `company`/`role_category` (fase 014, 3 intentos fallidos) | 014 | **Aplicado** (DROP 157ms + CREATE 17.8s, sin timeout). El bloqueo de conexión de fases anteriores no se repitió — no hizo falta ningún script consolidado nuevo; `010-apply-index.sql`/`011-apply-index.sql` quedan marcados como aplicados (registro histórico) |
| 4 | 6 vistas SQL en `schema.sql` sin usar por ningún endpoint (`v_offers_by_country`, `v_salary_stats_by_country`, `v_remote_pct_by_country`, `v_job_trends_monthly`, `v_skill_cooccurrence`, `v_skills_with_market_context`) | 013 (candidato señalado, nunca ejecutado) | **Eliminadas** de `schema.sql` y de la BD real. `v_job_trends_monthly` en concreto ni siquiera filtraba `is_active`, así que además de muerta era incorrecta si algo la hubiera reactivado |
| 4b | Hallazgo nuevo durante la limpieza: **2 vistas más** (`v_demand_by_role_monthly`, `v_salary_by_role_country`) ya retiradas de `schema.sql` en fases 011/010 respectivamente, pero nunca borradas de la BD real por el mismo bloqueo de conexión de esa época | 010, 011 | **Eliminadas** de la BD real (`schema.sql` ya no las declaraba) |
| 5 | `v_salary_stats_by_country` sin el filtro `salary_mid >= 1000` (inconsistente con `salaryQualityConditions`) | 010 (señalado, no corregido) | Resuelto al eliminarse en el punto 4 — no hacía falta parchear una vista que no usa nadie |
| 6 | `useHeatmapData.js` sin `AbortController` (mismo problema que `useChartData`, resuelto ahí en fase 010, este hook quedó fuera) | 010 (señalado como "fuera de alcance", nunca vuelto a tocar) | **Añadido** `AbortController`, mismo patrón que `useChartData.js` (+ `signal` nuevo en `getSkillCoOccurrence`, que no lo tenía) |
| 7 | `api/_diag_remote2.mjs` — script suelto sin trackear, residuo de una investigación descartada de esta misma sesión (modelo híbrido) | — (housekeeping, no una feature) | Borrado durante el planning de esta feature |
| 8 | `devCache.js` — caché temporal en disco, condición de retirada ("cuando ya no haga falta") sin re-evaluar desde que se creó | 010 | Re-evaluado con evidencia fresca (ver 3.1) — se mantiene, decisión documentada explícitamente en el propio archivo |
| 9 | Outliers de salario sin techo (32 filas corruptas: 31×500.000€ en NL + 1×1.904.448€ en FR) | — (hallazgo nuevo de esta feature, no anticipado) | **Corregido** con un techo dirigido en `salaryQualityConditions()` |

### 3.1. `devCache.js` — ¿se retira ya?

La condición documentada para quitarlo era "cuando ya no haga falta".
Evidencia de esta misma sesión: varias queries de diagnóstico contra la
BD real tardaron entre 15s y 45s incluso para conteos simples. La BD
real sigue siendo lenta/inestable bajo uso interactivo repetido
(recargas, pruebas de filtros) — la condición de retirada **no se
cumple todavía**. Se mantiene, con esta re-confirmación documentada y
fechada, para que la próxima revisión (fase 3, rediseño, cuando es
probable que el propio rendimiento del backend se aborde de raíz) tenga
un punto de partida claro en vez de tener que releer toda la fase 010.

---

## 4. Deuda técnica — sigue diferida (con razón explícita)

| Ítem | Feature de origen | Por qué se deja fuera de esta feature |
|---|---|---|
| Dedupe estructural `FilterDrawer`/`FilterSheet` | 001 | Cambio de estructura visual/de componentes — pertenece a una fase de diseño (3 o 4), no a una auditoría de lógica |
| Rediseño de la paleta `ROLE_COLORS` | 010 | Mismo motivo — es Halo/visual, no lógica de negocio |
| "Chart de tendencias" (idea de producto nueva) | 012 | No es un bug ni una inconsistencia — es una idea de alcance nuevo, candidata para cuando se decida el contenido de la fase 3 (rediseño) |
| Selector manual de skills tipo `RoleSelector` | 013 | Idea de UX nueva, no un defecto — mismo motivo que el ítem anterior |
| Categoría "Soft" en el filtro de skills | 013 | Sin datos reales que la usen todavía — no accionable hoy, se revisita si el dataset cambia |
| Verificación de bloqueo de scroll en iOS Safari | 004 | Bloqueado por el entorno (sin Safari disponible); no es una decisión de negocio, es una limitación de verificación |
| Índice dedicado para `/api/skills/cooccurrence` (30-33s) | 013 | Es una mejora de rendimiento, no de corrección — mismo criterio que la tabla resumen materializada |
| Índices para `total_skills`/`top_skills_30d` en `/api/stats/summary` | 014 | Igual — rendimiento, no corrección; candidatas ya documentadas a una tabla resumen materializada, cambio de arquitectura mayor que no cabe en esta auditoría |
| Tabla resumen materializada (`/api/skills/top`, `/api/stats/summary`) | 013 | Cambio de arquitectura, no de lógica — si el rendimiento sigue siendo un problema real tras esta feature, se evalúa como proyecto propio |
| Naming `src/test/setup.js` vs `src/tests/` | 001 | Cosmético, sin riesgo, sin urgencia — no forma parte de la semántica de negocio que motiva esta feature |
| Componentes `button.jsx`/`table.jsx` de shadcn sin usar | 001 | Igual — cosmético, cero riesgo, no es lógica de negocio |

---

## 5. Reconciliación de totales entre gráficas y KPIs (ronda 2)

Tras cerrar las secciones 1-4, surgió la pregunta directa: *"¿estamos
seguros que ahora todas nuestras tablas cumplen toda la semántica y lógica
de negocio?"* — la respuesta honesta era que las secciones 1-2 auditaron a
fondo las dos áreas señaladas como ejemplo (fechas y salario), pero nunca
se hizo una comprobación explícita de que **los "totales" que muestran
distintas gráficas/KPIs bajo el mismo estado de filtros sean coherentes
entre sí**, que es justo la preocupación original que motivó toda la
feature. Esta sección documenta esa comprobación, hecha con queries reales
contra la BD (no solo lectura de código), comparando cada endpoint que
expone algún campo `total_matching_jobs`/`total_active_jobs`.

### 5.1. Mapa completo de qué filtra cada endpoint

| Endpoint | Filtros que aplica | Condiciones extra propias |
|---|---|---|
| `stats/summary` (KPIs del hero) | **Ninguno** — ignora el sidebar por completo | — |
| `jobs/offers-by-country` (mapa) | periodo, contrato, jornada, remote (país se ignora a propósito: el mapa necesita todos los países) | — |
| `jobs/demand-by-role` | país, periodo, contrato, jornada, remote | `role_category IS NOT NULL` |
| `salary/by-role-country` | país, periodo, contrato, jornada, remote | `role_category IS NOT NULL` + `salaryQualityConditions()` |
| `skills/top` | país, periodo, contrato, remote (**jornada se ignora**, con aviso ⓘ en la UI) | — |
| `skills/cooccurrence` | solo periodo (**país/contrato/jornada/remote se ignoran**, con aviso ⓘ) | — |

### 5.2. Verificación en vivo — coinciden exactamente donde deberían

Con los filtros por defecto del dashboard (`periodo = "Últimos 90 días"`,
el resto en "Todos"), 228.673 ofertas activas en total:

```
stats.total_active_jobs (global, sin periodo)  → 228.673
EuropeMap        (is_active + periodo 90d)      → 228.430
TopSkillsChart   (misma condición, countQuery)  → 228.430  ✅ idéntico
SkillHeatmap     (misma condición, ignorando el resto) → 228.430  ✅ idéntico
```

Tres queries escritas por separado en tres archivos distintos
(`index.js`, `skillsQuery.js`, `index.js` de nuevo para cooccurrence)
llegan al mismo número exacto. Con `jornada = "Full time"` activo:

```
EuropeMap (SÍ aplica jornada)      → 92.215
TopSkillsChart (jornada IGNORADA)  → 228.430  (idéntico al caso sin filtro — confirma que el ignore funciona)
```

Con `país = "DE"` activo:

```
skills/top (SÍ aplica país)        → 72.205
SkillHeatmap (país IGNORADO)       → 228.430  (idéntico — confirma el ignore)
```

Aritmética interna — `SUM(job_count)` de todas las filas devueltas debe
coincidir con el `total_matching_jobs` de la misma respuesta (window
function `SUM(COUNT(*)) OVER()`):

```
demand-by-role:        suma de filas 211.766 = total declarado 211.766  ✅
salary/by-role-country: suma de filas  75.075 = total declarado  75.075  ✅ (incluye el techo de outliers nuevo de esta misma fase, no lo rompió)
```

Granularidad — pese a que unos endpoints usan ventana de 90 días y otros
ninguna, nada desaparece invisible por el recorte temporal:

| | Global (sin ventana) | Dentro de 90 días |
|---|---|---|
| Roles (`role_category` distintos) | 16 | 16 |
| Skills distintas | 478 | 478 |
| Países con ofertas | 8 | 8 |

`total_skills` del KPI (`COUNT(DISTINCT)` vía `JOIN`) y el mismo cálculo
con la lógica de `GET /api/skills/list` (`EXISTS` correlacionado) también
coinciden exactos: 478 = 478 — dos formulaciones SQL distintas de la
misma regla de negocio, verificadas equivalentes.

`pct_with_salary`: 81.692 ofertas con salario de calidad / 228.673
activas = 35,7% — coincide exacto con lo que se muestra.

**Conclusión de 5.2**: no se encontró ningún caso donde dos endpoints
debieran dar el mismo número y no lo dieran. Todas las divergencias
encontradas son intencionadas y ya estaban documentadas (ventanas de
fecha distintas por pregunta de negocio, filtros ignorados con aviso ⓘ,
`role_category`/salario como subconjuntos legítimamente más pequeños).

### 5.3. El único hallazgo real — comunicación, no dato incorrecto

`GET /api/stats/summary` no acepta ningún filtro (diseño deliberado de
la fase 014, documentado en el código: *"representa el estado completo
de la base de datos, independientemente de lo que el usuario tenga
filtrado"*) — `SummaryStats.jsx` ni siquiera recibe `filters` como prop.
Confirmado en vivo: es la única sección del dashboard que no cambia al
filtrar (el mapa y las 3 gráficas de abajo sí lo hacen). El único lugar
donde esto se explicaba era un comentario JSX en `MainContent.jsx`
("KPI cards: indicadores globales, independientes de los filtros") —
visible solo para quien lee el código, no para quien usa la página.

Sin ningún texto en pantalla, un usuario que filtre por un país podría
ver que "Empresas analizadas: 23.248" no cambia y leerlo como que el
filtro no funciona, en vez de la lectura correcta (es el mercado global,
el filtro sí se aplica más abajo).

**Decisión**: se añade una nota breve bajo la fila de
KPIs — *"Datos globales del mercado — no varían con los filtros."* — en
`SummaryStats.jsx`, mismo patrón visual que el aviso de carga lenta ya
existente en el mismo componente.

---

## Fuera de alcance

- Cualquier cambio visual — sigue vigente la regla general del proyecto
  (`AGENTS.md`), sin ninguna excepción esta vez (a diferencia de la fase
  014, que tuvo una excepción puntual para la landing).
- El rediseño de arquitectura (tabla resumen materializada, reestructura
  del dashboard) — es contenido de la fase 3, no de esta.
- Cualquier decisión que dependa de datos que no existen en este repo
  (moneda real de origen, mecanismo exacto de `is_active`, bruto/neto) —
  se documentan como límites conocidos, no se inventan.

## Criterios de aceptación

- [x] La tabla de ventanas de fecha por KPI/endpoint (sección 1.1) está
      documentada y verificada línea a línea contra el código real.
- [x] Se ejecutó en vivo la query de edad máxima de ofertas activas
      (sección 1.2) y el resultado quedó documentado (confirma el
      "~90-98 días" repetido en fases 013/014, con medición directa: 0
      ofertas superan 98 días).
- [x] Se ejecutó en vivo el sanity check de unidad de salario (2.1) y la
      distribución que justifica el umbral de 1000€ (2.2), con
      resultados documentados.
- [x] Se investigaron outliers de salario por el lado alto (2.3) — 32
      filas corruptas identificadas y excluidas con un techo dirigido en
      `salaryQualityConditions()`, verificado en vivo (avg NL: -11.3%).
- [x] `SalaryChart.jsx` muestra una nota explicativa cuando `jornada` no
      es "Todos", igual que ya hace con `contrato`.
- [x] Las 6 vistas SQL sin usar se eliminan de `schema.sql` (+ 2 vistas
      adicionales de fases 010/011 que nunca se habían podido borrar de
      la BD real — hallazgo de esta misma verificación).
- [x] `useHeatmapData.js` usa `AbortController` igual que `useChartData.js`.
- [x] Se reintentan en vivo los 3 índices pendientes (010, 011, ampliación
      014) — **los 3 se aplicaron con éxito** contra la BD real (sin
      timeout esta vez); no hace falta ningún script consolidado nuevo.
- [x] `devCache.js` se mantiene, con la re-confirmación de la sección 3.1
      documentada.
- [x] Todos los ítems de las secciones 3 y 4 quedan reflejados en
      `roadmap.md` con su estado final (cerrado / diferido y por qué).
- [x] Reconciliación de totales entre gráficas y KPIs (sección 5) hecha
      con queries reales, no solo lectura de código — verificado que
      EuropeMap/TopSkillsChart/SkillHeatmap coinciden exactos bajo los
      mismos filtros, que los filtros ignorados están realmente
      ignorados (y avisados con ⓘ), y que la aritmética interna de cada
      endpoint (`SUM(job_count) == total_matching_jobs`) cuadra.
- [x] El único hallazgo real de la sección 5 (KPIs globales sin ningún
      texto que lo aclare en pantalla) resuelto con una nota en
      `SummaryStats.jsx`.
- [x] `npx vitest run` (frontend y `api/`) al 100%.
- [x] `npm run build` sin errores.
- [x] `.env.local` nunca leído ni impreso.
