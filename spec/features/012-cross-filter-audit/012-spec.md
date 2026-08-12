# 012 · Auditoría cruzada de filtros

**Estado:** hecho

> Quinta ronda "tabla por tabla", pero distinta a las anteriores: no
> audita una gráfica nueva, sino que revisa cómo interactúan los filtros
> del sidebar (país, periodo, contrato, jornada, remote, categoría de
> skill) **entre sí** y **contra las 5 gráficas ya construidas**
> (`TopSkillsChart`, `SalaryChart`, `DemandByRoleChart`, `EuropeMap`,
> `SkillHeatmap`). Tampoco es parte del rediseño Halo.

## Qué hace

Tras habilitar `jornada` en `DemandByRoleChart` (fase 011), el usuario
pidió comprobar que combinar filtros no corrompe los datos en ninguna de
las gráficas ya repasadas, y si falta algún filtro por aplicar en alguna
de ellas. Se investigó a fondo (backend: los 7 endpoints de
`api/src/index.js` + `buildFilters.js`; frontend: los 5 componentes) y se
discutió, filtro por filtro y gráfica por gráfica, el diseño original del
usuario contra lo implementado. Resultado:

1. **Bug real corregido**: `GET /api/skills/cooccurrence` no descartaba
   `contrato`/`remote` de la query string antes de pasarla a
   `buildFilters` — solo descartaba `country` y `jornada`. Si esos
   parámetros llegaran (hoy no ocurre porque el único caller ya los
   descarta antes), el endpoint los aplicaría silenciosamente,
   contradiciendo su propio comentario ("País, contrato, jornada y remote
   no aplican — datos globales") y el texto que la UI le promete al
   usuario. Corregido añadiéndolos al `strip`.
2. **Inconsistencia de UI corregida**: en `EuropeMap.jsx`, el prop
   `warning` (controla el icono ⓘ) solo declaraba `["pais"]` mientras
   `excludeFilters` (controla la pill) declaraba `["pais",
   "skillCategoria"]` — si el usuario activaba `skillCategoria`, la pill
   se ocultaba pero no aparecía ningún ⓘ explicando por qué. Alineados.
3. **Decisiones de diseño confirmadas, sin cambio de código** (documentado
   en detalle en `012-plan.md`): `jornada` se queda excluida de
   `TopSkillsChart` (se descarta la recomendación de la fase 011/inicio de
   esta feature de habilitarla — no aporta una pregunta de negocio real,
   a diferencia de `DemandByRoleChart`, donde sí se queda habilitada);
   `SkillHeatmap` mantiene país/contrato/jornada/remote excluidos (razón
   estadística: fragmentar la muestra deja pocas co-ocurrencias
   fiables); el filtro de categoría de skill en `SkillHeatmap` **ya
   funciona** con la semántica "ambas skills del par deben ser de la
   categoría" — descubierto durante esta auditoría que ya estaba
   implementado client-side (`heatmapUtils.js`), no hacía falta construir
   nada nuevo, solo se añade un test que lo deje documentado y protegido
   de regresiones.

**Archivos afectados:** `api/src/index.js`, `src/components/Charts/EuropeMap.jsx`,
`api/__tests__/` (test nuevo), `src/tests/lib/heatmapUtils.test.js` (test nuevo).

## Por qué

El usuario, tras ver que `jornada` estaba mal excluida en dos gráficas
(fase 011), se preocupó de que el mismo tipo de problema —filtros que se
combinan mal, o que faltan sin razón— pudiera estar ocurriendo en el
resto del dashboard sin que se hubiera detectado. 

La auditoría confirma que esa preocupación tenía fundamento real en un
caso (el bug de `/api/skills/cooccurrence`), y no en los demás — el resto
del dashboard ya aplicaba los filtros correctos según el diseño original
del usuario, con dos correcciones sobre el propio análisis inicial de esta
IA durante la discusión (documentadas en `012-plan.md` para que quede
constancia de qué se propuso primero y por qué se descartó).

## Criterios de aceptación

- [x] `GET /api/skills/cooccurrence?contrato=permanent` (o `remote=true`)
      devuelve exactamente el mismo resultado que sin esos parámetros —
      confirmado contra la BD real (peticiones concurrentes, JSON
      idéntico; `contrato=permanent` idéntico incluso en peticiones
      secuenciales).
- [x] `EuropeMap`: con `skillCategoria` activo, aparece el icono ⓘ
      explicando que ese filtro no afecta al mapa.
- [x] `heatmapUtils.test.js` documenta con un test explícito que, con una
      categoría activa, solo sobreviven pares donde ambas skills
      pertenecen a esa categoría.
- [x] `npx vitest run` (frontend y `api/`) sin regresiones — 350/350 y
      40/40.
- [x] `npm run build` sin errores.
- [x] `.env.local` nunca leído en ningún momento de la feature.
- [x] La landing no ha sido modificada.

## Fuera de alcance

- **Habilitar `jornada` en `TopSkillsChart`** — evaluado y descartado
  explícitamente; ver "Decisiones de diseño confirmadas" en `012-plan.md`.
- **Habilitar `país`/`contrato`/`jornada`/`remote` en `SkillHeatmap`** —
  evaluado y descartado; razón estadística documentada en `012-plan.md`.
- **Chart de tendencias estilo Halo** (idea nueva, surgida durante la
  discusión de esta feature) — encaja con la idea ya aparcada de
  restructurar el dashboard con header/rutas; no se planifica ni se
  implementa aquí.
- **`pct_of_all_jobs` mal etiquetado cuando `category` está activo en
  `/api/skills/top`** — detectado durante la auditoría, pero no se usa en
  ningún sitio del frontend (dato muerto); no se toca.
