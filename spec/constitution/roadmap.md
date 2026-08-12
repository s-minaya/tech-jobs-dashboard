# Roadmap

## Hecho ✅

_(anterior al rediseño Halo)_

1. **000 · Dashboard v1** — visualizaciones dinámicas completas, filtros, persistencia localStorage, tests unitarios, E2E y CI.

2. **001 · Halo tokens + auditoría** — variables CSS sustituidas por los tokens
   Halo (dual dark/light), Inter + JetBrains Mono instaladas, auditoría de
   organización/nomenclatura/duplicación aplicada. Ver
   `spec/features/001-halo-tokens/audit.md` para el detalle y los hallazgos
   diferidos a fases 004/005/006/007.

3. **002 · Halo ChartCard** — borde aurora animado sustituido por hairline
   1px `--color-border` estático; fondo de card a `--color-surface`; badge
   "Actualizando..." con tokens Halo (`--color-elevated`). El aurora queda
   reservado a GlowButton/hero. Sin cambios en `DecryptedText`, el ⓘ de
   filtros ni la lógica de estados.

4. **003 · Halo Stat Tiles** — KPI cards del hero pasan de wrapper/inner con
   hover aurora a `.stat-tile` (misma superficie que `ChartCard`) con una
   franja aurora animada de 3px en la parte superior, recortada a las
   esquinas redondeadas (a petición del usuario, en vez del accent bar de
   signal color plano del plan original). Valor en JetBrains Mono, label en
   patrón eyebrow, icono de calendario eliminado. Sin cambios en el
   fetching ni el grid responsive.

5. **004 · Halo Filtros** — `FilterDrawer`/`FilterSheet` pasan de
   `bg-background` a `bg-elevated` (nivel de superficie propio de un panel
   superpuesto); badge del FAB y anillo pulsante a `bg-primary`; chips
   inactivos de `FilterSection` a `bg-surface`; label de sección sin
   opacidad `/70`. Corregido un bug preexistente de la fase 001: `key`
   spreadeado en `FilterSheet` (warning de React 19). `GlowButton` y la
   lógica de drag no se tocaron. De paso se descubrió y arregló
   `FilterDrawer.test.jsx`, que desde su creación testeaba por error
   `SummaryStats` (contenido duplicado) en vez de `FilterDrawer`.

6. **005 · Halo BottomNav** — última barra con valores hardcodeados:
   `bg-background/95` → `bg-elevated/95` (mismo nivel de superficie que
   drawer/sheet), `border-white/8` → `border-border`. Cambio mínimo, sin
   tocar lógica ni tests.

7. **006 · Halo Hero** — título del hero: `font-heading` (Space Mono,
   desinstalado en 001) → `font-sans` (Inter); colores hardcodeados/con
   ternario `isDark ? ... : ...` de "Tech Jobs", "Dashboard" y el subtítulo
   → un único token Halo por elemento en ambos temas
   (`--color-text-primary`, `--color-primary`, `--color-text-secondary`).
   `DarkVeil`/`Aurora`/`ThemeToggle` sin cambios. Durante la verificación se
   investigaron (solo lectura) dos reportes del usuario ajenos a esta
   feature: un título de gráfica no reproducible como desaparecido, y un
   timeout de Postgres en la query de salario (confirmado lento — 5-14s —
   probable falta de índice; es trabajo de `api/`, zona congelada, no
   tocado). Ver `006-tasks.md` para el detalle.

8. **007 · Halo Charts Internals** — colores hardcodeados dentro de las
   gráficas sustituidos por tokens Halo: `TopSkillsChart` usa
   `var(--color-primary)` en vez de `var(--chart-1)` (que sigue apuntando a
   `--role-backend`, sin tocar — también es el fallback de
   `roleLabels.js`); `tickColor` de `TopSkillsChart`/`DemandByRoleChart`/
   `SalaryChart` se resuelve con `getComputedStyle` desde
   `--color-text-primary`/`-secondary` en vez de hex hardcodeado, mediante
   un hook `useIsDark` nuevo y compartido (extraído de la implementación
   original de `TopSkillsChart`); tooltips de esas dos últimas pasan de
   `bg-background border-border/50` a `bg-elevated border-border`;
   `EuropeMap` usa `--color-border`/`--color-text-primary` para el stroke
   de países; `HeatmapSvg`/`HeatmapLegend` usan `--color-surface` +
   `--color-border` para la celda "sin datos". No se pudo verificar
   visualmente con datos reales (misma limitación de red del sandbox que
   en fases 001/003/006); verificado con 309/309 tests, build limpio y 0
   errores de consola. Ver `007-tasks.md` para el detalle.

9. **008 · Integridad de datos en la co-ocurrencia de skills**
   fix de datos descubierto en conversación directa con el usuario sobre
   el heatmap. Backend:
   `/api/skills/cooccurrence` agrupaba por `role_category` además de por
   el par de skills, fragmentando cada par real en varias filas con
   `co_count` parcial y desperdiciando el `LIMIT 1000` en duplicados —
   corregido. Frontend: `filterSkillsWithCoOccurrence` pasa de exigir "al
   menos 1" co-ocurrencia a un umbral de conectividad mínima real
   (k-core: `minDegree`/`minEdgeCount`, con fallback para conjuntos
   pequeños), 100% dinámico con la BD. Ver
   `spec/features/008-skills-cooccurrence/008-tasks.md` para el detalle.

9. **009 · Calidad de datos en el autocomplete de skills del mapa** —
   fix de datos en `EuropeMap`. El autocomplete sugería miles de
   entradas de `skills` sin ningún uso real (fragmentos de texto,
   nombres compuestos como "React/Angular", títulos de puesto) porque
   `GET /api/skills/list` volcaba la tabla `skills` completa (4557 filas)
   sin filtrar. Verificado con datos reales: 34 de 35 coincidencias de
   "react" tenían 0 ofertas activas. `GET /api/skills/list` ahora exige
   al menos 1 oferta activa real vinculada vía `job_skills`, 100%
   dinámico, sin parsear ni redistribuir nombres compuestos — de 4557 a
   688 skills reales. Mismo fix aplicado al KPI "Skills rastreadas"
   (`total_skills` en `/api/stats/summary`, visible en el hero y en la
   landing), que tenía el mismo root cause y quedó inconsistente con el
   autocomplete ya limpio; calculado con `COUNT(DISTINCT)` sobre un
   `JOIN` en vez de un `EXISTS` correlacionado, más barato bajo carga
   concurrente. De paso se investigaron dos 500 reportados por el
   usuario en devtools: uno preexistente y ajeno (query de salario sin
   índice, fase 006), otro confirmado como degradación general de la
   conexión a la BD real del sandbox, no un bug. Ver
   `spec/features/009-skills-list-quality/009-tasks.md` para el detalle.

10. **010 · Calidad de datos y rendimiento — Salario por rol y país** —
    tercera ronda "tabla por tabla", primera con acceso completo a
    `api/` (deja de ser zona congelada — ver `AGENTS.md`, única excepción
    permanente: `.env.local`). Auditoría exhaustiva de `SalaryChart` y
    `GET /api/salary/by-role-country`: el "top 5 de roles por defecto"
    dejaba de ser un efecto colateral del `ORDER BY` del backend
    (confirmado con datos reales: en Austria, `qa_testing` con 3 ofertas
    entraba en el top 5 mientras `backend` con 62 quedaba fuera) y pasa a
    calcularse por volumen real; `job_count`/`avg_salary_eur` (ya
    calculados, descartados hasta ahora) se muestran en el tooltip, con
    aviso visual para muestras con menos de 5 ofertas (13.2% de las
    celdas reales); eje X en español (`NOMBRES_PAISES` — `country_name`
    del backend resultó estar en inglés, hallazgo propio del diseño);
    nota de contrato sin mezclar idiomas; mensajes de error/carga lenta
    traducidos y genéricos en `ChartCard`; `AbortController` en
    `useChartData` (las 4 gráficas que lo usan); backend: índice que
    faltaba (ya sugerido en fase 006) + una sola query en vez de dos;
    vista SQL duplicada y sin usar eliminada; `schema.sql` sincronizado
    con los 16 `role_category` reales. El índice no se pudo aplicar
    contra la BD real desde este entorno (mismo bloqueo de conexión
    directa ya visto en la fase 009) — queda documentado como script
    standalone para aplicación manual. Verificado con 347/347 tests de
    frontend y 28/28 de `api/`; la verificación en vivo de la query
    combinada no fue posible por el mismo `statement_timeout`
    preexistente que esta feature soluciona (justo la ausencia del
    índice). Ver `spec/features/010-salary-chart-quality/010-tasks.md`
    para el detalle completo.

10. **011 · Calidad de datos y rendimiento — Evolución mensual de ofertas
    por rol** — cuarta ronda "tabla por tabla". Auditoría exhaustiva de
    `DemandByRoleChart` y `GET /api/jobs/demand-by-role`: bug de
    agregación real con el filtro de país en su valor por defecto
    ("Todos") — el backend fragmentaba cada combinación mes+rol en una
    fila por país, y el frontend se quedaba solo con la última que
    llegaba de Postgres en vez de sumarlas, infrarrepresentando la
    demanda sin ningún error visible; corregido en el origen quitando
    `country_code` del `SELECT`/`GROUP BY` (mismo tipo de bug que la fase
    008 con `role_category` en la co-ocurrencia de skills). El "top 5 de
    roles por defecto" tenía el mismo bug ya arreglado en `SalaryChart`
    (orden de llegada de la API en vez de volumen real) — corregido
    reusando `rankRolesByVolume`. Nueva nota explicando que el último mes
    mostrado puede estar incompleto (ingesta continua), para no leer un
    "bajón" de demanda ficticio al final de cada línea. Backend: índice
    nuevo (`idx_jobs_demand_by_role`, no aplicado contra la BD real por el
    mismo bloqueo de conexión directa de fases anteriores) + una sola
    query en vez de dos; vista SQL duplicada y desincronizada
    (`v_demand_by_role_monthly`) eliminada; `extractRoles` eliminada de
    `roleLabels.js` al quedarse sin consumidores. Verificado con 347/347
    tests de frontend y 36/36 de `api/`, y contra el backend real: con
    filtro de país (`country=de`) respondió `200 OK` en 5.3s confirmando
    la forma de fila correcta (sin `country_code`) y que
    `total_matching_jobs` coincide exactamente con la suma de `job_count`
    de las filas devueltas; sin filtro de país siguió fallando por
    `statement timeout` (esperado, es justo lo que soluciona el índice
    pendiente de aplicar). Revisión post-implementación (mismo día):
    `jornada` estaba excluido como filtro sin ninguna razón técnica real
    (reutilizaba una nota genérica pensada para el heatmap de
    co-ocurrencia) — habilitado y verificado con datos reales
    (`full_time`/`part_time` devuelven totales distintos; ~35.7% de las
    ofertas de DE/90d no declaran jornada, no invalida el filtro); y con
    "Últimos 30 días" se seguía consultando el backend aunque el gráfico
    nunca se muestra — ahora se salta esa petición. De paso se confirmó
    que excluir `skillCategoria` sí es correcto (ningún endpoint salvo
    `/api/skills/top` hace `JOIN` con la tabla `skills`) y se detectó que
    `/api/skills/top` tiene el mismo problema de `jornada` sin resolver,
    documentado como candidato a una ronda futura. Ver
    `spec/features/011-demand-by-role-quality/011-tasks.md` para el
    detalle completo.

11. **012 · Auditoría cruzada de filtros** — quinta ronda "tabla por
    tabla", pero distinta: no audita una gráfica nueva, sino cómo
    interactúan los filtros del sidebar entre sí y contra las 5 gráficas
    ya construidas (`TopSkillsChart`, `SalaryChart`, `DemandByRoleChart`,
    `EuropeMap`, `SkillHeatmap`)
    Auditoría de los 7 endpoints + discusión de diseño filtro por filtro
    con el usuario (contrastando su diseño original, nunca escrito antes,
    contra lo implementado). Resultado: `GET /api/skills/cooccurrence` descartaba
    `country`/`jornada` pero no `contrato`/`remote`, que se habrían
    aplicado silenciosamente si algún caller los hubiera enviado
    (dormido en producción porque el único caller ya los descartaba antes,
    pero el contrato de la API estaba roto); corregido con un
    `stripKeys`/`COOCCURRENCE_IGNORED_FILTERS` testeable en
    `buildFilters.js`, verificado en vivo con peticiones concurrentes
    (idénticas con y sin `contrato`/`remote`). Además, un bug de
    UI en `EuropeMap` donde el aviso ⓘ no cubría `skillCategoria` aunque
    la pill sí se ocultaba. El resto de la auditoría confirmó que el
    diseño original ya estaba bien implementado, con dos correcciones
    sobre el propio análisis inicial de esta ronda: se descartó habilitar
    `jornada` en `TopSkillsChart` (recomendación de la fase 011 que
    resultó ser un error de razonamiento — "sin barrera técnica" no es lo
    mismo que "aporta una pregunta de negocio útil"), y se descubrió que
    el filtro de categoría de skill en el heatmap de co-ocurrencia **ya
    funcionaba** con la semántica deseada (ambas skills del par dentro de
    la categoría), implementado client-side desde antes de esta sesión
    (`heatmapUtils.js`) — no fue necesario construir nada nuevo, solo se
    añadió un test que lo deja documentado. Verificación post-implementación
    (mismo día): el heatmap no mostraba ningún aviso claro al cambiar de
    categoría (reconectado al badge "Actualizando..." que `ChartCard` ya
    tenía, quitando la atenuación duplicada que hacía `HeatmapSvg` por su
    cuenta); los `NS_BINDING_ABORTED` vistos en consola resultaron ser
    `StrictMode` duplicando efectos en desarrollo (no aparece en
    producción), no un bug. Verificado con 353/353 tests de frontend y
    40/40 de `api/`. Ver
    `spec/features/012-cross-filter-audit/012-tasks.md` para el detalle
    completo.

## En curso 🔜

_(ninguna — siguiente: 013, un "chart de tendencias" estilo Halo ligado a
la idea aún sin planificar de restructurar la carga del dashboard con
header/rutas, o lo que el usuario decida)_

## Backlog 💡

12. **013 · Halo Responsive y Pulido** — revisión final de breakpoints, espaciados y componentes menores.

> Una sola feature activa a la vez. No se empieza la siguiente hasta que la anterior pasa todos los criterios de aceptación.
