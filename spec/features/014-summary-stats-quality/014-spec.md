# 014 · Auditoría — KPI cards y stats de la landing

**Estado:** hecho ✅

> Séptima ronda "tabla por tabla" (tras 008/009/010/011/012/013). A
> diferencia de las anteriores, no audita una gráfica del dashboard sino
> las 5 KPI cards del hero (`src/components/layout/SummaryStats.jsx`) y,
> por primera vez con permiso explícito y acotado, un fragmento de la
> landing (`src/components/landing/LandingPage.jsx`): su bloque de 3
> stats en tiempo real ("Ofertas activas" / "Países cubiertos" / "Skills
> rastreadas"). Ambos consumen el mismo endpoint,
> `GET /api/stats/summary` (`api/src/index.js`). No es parte del
> rediseño Halo.

## Metodología

Auditoría de solo lectura del frontend (`SummaryStats.jsx`,
`LandingPage.jsx`, `jobServices.js`, `App.jsx`), del backend
(`api/src/index.js`) y del schema (`api/schema.sql`), con verificación en
vivo contra la BD real: conteos exactos, `EXPLAIN (ANALYZE, BUFFERS)` y
timing directo de la query, vía un script temporal (`_stats-audit-tmp.mjs`)
borrado al terminar la investigación. `.env.local` no se ha leído ni
impreso en ningún momento.

## Qué hace

8 hallazgos:

1. **Rendimiento — la query más lenta detectada en todo el proyecto
   hasta ahora**: `GET /api/stats/summary` tarda **22,7s** medida en
   directo contra la BD (sin caché) y **56,1s** bajo
   `EXPLAIN ANALYZE` — más lenta que el peor caso ya documentado en la
   fase 013 (`skills/top`, 7,4s tras su fix). Se ejecuta sin ningún
   filtro (todo el dataset activo: 227.160 ofertas) y es literalmente lo
   primero que carga cualquier visitante (landing) y lo primero que
   carga el dashboard (fila de KPI cards). `EXPLAIN ANALYZE` confirma que
   ningún índice existente cubre esta query:
   - La subconsulta de `total_skills` hace un `Nested Loop` sobre las
     244.026 filas de `job_skills`, cada una con un lookup por PK a
     `jobs` (con `Memoize`, 60,6% de aciertos) — **36,3s** solo esta
     parte.
   - El resto de la agregación (`total_active_jobs`,
     `total_countries`, `pct_with_salary`, `last_updated`) escanea
     `idx_jobs_country`, que no es parcial ni cubre
     `salary_mid`/`salary_is_predicted`/`posted_at` — heap fetch en
     prácticamente cada una de las ~247.326 filas examinadas — **19,7s**
     más.
   - Ninguno de los índices ya creados en fases 010/011/013
     (`idx_jobs_active`, `idx_jobs_active_posted_at`) sirve aquí: son
     parciales por `is_active` pero no incluyen las columnas que esta
     query necesita agregar.
2. **La misma petición cara, duplicada en la primera visita — una de las
   dos siempre desperdiciada**: `LandingPage.jsx` y `SummaryStats.jsx`
   llaman a `getSummaryStats()` de forma completamente independiente,
   cada uno en su propio `useEffect` al montar (confirmado en `App.jsx`:
   el dashboard no existe en el DOM mientras la landing está activa, así
   que no hay dos peticiones en paralelo *al cargar la página*). El
   problema es la transición: `handleEnter` desmonta la landing solo
   ~600ms después del clic en "Comenzar", un tiempo insignificante frente
   a los 22-56s del hallazgo 1 — así que, en la práctica, casi cualquier
   usuario dispara la petición de `SummaryStats` mientras la de
   `LandingPage` sigue en vuelo. Cuando esta última resuelve, lo hace
   sobre un componente ya desmontado (`getSummaryStats` no admite
   `AbortController`, a diferencia de las 4 gráficas que sí lo usan desde
   la fase 010) — trabajo de BD completo, tirado.
3. **UX — hasta 56s de skeleton sin ningún aviso de lentitud**: a
   diferencia de `SalaryChart`/`TopSkillsChart` (`slowHint` en
   `ChartCard`), `SummaryStats` no tiene ningún mecanismo para avisar de
   una carga larga — solo 5 skeletons pulsantes indefinidos. Combinado
   con los hallazgos 1 y 2, un usuario nuevo puede ver las KPI cards
   "cargando" durante decenas de segundos sin ninguna pista de que es
   esperado y no un fallo. Alcance: solo `SummaryStats.jsx` (no
   congelado) — la landing conserva su placeholder actual ("…") sin
   tocar, ver "Excepción a la zona congelada".
4. **Texto hardcodeado que puede contradecir su propio valor
   dinámico**: `SummaryStats.jsx` escribe literalmente
   `"en los 8 países cubiertos"` y `"DE, FR, ES, NL, PL, IT, AT, BE"`
   como descripción de dos cards distintas, mientras que el *valor* de
   "Países cubiertos" (`stats.total_countries`) sí es dinámico. Hoy
   coinciden — verificado en vivo, exactamente 8 países con ≥1 oferta
   activa (DE 71.750, PL 71.576, FR 54.473, IT 8.896, ES 8.020, NL 6.184,
   AT 3.673, BE 2.588) — pero nada lo garantiza: si el país con menos
   volumen (BE, hoy 2.588) se quedara temporalmente sin ninguna oferta
   activa, la card mostraría "7" justo al lado de un texto que sigue
   afirmando "8 países" y listando 8 códigos — contradicción visible en
   pantalla. Incumple además la regla de `tech-stack.md`/`AGENTS.md` de
   no hardcodear datos que ya vienen de la API. Alcance: solo
   `SummaryStats.jsx` — `LandingPage.jsx` no repite este texto (sus 3
   stats no tienen descripción, solo icono + número + label).
5. **La etiqueta "Última actualización" no mide lo que dice medir**: la
   card usa `MAX(posted_at)` (fecha de publicación de la oferta activa
   más reciente, según el origen/Adzuna) bajo el título "Última
   actualización" — un usuario esperaría que esto reflejara cuándo *este
   proyecto* actualizó los datos, no cuándo se publicó la oferta más
   reciente en el mercado. La tabla `jobs` ya tiene columnas pensadas
   exactamente para lo segundo (`ingested_at`, `last_seen_at`,
   `first_seen_at`) y no se usan aquí. Verificado en vivo que ambas
   fechas divergen de forma confusa: `MAX(posted_at)` = 2026-08-12
   07:45 UTC, pero `MAX(ingested_at)` = `MAX(last_seen_at)` = 2026-08-12
   06:06:59 UTC — **38 minutos antes**: la oferta con la fecha de
   publicación más reciente no es la misma que se ingirió más
   recientemente, y el pipeline no ha vuelto a tocar la BD desde
   entonces. La propia card ya tiene, una línea más abajo, la
   descripción correcta ("oferta más reciente") — es la etiqueta la que
   no encaja con lo que realmente se muestra. Alcance: solo
   `SummaryStats.jsx` — la landing no muestra este quinto stat.
6. **Regla de negocio duplicada como SQL crudo en 3 sitios
   independientes**: la condición "salario declarado y verificado ≥
   1.000€" (`salary_mid IS NOT NULL AND salary_is_predicted = FALSE AND
   salary_mid >= 1000`) aparece por separado en `/api/salary/by-role-country`
   (`index.js:173-175`), en `/api/stats/summary` (`index.js:306-309`,
   para `pct_with_salary`) y en el índice `idx_jobs_salary_by_role_country`
   (`schema.sql`) — sin ningún punto único de verdad. Hoy los tres
   coinciden (verificado en vivo: `pct_with_salary` = 35,6%, mismo
   criterio que `SalaryChart`), pero es exactamente el mismo patrón de
   fragilidad que motivó `TOP_SKILLS_IGNORED_FILTERS`/
   `applyDefaultPeriodoFallback` en `buildFilters.js` (fases 012/013): si
   el umbral cambia en un sitio y no en los otros dos, el KPI "Con
   salario declarado" del hero dejaría de coincidir en silencio con lo
   que realmente muestra `SalaryChart`.
7. **Sin tests de backend**: a diferencia de
   `salaryQuery.js`/`demandQuery.js`/`skillsQuery.js` (con sus
   `api/__tests__/*.test.js` propios), la query de `/api/stats/summary`
   sigue 100% inline en `index.js`, sin ningún test unitario que la
   proteja — confirmado, no existe ningún archivo en `api/__tests__` que
   la mencione.
8. **Comprobado, sin problema**: `total_skills` (JOIN, el usado hoy) y
   el criterio de `/api/skills/list` (EXISTS) devuelven el mismo número
   en vivo (478) — el fix de la fase 009 se mantiene correcto y
   consistente. `total_active_jobs` (227.160) coincide con el
   `total_matching_jobs` de `periodo=all` medido un día antes en la fase
   013 — coherente entre features. Los 3 campos que Postgres devuelve
   como string (`total_active_jobs`, `total_countries`, `total_skills`)
   pasan siempre por `Number(n)` antes de formatear en ambos
   consumidores — sin bug de tipos.

**Archivos afectados (previstos):** `api/src/index.js`, posiblemente un
`api/src/statsQuery.js` nuevo (mismo patrón que `salaryQuery.js`/
`demandQuery.js`/`skillsQuery.js`), `api/__tests__/statsQuery.test.js`
(nuevo), `api/schema.sql` (índice nuevo si el plan lo confirma),
`src/components/layout/SummaryStats.jsx`, `src/services/jobServices.js`,
posiblemente `src/App.jsx` y un hook nuevo en `src/hooks/` (para
compartir el fetch entre landing y dashboard sin duplicarlo — ver
hallazgo 2), y **solo la lógica de origen de datos** de
`src/components/landing/LandingPage.jsx` (ver siguiente sección). El
resto se decide en `014-plan.md`.

## Excepción a la zona congelada (landing)

`src/components/landing/` está permanentemente congelada por
`AGENTS.md` ("Ninguna modificación"). El permiso original de esta
feature (solo lógica/origen de datos, cero visual) queda **ampliado
explícitamente por el usuario** tras revisar `014-plan.md` — ver
"Ampliación de alcance" más abajo para el detalle completo. Estado
actual del permiso:

- **Sí se puede tocar**: lógica/origen de datos de todo `LandingPage.jsx`
  (igual que antes) **y además**, ahora sí, el contenido y aspecto visual
  del bloque de 3 stats (nuevos títulos, iconos, varias métricas por
  card, animación de contadores) y el badge superior ("Mercado tech
  europeo · 8 países · Datos en tiempo real", se elimina).
- **Sigue sin poder tocarse**: el resto de `LandingPage.jsx` — hero
  (título, gradiente, descripción), CTA ("Explorar el dashboard"),
  Lightfall (fondo WebGL) y su configuración. Nada de esto se audita ni
  se toca.
- Las **KPI cards del dashboard** (`SummaryStats.jsx`) — **actualizado**:
  el usuario decidió su rediseño en la misma sesión (ver "Segunda
  ampliación de alcance" más abajo), no quedó para una ronda futura.
  `SummaryStats.jsx` nunca estuvo en la zona congelada (vive en
  `layout/`, no en `landing/`), así que su rediseño no necesita ninguna
  excepción — siempre tuvo permiso completo.

## Ampliación de alcance — rediseño del bloque de stats de la landing

Tras leer `014-plan.md`/`014-tasks.md` iniciales, el usuario pidió además
un rediseño de contenido (no solo el fix de lógica ya planeado) para las
3 stats de la landing, más una investigación de un loader que percibe
roto. Detalle completo del diseño en `014-plan.md`. Resumen:

- **Card 1** — de "Ofertas activas" (número suelto) a **"Explora el
  mercado por país"**: nº de países + nº de ofertas activas + "actualizado
  hace X tiempo" (tiempo relativo, reutiliza el mismo dato que el
  hallazgo 5 ya centraliza en el backend).
- **Card 2** — de "Países cubiertos" a **"Compara salarios en Europa"**:
  salario mediano (dato nuevo en el backend). Ventana ajustada a 90 días,
  no los 6 meses pedidos originalmente — ver "semántica de negocio" en
  `014-plan.md`: con `is_active = TRUE`, una ventana de 6 meses habría
  sido idéntica a no poner ninguna (evidencia real de la fase 013).
- **Card 3** — de "Skills rastreadas" a **"Descubre dónde está la
  demanda"**: top 3 skills más demandadas de los últimos 30 días (dato
  nuevo en el backend).
- Cada card con su icono correspondiente; contadores numéricos animados
  (cuentan hacia arriba al montar, sin librería nueva — `AGENTS.md`
  prohíbe añadir dependencias sin confirmación).
- Badge superior ("Mercado tech europeo · 8 países...") eliminado — no
  aportaba información nueva sobre lo que ya dicen las cards.

**Loader investigado** (`src/components/ui/PageLoader.jsx` +
`src/App.jsx`): confirmado que su desaparición es un `setTimeout` fijo de
800ms, **sin ninguna relación con si los datos reales ya cargaron** — ni
`AbortController`, ni promesa, ni estado de `SummaryStats`. En la
práctica esto significa lo contrario de lo que parece percibirse: el
loader (bonito, con el logo) desaparece demasiado pronto y el usuario cae
sobre un dashboard con las KPI cards todavía en skeleton durante muchos
segundos (hallazgo 1) — de ahí la sensación de "algo se queda cargado".
No está en la zona congelada (`App.jsx`/`PageLoader.jsx` son de pleno
acceso). Fix propuesto en `014-plan.md` — **redefinido en la segunda
ampliación de alcance, ver abajo**: el usuario probó el fix del
transición landing→dashboard y no lo percibió, porque su idea era otra —
usar el loader para tapar la carga *inicial* de la propia landing, no
(solo) la transición hacia el dashboard.

## Segunda ampliación de alcance — loader de la landing y KPI cards del dashboard

Tras probar la primera ronda de cambios, el usuario aclaró su intención
real del loader y tomó las decisiones pendientes sobre las KPI cards del
dashboard (antes diferidas). Detalle completo del diseño en
`014-plan.md`. Resumen:

- **Loader de la landing**: en vez de (solo) gobernar la transición
  landing→dashboard, `LandingPage` ahora se queda mostrando `PageLoader`
  desde el primer render mientras `useSummaryStats()` sigue cargando —
  Lightfall ni siquiera se monta hasta entonces (confirmado leyendo
  `Lightfall.jsx`: no tiene ninguna carga asíncrona propia, solo
  `useSummaryStats()` es la espera real) — y solo revela el hero/cards/CTA
  una vez todo está listo, con los contadores animando desde ese mismo
  instante. Techo de seguridad (`LANDING_LOADER_MAX_MS`, 8s) para no
  dejar al usuario atrapado si la petición fallara del todo.
- **KPI cards del dashboard** — decisión del usuario: "Ofertas activas"/
  "Países cubiertos" se sustituyen por **"Empresas analizadas"**
  (`total_companies`, nuevo) y **"Roles analizados"** (`total_role_categories`,
  nuevo) — los dos números que quitan ya se muestran en la card "Explora
  el mercado por país" de la landing, así que repetirlos aquí no aportaba
  nada distinto; las 2 cards nuevas orientan sobre amplitud (empresas) y
  granularidad (categorías de rol, antes de entrar en `SalaryChart`).
  "Con salario declarado", "Última actualización" y "Skills rastreadas"
  se mantienen sin cambios, a petición explícita. Todas las cards
  numéricas (no la fecha) animan con `useCountUp`, mismo hook que la
  landing.
- **Semántica de negocio revisada** (a petición explícita del usuario):
  `total_companies` cuenta strings de `company` distintos, no empresas
  reales deduplicadas — verificado en vivo que existen variantes de la
  misma empresa ("Sii" / "Sii Sp. z o.o.", ~3.400 y ~1.700 ofertas
  respectivamente) — documentado como limitación conocida, mismo
  criterio ya aceptado para `total_skills` (fase 009). `total_role_categories`
  incluye `'other'` a propósito: es una categoría real y seleccionable en
  `SalaryChart` (no se excluye del roster, solo del top-5 por defecto),
  así que excluirla aquí subestimaría la granularidad real que se le está
  previniendo al usuario.

## Por qué

Mismo motivo que las rondas anteriores: verificar que los datos
mostrados son correctos y fiables a la BD real, que las queries no son
más costosas de lo necesario, y que la lógica de negocio tiene sentido
para el propósito del dashboard. Esta vez el foco es distinto a
propósito: las KPI cards y el bloque de stats de la landing son lo
**primero** que ve cualquier usuario — su calidad de datos y su
rendimiento pesan más que los de una gráfica a la que hay que hacer
scroll para llegar. `SummaryStats.jsx` no ha tenido una auditoría de
datos/rendimiento propia desde su paso visual en la fase 003 (Halo Stat
Tiles) y el fix puntual de `total_skills` en la fase 009; el bloque de
la landing nunca se había auditado, al estar la carpeta congelada.

## Criterios de aceptación

- [x] `GET /api/stats/summary` deja de exigir 22-88s en el camino normal
      de uso — caché en memoria de 10 min (`statsCache.js`) + índice de
      apoyo (`idx_jobs_active_summary`, aplicado contra la BD real).
      Verificado en vivo: 37s (caché fría, con índice) → 71-95ms (caché
      caliente).
- [x] La landing y las KPI cards no disparan la misma petición cara dos
      veces en la primera visita — `useSummaryStats()` comparte una
      promesa en vuelo entre ambos consumidores (y `App.jsx`, tercer
      consumidor tras la ampliación de alcance).
- [x] `SummaryStats` deja de mostrar un skeleton indefinido sin contexto
      durante cargas largas — aviso tras `SLOW_LOADING_MS` (6s),
      reutilizando la misma constante que `ChartCard`.
- [x] "Países cubiertos"/"Ofertas activas" dejan de poder contradecirse
      con su propio dato dinámico — descripción de "Ofertas activas"
      interpola `stats.total_countries`; "Países cubiertos" deriva su
      lista de `NOMBRES_PAISES` en vez de un string suelto.
- [x] La etiqueta "Última actualización" refleja lo que realmente mide —
      se cambió el **dato** (`MAX(last_seen_at)` en vez de
      `MAX(posted_at)`), no la etiqueta, y se ajustó la descripción a
      "última sincronización con la fuente".
- [x] La condición "salario declarado y verificado ≥ 1.000€" deja de
      estar duplicada como SQL crudo en 3 sitios — `salaryQualityConditions(alias)`
      en `salaryQuery.js`, reusada por `/api/salary/by-role-country` y
      `statsQuery.js` (2 veces, con alias distintos).
- [x] La query de `/api/stats/summary` tiene tests unitarios propios —
      `api/__tests__/statsQuery.test.js` (9 tests) +
      `api/__tests__/statsCache.test.js` (4 tests).
- [x] `npx vitest run` (frontend y `api/`) al 100% — **393/393** y
      **73/73**, sin regresiones.
- [x] `npm run build` sin errores.
- [x] Verificado contra la BD real y contra el servidor real (no solo
      mocks) — timing de caché fría/caliente, índice confirmado vía
      `pg_indexes`, y 11/11 tests E2E (Playwright/Chromium real).
- [x] `.env.local` nunca leído.
- [x] El resto de `LandingPage.jsx` (hero, CTA, Lightfall) sin ningún
      cambio visual — solo se tocó el bloque de stats y el badge
      superior, dentro de la ampliación de excepción explícita.
- [x] Las 3 cards de la landing muestran su título nuevo, icono, métricas
      dinámicas (nunca hardcodeadas) y tiempo relativo de actualización;
      los contadores numéricos animan al montar. Verificado por E2E real
      (Lightfall/WebGL impide un test RTL/jsdom — ver `014-tasks.md`).
- [x] Badge superior de la landing eliminado — verificado por E2E.
- [x] El loader de transición (`PageLoader`) deja de desaparecer en un
      tiempo fijo desconectado de si los datos reales están listos —
      espera un mínimo de 500ms y `!statsLoading`, techo de 4000ms; la
      animación del logo pasa a `infinite` para no congelarse si el
      loader dura más de un ciclo.
- [x] `SummaryStats.jsx` (KPI cards del dashboard) rediseñado — "Empresas
      analizadas"/"Roles analizados" nuevas, 3 cards existentes sin
      cambios de contenido, todos los valores numéricos animan.
- [x] El loader de la landing (`PageLoader` vía `LandingPage`) cubre la
      carga inicial real (Lightfall + `useSummaryStats()`), no solo la
      transición hacia el dashboard — verificado con un test unitario
      (estado de carga, sin Lightfall montado) y E2E real.
- [x] `useCountUp` termina en el valor exacto del target, incluso con
      decimales (`pct_with_salary`) — verificado con test unitario.

## Fuera de alcance

- **Cualquier cambio visual en el resto de `LandingPage.jsx`** (hero,
  CTA, Lightfall) — la ampliación de excepción de esta feature cubre
  solo el bloque de 3 stats y el badge superior, ver más arriba.
- ~~Rediseño de las KPI cards del dashboard diferido~~ — **ya no aplica**:
  el usuario tomó la decisión en esta misma sesión, ver "Segunda
  ampliación de alcance".
- **Cambiar el umbral de negocio de "salario declarado"** (hoy
  1.000€) — este hallazgo (6) propone centralizarlo, no modificarlo.
- **Tabla resumen materializada / job de refresco programado** — una
  caché simple en memoria del propio proceso Express (dato que cambia
  ~1 vez al día con la ingesta) resuelve el hallazgo 1 con mucho menos
  riesgo/infraestructura; una tabla materializada queda como candidato
  futuro si la caché no fuera suficiente, a decidir en `014-plan.md`.
- **Re-auditar las 5 gráficas del dashboard** (`TopSkillsChart`,
  `SalaryChart`, `DemandByRoleChart`, `EuropeMap`, `SkillHeatmap`) — ya
  cerrado en fases 008-013, no se reabre aquí.
- **Añadir nuevas KPI cards o stats** — fuera del propósito de una
  auditoría de calidad; mismo criterio que "no se añaden nuevas
  secciones de datos" de `mission.md`.
