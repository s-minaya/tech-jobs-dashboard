# 013 · Auditoría — Top Skills más demandadas

**Estado:** planificada (pendiente de implementación)

> Sexta ronda "tabla por tabla" (tras 008/009/010/011/012). Audita
> `TopSkillsChart` (`src/components/Charts/TopSkillsChart.jsx`) y su
> endpoint `GET /api/skills/top` (`api/src/index.js`). No es parte del
> rediseño Halo.

## Qué hace

Auditoría exhaustiva de la gráfica de skills más demandadas: dos auditorías
de solo lectura en paralelo (frontend completo + backend/BD con
verificación en vivo contra la BD real) más comprobación manual propia de
varios puntos dudosos. Resultado, 8 hallazgos:

1. **Bug de coherencia semántica — "Todo el histórico" no es todo el
   histórico**: `GET /api/skills/top` y `GET /api/skills/cooccurrence`
   fuerzan un `INTERVAL '90 days'` siempre que `periodo` esté ausente **o
   valga `"all"`** — es decir, seleccionar "Todo el histórico" en el
   sidebar da exactamente el mismo resultado que el periodo por defecto.
   Confirmado en vivo: `periodo=90d`, `periodo=all` y sin `periodo`
   devuelven los tres `total_matching_jobs: 68032` en `/api/skills/top`.
   Ningún comentario ni `spec/` anterior documenta esta lógica como
   intencional; contrasta con `salary/by-role-country`/`demand-by-role`,
   donde "Todo el histórico" sí es literal (confirmado por grep — no
   tienen esta lógica). Afecta a `TopSkillsChart`, a `useHeatmapData`
   (usa `getTopSkills` para las skills candidatas por categoría) y a
   `SkillHeatmap` (`/api/skills/cooccurrence` tiene el mismo patrón
   duplicado) — se corrige en los dos endpoints en esta feature.
2. **Rendimiento — el peor detectado hasta ahora**: `GET /api/skills/top`
   no tiene ningún índice dedicado. Verificado en vivo: 28.5s sin filtros,
   34.7s con `country=de` (el filtro de país casi no ayuda — el cuello de
   botella es el propio `JOIN job_skills ⋈ jobs`). Sin `slowHint` en
   `ChartCard` pese a ser la gráfica más lenta del dashboard.
3. **Bug de datos**: `pct_of_all_jobs` se calcula sobre el conjunto ya
   filtrado por `category`, pero `total_matching_jobs` no — con
   `category` activo, el campo pasa a significar "% dentro de la
   categoría" en vez de "% de todas las ofertas" sin cambiar de nombre.
   Confirmado en vivo. No lo consume ningún componente (dato muerto desde
   antes, documentado sin resolver en la fase 012).
4. **Filtro sin protección testeable**: `jornada` se descarta con un
   destructure inline sin comentario, tanto en el backend
   (`api/src/index.js`) como en el frontend (`jobServices.js`) — mismo
   patrón que causó el leak real de `contrato`/`remote` en
   `/api/skills/cooccurrence` (fase 012). Verificado en vivo que hoy
   `jornada` no tiene efecto (decisión de la fase 012 reconfirmada); falta
   blindarlo con el patrón `stripKeys` ya existente.
5. **Vistas SQL muertas**: `v_top_skills_by_country` y `v_top_skills_global`
   en `schema.sql` sin ningún endpoint que las use — mismo patrón que las
   vistas ya eliminadas en fases 010/011.
6. **Sin módulo propio ni tests de backend**: la SQL sigue inline en
   `index.js`, sin ningún test — a diferencia de `salaryQuery.js`/
   `demandQuery.js` (fases 010/011).
7. **UI — altura sin techo**: `alturaPx` crece sin límite (hasta 1600px
   con `category` activo y 50 filas), sin scroll interno.
8. **UI — categorías de skill sin traducir**: las opciones del filtro
   (`Language`, `Framework`, `Cloud`, `Database`, `Tool`, `Methodology`) se
   muestran en inglés en el sidebar, la pill activa y la descripción del
   chart — inconsistente con el resto de la UI (mismo tipo de bug ya
   corregido para nombres de país en la fase 010).

**Comprobado, sin impacto activo hoy**: `skills.category` acepta `'soft'`
en su `CHECK` de BD, pero el filtro del sidebar solo ofrece 6 categorías
(sin "Soft") — si algún día el pipeline de NLP etiqueta skills soft con
ofertas reales, se colarían en el "Todas" por defecto sin que el usuario
pueda filtrarlas, contradiciendo el propio texto del chart ("Skills
**técnicas**..."). Verificado en vivo que hoy no hay ninguna skill `soft`
con ofertas asociadas (`category=soft` → `rows: []`) — no se actúa, queda
documentado por si cambia en el futuro.

**Archivos afectados (previstos):** `api/src/index.js`,
`api/src/skillsQuery.js` (nuevo), `api/src/buildFilters.js`,
`api/schema.sql`, `api/__tests__/skillsQuery.test.js` (nuevo),
`api/__tests__/` (caso nuevo o actualizado para el periodo de
`skills/cooccurrence`), `src/services/jobServices.js`,
`src/components/Charts/TopSkillsChart.jsx`, `src/lib/filterUtils.js`,
`src/tests/components/Charts/TopSkillsChart.test.jsx`,
`src/mocks/handlers.js` (si hace falta ajustar el mock tras quitar
`pct_of_all_jobs`).

## Por qué

Mismo motivo que las rondas anteriores: verificar tabla por tabla que los
datos que se muestran son correctos y fiables a la BD real, que las
queries no son más costosas de lo necesario, y que los filtros se aplican
con la misma lógica ya acordada en las fases 011/012. Esta gráfica llevaba
desde la fase 007 (cambios solo visuales) sin una auditoría de datos/
rendimiento propia. El usuario solicitó una segunda pasada
centrada en semántica, lo cual llevó directamente al hallazgo 1 
(el filtro de periodo "miente" en dos endpoints), que no había salido en la
primera pasada centrada en filtros/rendimiento.

## Criterios de aceptación

- [ ] `GET /api/skills/top?periodo=all` y `GET /api/skills/cooccurrence?periodo=all`
      devuelven datos genuinamente sin restricción de fecha (distinto del
      resultado de periodo por defecto), verificado contra la BD real.
- [ ] `GET /api/skills/top` responde en un tiempo razonable (objetivo:
      &lt;2s, mismo orden de magnitud que el resto de endpoints tras sus
      índices) para al menos el caso sin filtros y `country=de`,
      verificado contra la BD real. `periodo=all` verificado igualmente
      tras el fix del punto anterior (puede necesitar su propio índice si
      resulta lento sin el cap de 90 días).
- [ ] `pct_of_all_jobs` deja de calcularse/exponerse (dato muerto con
      semántica rota) — la respuesta de `/api/skills/top` ya no incluye
      ese campo.
- [ ] `jornada` se excluye de `/api/skills/top` mediante un mecanismo
      testeable (reutilizando `stripKeys` de `buildFilters.js`), con un
      test que falle si alguien lo revierte por accidente.
- [ ] `v_top_skills_by_country` y `v_top_skills_global` eliminadas de
      `schema.sql`, documentado en el bloque de comentario existente.
- [ ] La SQL de `skills/top` vive en `api/src/skillsQuery.js`, con tests
      unitarios propios (mismo patrón que `salaryQuery.js`/`demandQuery.js`).
- [ ] La altura de `TopSkillsChart` tiene un techo razonable con scroll
      interno cuando hay muchas filas (verificado con `category` activo,
      hasta 50 filas).
- [ ] Las opciones de `skillCategoria` se muestran traducidas al español
      en el sidebar, la pill de filtro activo y la descripción del chart
      — el valor enviado a la API no cambia.
- [ ] `TopSkillsChart.test.jsx` cubre: `skillCategoria` activo (pill,
      texto, forma de la petición), aviso ⓘ de `jornada` activo, altura a
      escala realista.
- [ ] `npx vitest run` (frontend y `api/`) al 100%, sin regresiones.
- [ ] `npm run build` sin errores.
- [ ] Verificado contra la BD real (no solo mocks) donde sea posible.
- [ ] `.env.local` nunca leído en ningún momento de la feature.
- [ ] La landing no ha sido modificada.

## Fuera de alcance

- **Las 6 vistas SQL restantes sin usar** (`v_offers_by_country`,
  `v_salary_stats_by_country`, `v_remote_pct_by_country`,
  `v_job_trends_monthly`, `v_skill_cooccurrence`,
  `v_skills_with_market_context`) — confirmado por grep que tampoco las
  usa ningún endpoint, pero limpiarlas todas es un cambio más amplio que
  esta auditoría (que solo cubre Top Skills). Candidato a una futura ronda
  de limpieza de `schema.sql`.
- **Selector manual de skills** (tipo `RoleSelector`) — cambiaría el
  alcance de "auditoría de calidad" a "feature nueva de UX"; no se
  construye aquí.
- **Reescribir el texto del aviso de `jornada`** — revisado, ya es
  genérico y encaja correctamente con esta gráfica; no hace falta
  tocarlo.
- **Añadir "Soft" como opción de filtro de categoría** — no hay ninguna
  skill `soft` con ofertas reales hoy; añadir una opción de filtro vacía
  no aporta nada. Queda documentado como hallazgo latente.
- **Resto de correcciones/índices de `skills/cooccurrence`** (más allá
  del fix puntual de `periodo=all` del hallazgo 1) — el resto de esa
  gráfica ya se auditó y cerró en las fases 008/012; no se reabre aquí.
- **Índices/limpieza de las otras 4 gráficas** — ya cerrado en fases
  010/011/012, no se reabre aquí.
