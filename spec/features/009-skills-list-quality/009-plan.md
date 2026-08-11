# 009 · Calidad de datos en el autocomplete de skills del mapa — Plan

## Enfoque

Un único cambio de una query SQL en `api/src/index.js`. Sin cambios de
frontend — `SkillAutocomplete.jsx` ya filtra correctamente (substring
case-insensitive) sobre lo que reciba; el problema era exclusivamente la
calidad de los datos que le llegaban desde `/api/skills/list`.

## Implementación

### `api/src/index.js` — endpoint `GET /api/skills/list`

```sql
-- Antes:
SELECT name, category
FROM skills
ORDER BY name ASC

-- Después:
SELECT s.name, s.category
FROM skills s
WHERE EXISTS (
  SELECT 1
  FROM job_skills js
  JOIN jobs j ON j.id = js.job_id
  WHERE js.skill_id = s.id
    AND j.is_active = TRUE
)
ORDER BY s.name ASC
```

`EXISTS` como semi-join — más directo que `JOIN + GROUP BY + HAVING`
para "¿tiene al menos una oferta activa?", sin necesitar agregar ni
contar. Actualizar el comentario de cabecera del endpoint (líneas 39-43)
explicando el cambio de criterio, con el dato concreto (34 de 35
coincidencias de "react" eran basura sin ninguna oferta).

No se toca la forma de la respuesta (`res.json(result.rows)`, array de
`{name, category}`) — ningún consumidor (`getSkillsList()` en
`jobServices.js`, `SkillAutocomplete.jsx`, `EuropeMap.jsx`) necesita
cambios.

### `api/src/index.js` — endpoint `GET /api/stats/summary` (`total_skills`)

Análisis de impacto exhaustivo (pedido explícito del usuario) tras el
primer fix: mismo root cause exacto en el KPI "Skills rastreadas", que
lee `total_skills` de este endpoint y se muestra tanto en
`SummaryStats.jsx` (hero del dashboard) como en `LandingPage.jsx` (zona
congelada). Mismo patrón de fix, en la misma subquery:

```sql
-- Antes:
(SELECT COUNT(*) FROM skills) AS total_skills,

-- Después:
(SELECT COUNT(*)
 FROM skills s
 WHERE EXISTS (
   SELECT 1
   FROM job_skills js
   JOIN jobs j ON j.id = js.job_id
   WHERE js.skill_id = s.id
     AND j.is_active = TRUE
 ))                            AS total_skills,
```

No toca ningún archivo de `src/components/landing/` — es un cambio de
backend puro, la landing solo deja de recibir un número desactualizado.
Ambos endpoints quedan con el mismo criterio, así que `total_skills`
(KPI) y el tamaño de `/api/skills/list` (autocomplete) coinciden.

### `src/components/ui/SkillAutocomplete.jsx` — comentario de prop

El comentario del prop `skills` decía "con todas las skills de la BD" —
desactualizado. Se actualiza a algo que refleje el nuevo criterio. Sin
cambio de comportamiento ni de lógica.

## Decisiones

- **`EXISTS` con `is_active = TRUE`, no "cualquier vínculo histórico"**
  — el criterio más fiel al comentario original del endpoint ("todas las
  skills conocidas, independientemente de si tienen ofertas recientes")
  habría sido no filtrar por `is_active`, solo exigir que la skill
  tuviera *alguna* fila en `job_skills` alguna vez. Justificación adicional:
  el propio mapa (`/api/jobs/offers-by-country`) ya solo muestra ofertas
  activas — sugerir en el autocomplete una skill sin ninguna oferta
  activa siempre llevaría a un resultado vacío en el mapa, que es
  exactamente la confusión que se quiere evitar.
- **`EXISTS` en vez de `JOIN ... GROUP BY ... HAVING COUNT(*) > 0`** —
  semánticamente más directo (solo necesitamos saber si existe al menos
  una fila, no contarlas), y evita agrupar 4557 filas para luego
  filtrar por HAVING.
- **`/api/stats/summary` sí se toca, tras análisis de impacto** — se
  había documentado inicialmente como fuera de alcance, pero el usuario
  pidió explícitamente un análisis exhaustivo de todo lo afectado por
  este cambio, y esto salió como la inconsistencia más visible (mismo
  root cause exacto, mismo endpoint que ya se estaba tocando, cambio de
  2 líneas). Se decidió corregirlo en la misma feature en vez de
  diferirlo.

## Riesgos

- **Rendimiento del `EXISTS`** — con 4557 filas en `skills` y un índice
  ya existente en `job_skills (skill_id)` (confirmado en
  `api/schema.sql`: `idx_job_skills_skill`) y en `jobs (is_active)`
  (`idx_jobs_active`), el semi-join debería resolverse rápido. Se
  verifica con el tiempo de respuesta real del endpoint contra el
  backend en marcha, no solo con `EXPLAIN`.
- **Reducir demasiado la lista** — mitigado verificando que, tras el
  cambio, sigan apareciendo skills claramente reales y variadas (no solo
  "React"/"Python"), no solo el puñado más popular.

## Verificación

1. Contra el backend real (`localhost:3000`, con `node --watch` —
   recoge el cambio solo al guardar): repetir el experimento ya hecho en
   esta sesión — pedir `/api/skills/list`, filtrar por "react" en el
   resultado, confirmar que baja de 35 a 1 (solo "React"). Repetir con
   2-3 términos más (ej. "angular", "python", "sql") para confirmar que
   no se pierde ninguna skill real conocida.
2. Confirmar que el array de respuesta completo baja de 4557 a un orden
   de magnitud menor (cientos, no miles).
2b. Contra el backend real: pedir `/api/stats/summary` y confirmar que
    `total_skills` coincide exactamente con el tamaño de la lista
    filtrada de `/api/skills/list`.
3. `npx vitest run` en frontend — no debería haber tests rotos (ningún
   archivo de frontend cambia, los mocks de test siguen igual).
4. `npx vitest run` en `api/` — sin regresiones (no hay test de ruta
   para este endpoint, igual que en la 008).
5. `npm run build` sin errores.
6. Confirmar que `api/schema.sql` sigue fuera de git
   (`git status --short` no debe listarlo) y que la landing no se ha
   tocado.
