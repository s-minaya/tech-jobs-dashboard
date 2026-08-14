# Roadmap

## Hecho ✅

_(anterior al rediseño Halo)_

1. **000 · Dashboard v1** — visualizaciones dinámicas completas, filtros, persistencia localStorage, tests unitarios, E2E y CI.

2. **001 · Halo tokens + auditoría** — variables CSS sustituidas por los
   tokens Halo (dual dark/light), Inter + JetBrains Mono instaladas,
   auditoría de organización/nomenclatura/duplicación aplicada. Ver
   `spec/features/001-halo-tokens/audit.md` para los hallazgos diferidos
   a fases 004/005/006/007.

3. **002 · Halo ChartCard** — borde aurora animado sustituido por hairline
   1px `--color-border` estático; fondo de card a `--color-surface`; badge
   "Actualizando..." con tokens Halo. El aurora queda reservado a
   GlowButton/hero.

4. **003 · Halo Stat Tiles** — KPI cards del hero pasan de wrapper/inner
   con hover aurora a `.stat-tile` (misma superficie que `ChartCard`) con
   una franja aurora animada de 3px en la parte superior, recortada a las
   esquinas redondeadas. Valor en JetBrains Mono, label en patrón eyebrow.

5. **004 · Halo Filtros** — `FilterDrawer`/`FilterSheet` pasan de
   `bg-background` a `bg-elevated`; badge del FAB y anillo pulsante a
   `bg-primary`; chips inactivos a `bg-surface`. Bug corregido: `key`
   spreadeado en `FilterSheet` (warning de React 19). De paso se arregló
   `FilterDrawer.test.jsx`, que desde su creación testeaba por error
   `SummaryStats` en vez de `FilterDrawer`.

6. **005 · Halo BottomNav** — valores hardcodeados a tokens Halo
   (`bg-background/95` → `bg-elevated/95`, `border-white/8` →
   `border-border`).

7. **006 · Halo Hero** — título del hero: `font-heading` (Space Mono,
   desinstalado en 001) → `font-sans` (Inter); colores hardcodeados/con
   ternario por tema → un único token Halo por elemento. Investigados
   (solo lectura, ajenos a esta feature): un título de gráfica que
   desaparecía sin poder reproducirse, y un timeout de Postgres en la
   query de salario (confirmado lento, 5-14s — retomado en la fase 010).

8. **007 · Halo Charts Internals** — colores hardcodeados dentro de las
   gráficas sustituidos por tokens Halo (`TopSkillsChart`, ticks de ejes
   vía `getComputedStyle` + hook `useIsDark` nuevo y compartido, tooltips,
   `EuropeMap`, `HeatmapSvg`/`HeatmapLegend`). Verificado con 309/309
   tests.

9. **008 · Integridad de datos en la co-ocurrencia de skills** — fix de
   datos en el heatmap. Backend: `/api/skills/cooccurrence` agrupaba
   también por `role_category`, fragmentando cada par real de skills en
   varias filas con `co_count` parcial y desperdiciando el `LIMIT 1000`
   en duplicados — corregido. Frontend: `filterSkillsWithCoOccurrence`
   pasa de exigir "al menos 1" co-ocurrencia a un umbral de conectividad
   real (k-core: `minDegree`/`minEdgeCount`, con fallback para conjuntos
   pequeños), 100% dinámico con la BD. Ver
   `spec/features/008-skills-cooccurrence/008-spec.md`.

10. **009 · Calidad de datos en el autocomplete de skills del mapa** —
    `GET /api/skills/list` volcaba la tabla `skills` completa (4557 filas)
    sin filtrar, incluyendo miles de entradas sin ningún uso real
    (fragmentos de texto, nombres compuestos). Verificado: 34 de 35
    coincidencias de "react" tenían 0 ofertas activas. Ahora exige al
    menos 1 oferta activa real vinculada — de 4557 a 688 skills reales.
    Mismo fix aplicado al KPI "Skills rastreadas" (`total_skills`),
    mismo root cause. Ver
    `spec/features/009-skills-list-quality/009-spec.md`.

11. **010 · Calidad de datos y rendimiento — Salario por rol y país** —
    primera ronda con acceso completo a `api/` (deja de ser zona
    congelada desde aquí — ver `AGENTS.md`; única excepción permanente:
    `.env.local`). El "top 5 de roles por defecto" era un efecto
    colateral del `ORDER BY` del backend (en Austria, `qa_testing` con 3
    ofertas entraba en el top 5 mientras `backend` con 62 quedaba fuera)
    — pasa a calcularse por volumen real; `job_count`/`avg_salary_eur` se
    muestran en el tooltip, con aviso visual para muestras &lt;5 ofertas;
    eje X en español; índice nuevo + una sola query en vez de dos; vista
    SQL duplicada eliminada. Ver
    `spec/features/010-salary-chart-quality/010-spec.md`.

12. **011 · Calidad de datos y rendimiento — Evolución mensual de ofertas
    por rol** — con el filtro de país en su valor por defecto, el backend
    fragmentaba cada combinación mes+rol en una fila por país y el
    frontend se quedaba solo con la última que llegaba, infrarrepresentando
    la demanda sin ningún error visible — corregido quitando `country_code`
    del `SELECT`/`GROUP BY`. Mismo fix de "roles por volumen real" que la
    fase 010. Filtro de `jornada` habilitado (estaba excluido sin ninguna
    razón técnica real). Ver
    `spec/features/011-demand-by-role-quality/011-spec.md`.

13. **012 · Auditoría cruzada de filtros** — revisión de cómo interactúan
    los filtros del sidebar entre sí y contra las 5 gráficas ya
    construidas. Bug real: `GET /api/skills/cooccurrence` no descartaba
    `contrato`/`remote` de la query string — el contrato de la API estaba
    roto aunque dormido en producción — corregido con
    `stripKeys`/`COOCCURRENCE_IGNORED_FILTERS` testeable. Bug de UI en
    `EuropeMap`: el aviso ⓘ no cubría `skillCategoria` aunque la pill sí
    se ocultaba. El resto del diseño de filtros ya estaba bien
    implementado. Ver `spec/features/012-cross-filter-audit/012-spec.md`.

14. **013 · Auditoría — Top Skills más demandadas** — `GET /api/skills/top`
    y `GET /api/skills/cooccurrence` capaban silenciosamente "Todo el
    histórico" a los mismos 90 días del periodo por defecto — corregido
    con `applyDefaultPeriodoFallback`. Query más lenta detectada hasta
    ese momento (28.5-77s sin índice) — con `idx_jobs_active_posted_at`
    baja a 7.4s sin filtros; el resto del límite es estructural (el
    filtro `is_active + 90 días` apenas excluye ~7% de la tabla).
    `total_matching_jobs` contaba solo ofertas con alguna skill extraída
    (~30% de las activas) mostrando un número muy distinto al de las
    demás gráficas — corregido contando directamente sobre `jobs`
    (~15x más rápido de paso). Sidebar completo traducido al español
    (país, contrato, jornada, categoría de skill). Ver
    `spec/features/013-top-skills-quality/013-spec.md`.

15. **014 · Auditoría — KPI cards y stats de la landing** — primera vez
    con permiso explícito y acotado sobre un fragmento de la landing
    (bloque de 3 stats, `LandingPage.jsx`). Query más cara detectada en
    el proyecto (22-88s sin caché) — corregida con caché en memoria
    (`statsCache.js`) + índice de apoyo (37s en frío → 71-95ms en
    caliente); landing y KPI cards disparaban la misma query dos veces en
    la primera visita — corregido con un hook compartido
    (`useSummaryStats`) que deduplica peticiones simultáneas; "Última
    actualización" medía `posted_at` bajo una etiqueta que prometía
    frescura del pipeline — corregida a `last_seen_at`; regla de negocio
    "salario declarado ≥1.000€" centralizada en `salaryQualityConditions()`
    (antes duplicada como SQL crudo en 3 sitios). Rediseño de contenido de
    las 3 stats de la landing (país/salario/demanda, con contadores
    animados) y de las KPI cards del dashboard ("Empresas analizadas"/
    "Roles analizados" nuevas). Loader de la landing corregido en 2
    rondas: primero para esperar a los datos reales en vez de un
    `setTimeout` fijo; después porque su techo de seguridad (8s) era muy
    inferior al tiempo real en frío de la query (37-90s) — resuelto
    calentando la caché al arrancar el servidor + TTL más largo, lo que
    destapó un bug genuino de concurrencia en `getCached()` (dos llamadas
    simultáneas lanzaban la query dos veces en paralelo). Ver
    `spec/features/014-summary-stats-quality/014-spec.md`.

16. **015 · Auditoría de semántica de negocio y cierre de deuda técnica**
    — cierre de la fase de auditorías "tabla por tabla": semántica
    temporal y de salario verificadas con medición directa contra la BD
    real (no solo inferencia), más una comprobación de que los "totales"
    que muestran las distintas gráficas/KPIs son coherentes entre sí bajo
    el mismo estado de filtros. Hallazgo nuevo no anticipado: 32 ofertas
    con salario corrupto en el extremo alto (31 valores idénticos de
    500.000€ + 1 de 1.904.448€) — corregido con un techo dirigido en
    `salaryQualityConditions()`. `SalaryChart` gana una nota cuando el
    filtro de jornada está activo (el salario viene pro-rateado). Deuda
    técnica cerrada: los 3 índices pendientes desde las fases 010/011/014
    se aplicaron con éxito contra la BD real; 8 vistas SQL muertas
    eliminadas de `schema.sql` y de la BD real; `useHeatmapData.js` gana
    `AbortController`. Único hallazgo de la reconciliación de totales:
    las KPI cards del hero no reaccionan a ningún filtro (decisión ya
    tomada en la fase 014) sin que ningún texto en pantalla lo aclarase
    — corregido con una nota en `SummaryStats.jsx`. Toda la semántica de
    negocio resuelta en esta fase vive ahora en
    `spec/constitution/business-logic.md`, no repetida aquí. Ver
    `spec/features/015-business-logic-audit/015-spec.md` para la
    evidencia completa de cada verificación.

## En curso 🔜

17. **016 · Setup de rutas por gráfica + header de navegación** —
    primera feature de la fase 3 del roadmap general (rediseño total de
    la página para optimizar velocidad y experiencia de usuario);
    ataca dos problemas reales ya documentados, no solo "rendimiento" en
    abstracto: el bundle sin dividir (920.84 kB en un único chunk,
    verificado con `npm run build`) y las 5 gráficas disparando su
    fetch a la vez al montar, el mismo patrón que agotó el pool de
    conexiones de Postgres en la fase 010. `react-router-dom` (nueva
    dependencia, aprobada explícitamente) + `React.lazy()`/`Suspense`
    por gráfica + header nuevo; `filters`/`useSummaryStats` se quedan
    por encima del árbol de rutas. `SalaryChart` gana su propia ruta
    (`/salarios`, separada de `/tendencias`); el `FilterFAB` desaparece
    y se sustituye por un sidebar de filtros reutilizable en las 4
    páginas de gráfica (no en `/`). Spec + plan + tasks creados —
    pendiente de confirmación explícita del usuario antes de tocar
    código. Ver `spec/features/016-router-setup/`.

## Backlog 💡

- **Resto de la fase 3** (rediseño visual/UX del contenido de cada
  ruta) — se numera a medida que se planifica, a partir de que la 016
  cierre.
- **Halo Responsive y Pulido** (backlog; llevaba provisionalmente el
  número 016 hasta esta ronda) — se mueve al final de todo el
  proyecto: revisión final de breakpoints, espaciados y componentes
  menores, ejecutada después de que toda la fase 3 (rediseño) esté
  cerrada, para no pulir responsive/espaciados sobre una estructura que
  todavía va a cambiar de raíz. Número definitivo pendiente de asignar
  cuando se sepa cuántas features suma la fase 3 completa — no se fija
  ahora para no tener que reescribirlo cada vez que se añada una
  feature nueva antes.

> Una sola feature activa a la vez. No se empieza la siguiente hasta que la anterior pasa todos los criterios de aceptación.
