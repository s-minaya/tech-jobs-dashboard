# 008 · Integridad de datos en la co-ocurrencia de skills

**Estado:** en curso

> A diferencia de las fases 001-007, esta feature no es parte del
> rediseño Halo — es un fix de integridad de datos en el heatmap
> "Co-ocurrencia de skills en ofertas de empleo". Se documenta con la
> misma rigurosidad SDD porque toca `api/` (zona normalmente congelada) y
> cambia el comportamiento observable de un componente ya existente.

## Qué hace

Corrige dos problemas relacionados que hacían que el heatmap de
co-ocurrencia de skills mostrara filas/columnas poco útiles: datos
incompletos/incorrectos en el backend, y un filtro de frontend demasiado
laxo que dejaba pasar skills con una única coincidencia residual.

**Archivos afectados:**
`api/src/index.js`, `src/mocks/handlers.js`, `src/lib/heatmapUtils.js`,
`src/components/Charts/SkillHeatmap.jsx`, `src/tests/lib/heatmapUtils.test.js`.

### Parte 1 — Backend: `co_count` fragmentado por `role_category`

La query de `GET /api/skills/cooccurrence` agrupaba por
`s1.name, s2.name, j.role_category`, fragmentando cada par real de
skills en varias filas (una por categoría de rol) con un `co_count`
parcial en vez del total real. `role_category` no se usa en ningún sitio
del frontend. Esto tenía dos efectos:

1. El `co_count` mostrado en el heatmap para un par podía ser mucho menor
   que la co-ocurrencia real (solo el fragmento de una categoría de rol).
2. El `LIMIT 1000` de la query se gastaba en duplicados fragmentados del
   mismo par en vez de cubrir pares distintos, dejando fuera pares reales
   — sobre todo en categorías de skill menos populares (confirmado con
   datos reales: 16 de 23 skills de la categoría "Database" quedaban
   eliminadas por el filtro de frontend, muchas de ellas con co-ocurrencia
   real que simplemente nunca entraba en el top-1000 fragmentado).

### Parte 2 — Frontend: umbral de conectividad insuficiente

`filterSkillsWithCoOccurrence` (que ya existe desde antes de esta sesión)
exige "al menos 1" co-ocurrencia real con otra skill del conjunto para
que una skill sobreviva en la matriz. Eso deja pasar filas casi vacías
con una única coincidencia residual — confirmado con datos reales tras el
fix de la Parte 1: skills como "Cassandra" o "Databricks" sobreviven con
solo 1 de 9 celdas con datos en la categoría "Database".

Se generaliza el filtro de "al menos 1 conexión" (1-core) a un umbral
configurable de conectividad mínima real (k-core): una skill sobrevive
solo si co-ocurre con al menos `minDegree` (2 por defecto) otras skills
del conjunto, y cada una de esas conexiones debe estar respaldada por al
menos `minEdgeCount` (2 por defecto) ofertas reales — para no contar como
"conexión" una coincidencia de una sola oferta compartida. Con conjuntos
muy pequeños (≤4 candidatas) se mantiene el criterio original, porque un
umbral de grado 2 sería desproporcionado con tan pocas skills para
comparar.

Todo el criterio se deriva en caliente de `pairs`/`co_count` reales en
cada fetch — nada hardcodeado ni listas manuales de skills "rivales" o
mutuamente excluyentes.

Lo que **no cambia**:

- La selección de skills candidatas (`selectSkills`) — sigue siendo por
  popularidad (`job_count`), no por conectividad.
- `buildLookup`, `buildJobCountMap`, `calcMaxPct`, `formatPct`,
  `getHeatmapTextColor` — sin cambios.
- `HeatmapSvg.jsx`, `HeatmapLegend.jsx` — el contrato de `skills` (array
  de strings) que reciben es idéntico; no necesitan cambios.
- El mensaje de "No hay skills para esta categoría con los filtros
  actuales" ya existente en `SkillHeatmap.jsx` sigue cubriendo el caso de
  que el filtro deje el conjunto vacío.

## Por qué

El heatmap mostraba filas/columnas sin sentido. Se investigó con datos
reales del backend (no simulados) y se confirmaron ambos problemas antes
de proponer el fix.

## Criterios de aceptación

- [ ] `GET /api/skills/cooccurrence` ya no agrupa por `role_category`;
      `co_count` es el total real agregado por par de skills.
- [ ] La respuesta de `/api/skills/cooccurrence` ya no incluye el campo
      `role_category` (no se usaba en el frontend).
- [ ] El mock de MSW en `src/mocks/handlers.js` refleja la misma forma
      (sin `role_category`).
- [ ] `filterSkillsWithCoOccurrence` exige un grado mínimo de conexión
      configurable (`minDegree`, default 2) y un piso mínimo de conteo
      por conexión (`minEdgeCount`, default 2), en vez de "al menos 1
      conexión sin piso".
- [ ] Con conjuntos de candidatas pequeños (≤4), el filtro usa el
      criterio original (≥1 conexión, sin piso) para no vaciar categorías
      con pocas skills populares.
- [ ] La firma de `filterSkillsWithCoOccurrence(skills, pairs, options)`
      es retrocompatible — la llamada actual sin tercer argumento en
      `SkillHeatmap.jsx` sigue funcionando con los defaults.
- [ ] Verificado con datos reales del backend (no solo tests unitarios):
      la vista "Todas" no pierde skills; la vista "Database" elimina
      exactamente las skills de conexión residual (Databricks, Snowflake,
      BigQuery, Cassandra) y conserva las bien conectadas.
- [ ] `npx vitest run` pasa al 100% en frontend y en `api/`, incluyendo
      tests nuevos para el criterio k-core (grado insuficiente, piso de
      conteo, cascada de eliminación, conjunto pequeño, opciones
      personalizables, estabilidad).
- [ ] `npm run build` sin errores.
- [ ] La landing no ha sido modificada.

## Fuera de alcance

- Cambiar `selectSkills` para preferir skills bien conectadas en vez de
  las más populares (opción descartada — más compleja y menos
  predecible).
- Listas manuales/hardcodeadas de skills mutuamente excluyentes (opción
  descartada — rompe el requisito de que todo sea dinámico con la BD).
- Solo aclarar en la UI que las celdas vacías son esperables, sin tocar
  el filtrado (opción descartada — hace falta una solución de datos, no
  de copy).
- Umbral de relevancia relativa (`% mínimo respecto a job_count`) —
  diseñado como posible extensión futura pero no implementado ahora: no
  hay datos suficientes para calibrar un porcentaje sin introducir un
  número igual de arbitrario que el que se quiere evitar.
- Optimizar el algoritmo de filtrado a `O(n + m)` (k-core peeling con
  cola de prioridad) — con `n ≤ 50` skills el `O(n³)` actual (mismo orden
  que la implementación previa) no tiene impacto de rendimiento
  perceptible.
- Cualquier cambio en `api/` fuera de esta query concreta.
