# 008 · Integridad de datos en la co-ocurrencia de skills — Plan

## Enfoque

Dos partes independientes pero relacionadas, en orden: primero el backend
(la Parte 2 depende de tener datos correctos para validarse contra
realidad), luego el frontend.

La Parte 1 (backend) ya se implementó y se verificó contra el servidor
real (`localhost:3000`, backend del propio usuario) durante la
investigación previa a escribir esta spec — se documenta aquí igualmente
para que quede trazada en `tasks.md` como el resto de fases. La Parte 2
(frontend) se diseñó y se validó con un script de reproducción contra
datos reales ya descargados, pero el código de producción aún no se ha
escrito — es el trabajo pendiente de esta fase.

## Implementación

### 1. Backend — `api/src/index.js`, endpoint `/api/skills/cooccurrence`

Quitar `j.role_category` del `SELECT` y del `GROUP BY`:

```sql
-- Antes:
SELECT
   s1.name AS skill,
   s2.name AS co_skill,
   j.role_category,
   COUNT(DISTINCT js1.job_id) AS co_count
 FROM job_skills js1
 JOIN job_skills js2 ON js1.job_id = js2.job_id AND js1.skill_id < js2.skill_id
 JOIN skills s1 ON s1.id = js1.skill_id
 JOIN skills s2 ON s2.id = js2.skill_id
 JOIN jobs j ON j.id = js1.job_id
 WHERE ${conditions.join(" AND ")}
 GROUP BY s1.name, s2.name, j.role_category
 ORDER BY co_count DESC
 LIMIT 1000

-- Después:
SELECT
   s1.name AS skill,
   s2.name AS co_skill,
   COUNT(DISTINCT js1.job_id) AS co_count
 FROM job_skills js1
 JOIN job_skills js2 ON js1.job_id = js2.job_id AND js1.skill_id < js2.skill_id
 JOIN skills s1 ON s1.id = js1.skill_id
 JOIN skills s2 ON s2.id = js2.skill_id
 JOIN jobs j ON j.id = js1.job_id
 WHERE ${conditions.join(" AND ")}
 GROUP BY s1.name, s2.name
 ORDER BY co_count DESC
 LIMIT 1000
```

`JOIN jobs j` se mantiene — sigue haciendo falta para las condiciones del
`WHERE` (`buildFilters` genera condiciones sobre `j.*`) y para la query
de `total_matching_jobs`. Añadir un comentario explicando por qué
`role_category` no va en el `GROUP BY` (para que nadie lo reintroduzca
sin leer el porqué).

### 2. `src/mocks/handlers.js` — mock de `/api/skills/cooccurrence`

Quitar el campo `role_category` de los 3 objetos de ejemplo en `pairs`,
para que el mock refleje la forma real de la respuesta tras el fix.

### 3. `src/lib/heatmapUtils.js` — `filterSkillsWithCoOccurrence`

Generalizar de "1-core" (≥1 conexión) a "k-core" (grado mínimo + piso de
conteo por conexión), con fallback para conjuntos pequeños:

```js
const SMALL_SET_THRESHOLD = 4;

export function filterSkillsWithCoOccurrence(
  skills,
  pairs,
  { minDegree = 2, minEdgeCount = 2 } = {},
) {
  // Mapa de magnitud (no solo existencia) — hace falta para poder
  // descartar conexiones respaldadas por muy pocas ofertas.
  const countMap = new Map();
  for (const { skill, co_skill, co_count } of pairs) {
    const count = Number(co_count);
    countMap.set(`${skill}|${co_skill}`, count);
    countMap.set(`${co_skill}|${skill}`, count);
  }

  // Con conjuntos muy pequeños (categorías con pocas skills populares),
  // exigir grado >= 2 sería desproporcionado: con n<=4 candidatas el
  // grado máximo posible es 3, y pedir >=2 exige conectar con la mayoría
  // del conjunto sin margen para distinguir señal de ruido. El umbral
  // efectivo se calcula UNA vez sobre el tamaño inicial (no se recalcula
  // por pasada) para que el peeling converja de forma monótona.
  const isSmallSet = skills.length <= SMALL_SET_THRESHOLD;
  const effectiveMinDegree = isSmallSet ? 1 : minDegree;
  const effectiveMinEdgeCount = isSmallSet ? 1 : minEdgeCount;

  let current = [...skills];
  let changed = true;

  while (changed) {
    changed = false;
    const next = current.filter((skill) => {
      let degree = 0;
      for (const other of current) {
        if (other === skill) continue;
        const count = countMap.get(`${skill}|${other}`) ?? 0;
        if (count >= effectiveMinEdgeCount) degree++;
      }
      return degree >= effectiveMinDegree;
    });
    if (next.length !== current.length) {
      current = next;
      changed = true;
    }
  }

  return current;
}
```

Actualizar el comentario de cabecera de la función explicando el cambio
de criterio y el porqué del fallback de conjunto pequeño.

### 4. `src/components/Charts/SkillHeatmap.jsx`

Sin cambios funcionales — `filterSkillsWithCoOccurrence(skillsCandidatas, pairs)`
sigue funcionando igual gracias a los defaults del tercer parámetro.
Actualizar solo el comentario de las líneas ~102-106 para reflejar el
nuevo criterio (conectividad mínima real, no solo "al menos una").

No hace falta reordenar `buildLookup`/`buildJobCountMap`: el criterio
elegido no usa `jobCountMap`, solo `pairs`, que ya está disponible en el
momento actual de la llamada.

### 5. `src/tests/lib/heatmapUtils.test.js`

Los 5 tests existentes de `filterSkillsWithCoOccurrence` (líneas 199-239)
no requieren cambios de aserciones — todos usan n≤4, caen en el fallback
de conjunto pequeño y siguen ejercitando el criterio de compatibilidad.
Añadir un comentario aclarando que cubren específicamente ese camino.

Añadir un nuevo `describe` con fixtures de skills de base de
datos/DevOps (para que se lean como el caso real reportado):

1. Elimina skills con una sola conexión aunque tenga muchas ofertas
   (grado insuficiente) — conserva las bien conectadas.
2. No cuenta como conexión válida una co-ocurrencia con `co_count` por
   debajo de `minEdgeCount` (coincidencia de una sola oferta).
3. Propaga la eliminación en cascada — una skill pierde su única conexión
   válida cuando su vecino también es eliminado.
4. Con conjunto pequeño (≤4 candidatas) usa el criterio original
   (≥1 conexión, sin piso de conteo).
5. Permite personalizar `minDegree` vía opciones.
6. Permite personalizar `minEdgeCount` vía opciones — usar un fixture de
   n=5 (no n=3) para esta prueba en concreto, para que el fallback de
   conjunto pequeño no enmascare el override explícito de las opciones.
7. Estabilidad — resultado idéntico en llamadas repetidas con el nuevo
   criterio.

## Decisiones

- **k-core en vez de umbral por porcentaje** — el síntoma reportado es de
  *grado* (filas con 1/9, 1/14 celdas llenas), no de magnitud. Un umbral
  por `%` necesitaría calibrarse contra la distribución real de
  `co_count`, que varía mucho entre skills de `job_count` muy dispar
  (Python ~2065 vs. una skill de nicho ~20) — introduciría un número
  igual de arbitrario que el problema que se quiere evitar. Se deja
  diseñado como extensión futura (`minEdgePct`), no implementado ahora.
- **`minDegree=2, minEdgeCount=2` por defecto** — validado contra datos
  reales del backend ya corregido (ver sección Riesgos/Verificación):
  elimina exactamente las filas de conexión residual (1/9, 1/14 celdas)
  y conserva las que tienen conectividad real (2/14, 3/9 celdas).
  Incremento mínimo desde el "≥1" actual — si tras usarlo el usuario
  sigue viendo filas que no tienen sentido, subir a `minDegree=3` es un
  cambio de un solo número gracias a la firma con opciones.
- **`SMALL_SET_THRESHOLD = 4`** — con `n` candidatas el grado máximo
  posible es `n-1`. Con `n≤4`, exigir `minDegree=2` sería exigir conectar
  con la mayoría o el 100% del conjunto — una muestra tan chica no
  permite distinguir señal de ruido con ese rigor. El umbral se computa
  sobre el tamaño **inicial** del conjunto candidato, no se recalcula por
  pasada, para que el peeling no cambie de régimen a mitad de camino.
- **Piso de conteo (`minEdgeCount`) además de grado (`minDegree`)** —
  sin él, una skill podría alcanzar `minDegree=2` con dos coincidencias
  de 1 oferta compartida cada una (ruido, no señal real). No depende de
  `job_count`, así que no necesita calibración contra una distribución
  desconocida.
- **Backend antes que frontend** — el fix de `role_category` no es
  opcional para que el fix de frontend tenga sentido: sin datos reales
  agregados correctamente, cualquier umbral en el frontend estaría
  filtrando sobre datos ya incompletos por la fragmentación del backend.

## Riesgos

- **Categorías con muy pocas skills quedan casi vacías** — mitigado por
  el fallback de conjunto pequeño (`SMALL_SET_THRESHOLD=4`) y por el
  mensaje ya existente de "No hay skills para esta categoría" si el
  filtro deja el conjunto vacío del todo.
- **El umbral por defecto resulta ser demasiado o muy poco agresivo en
  producción** — mitigado por la firma con opciones (`minDegree`,
  `minEdgeCount` configurables sin tocar la lógica interna) y por haber
  validado los valores por defecto contra datos reales de 3 vistas
  distintas (Todas, Database, Tool) antes de fijarlos, no solo con datos
  sintéticos de test.
- **Cambio de comportamiento observable sin cobertura de test previa** —
  mitigado añadiendo tests nuevos que cubren específicamente el criterio
  k-core (no solo mantener los 5 tests existentes, que por usar n≤4 no
  lo ejercitan).

## Verificación

1. `npx vitest run` en `api/` — no debería verse afectado (no hay test a
   nivel de ruta para `/api/skills/cooccurrence`, solo de `buildFilters`,
   que no se toca).
2. `npx vitest run` en frontend — deben pasar los 5 tests existentes +
   los nuevos, sin romper el resto de la suite.
3. `npm run build` sin errores.
4. Contra el backend real (`localhost:3000`, ya en marcha): reconfirmar
   con un script desechable (`*.local.mjs`, limpiado al terminar) que el
   endpoint ya no devuelve `role_category` y que el nuevo criterio de
   `filterSkillsWithCoOccurrence` aplicado a esos datos reales da el
   mismo resultado que el ya validado manualmente (Todas: 15/15
   conservadas; Database: 10→6; Tool: 28→20).
5. Confirmar que la landing no se ha tocado.
