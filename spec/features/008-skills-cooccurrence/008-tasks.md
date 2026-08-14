# 008 · Integridad de datos en la co-ocurrencia de skills — Tareas

## Parte 1 — Backend

- [x] `api/src/index.js`: quitado `j.role_category` del `SELECT` y del
  `GROUP BY` de `/api/skills/cooccurrence`. Añadido comentario explicando
  la fragmentación que causaba y por qué no se reintroduce.
- [x] `src/mocks/handlers.js`: quitado `role_category` de los 3 pares de
  ejemplo del mock, para reflejar la forma real de la respuesta.
- [x] Verificado contra el backend real (`localhost:3000`): la respuesta
  ya no incluye `role_category`, y los `co_count` son notablemente más
  altos que antes (totales reales agregados, no fragmentos por rol —
  ej. "DevOps"+"CI/CD" pasó de 1322 en un fragmento a 2796 real).

## Parte 2 — Frontend

- [x] `src/lib/heatmapUtils.js`: `filterSkillsWithCoOccurrence` reescrita
  con criterio k-core (`minDegree=2`, `minEdgeCount=2` por defecto,
  fallback a `minDegree=1, minEdgeCount=1` con `skills.length <= 4`).
  Firma retrocompatible (tercer parámetro opcional).
- [x] `src/components/Charts/SkillHeatmap.jsx`: comentario de las líneas
  ~102-106 actualizado para reflejar el nuevo criterio. Sin cambios de
  código (la llamada existente sigue funcionando con los defaults).
- [x] `src/tests/lib/heatmapUtils.test.js`: nuevo `describe` con 7 tests
  para el criterio k-core (grado insuficiente, piso de conteo, cascada,
  conjunto pequeño, opciones personalizables ×2, estabilidad). Los 5
  tests existentes sin cambios de aserciones (comentario añadido
  aclarando que ejercitan el camino de conjunto pequeño).
- [x] **Hallazgo no previsto en el plan:** el mock global de
  `/api/skills/cooccurrence` en `src/mocks/handlers.js` (usado por
  `SkillHeatmap.test.jsx`) solo tenía 3 pares formando dos parejas
  aisladas de grado 1 entre las 5 skills de `/api/skills/top` —
  suficiente para el criterio antiguo ("≥1 conexión") pero no para el
  nuevo umbral k-core, así que 2 tests de `SkillHeatmap.test.jsx`
  empezaron a fallar (el heatmap por defecto quedaba vacío con datos de
  mock no representativos de un dataset real bien conectado). Se
  enriqueció el mock con 3 pares adicionales para que las 5 skills
  alcancen grado ≥2 entre sí — igual que se observó en datos reales,
  donde las skills más populares sí están bien conectadas. No se tocó
  ninguna aserción de test, solo la fixture de datos.

## Verificación

- [x] `npx vitest run` en `api/` — 20/20, sin regresiones.
- [x] `npx vitest run` en frontend — 316/316 (309 previos + 7 nuevos).
- [x] `npm run build` sin errores.
- [x] Reverificado contra el backend real con un script desechable
  (`verify-cooccurrence.local.mjs`, importando la función real de
  producción, no una reimplementación) — mismo resultado ya validado
  antes de escribir la spec: Todas 15/15 conservadas; Database 23→6
  (PostgreSQL, SQL Server, MongoDB, MySQL, Elasticsearch, Redis); Tool
  50→20. Script eliminado tras la verificación.
- [x] Confirmado que la landing no se ha tocado
  (`git status --short -- src/components/landing/` vacío).

## Cierre

- [x] Validado contra todos los criterios de aceptación de `008-spec.md`
  (ver detalle abajo).
- [x] `spec/README.md` actualizado — `008-skills-cooccurrence/` insertado
  en el listado de estructura, `halo-responsive-pulido` renumerado a 009.
- [x] `spec/constitution/roadmap.md` actualizado — feature 008 en
  "En curso 🔜" con resumen, backlog renumerado (Halo Responsive y
  Pulido pasa a 009). Se deja en "En curso" en vez de "Hecho" hasta el
  commit, mismo patrón que el resto de fases.
- [ ] Commit (solo tras confirmación explícita). Dos commits separados,
  ya que son cambios independientes:
  - `fix: aggregate skill co-occurrence counts without role_category fragmentation`
  - `feat: require minimum connectivity threshold in skill co-occurrence heatmap`

### Validación contra `008-spec.md`

- [x] `/api/skills/cooccurrence` ya no agrupa por `role_category`;
  `co_count` es el total real agregado.
- [x] La respuesta ya no incluye `role_category`.
- [x] El mock de MSW refleja la misma forma.
- [x] `filterSkillsWithCoOccurrence` exige `minDegree`/`minEdgeCount`
  configurables (default 2/2) en vez de "≥1 sin piso".
- [x] Conjuntos ≤4 usan el criterio original.
- [x] Firma retrocompatible — `SkillHeatmap.jsx` no necesitó cambios de
  código, solo de comentario.
- [x] Verificado con datos reales: Todas sin pérdidas; Database elimina
  exactamente las de conexión residual.
- [x] `npx vitest run` 100% en frontend y `api/`.
- [x] `npm run build` sin errores.
- [x] Landing sin modificar.
