// salaryQuery.js
// Lógica pura de GET /api/salary/by-role-country, separada de index.js
// para poder testearla sin BD ni Express — mismo patrón que buildFilters.js.
//
// Combina en una sola query (antes eran dos en Promise.all: la agregación
// y un COUNT(DISTINCT j.id) aparte con el mismo WHERE, dos escaneos de
// `jobs`) el total con SUM(COUNT(*)) OVER() — mismo patrón que usaba
// /api/skills/top para pct_of_all_jobs (campo eliminado en la fase 013,
// se calculaba mal con category activo y nadie lo consumía; skills/top
// sigue con dos queries porque category solo afecta a una de las dos —
// ver skillsQuery.js). Es seguro sumar todos los grupos sin duplicar:
// cada job pertenece a un único (country_code, role_category).

// salaryQualityConditions
// "Salario declarado y verificado ≥ 1.000€" — salary_mid < 1000 son
// datos corruptos del pipeline (ver el handler de este endpoint en
// index.js). Antes de la fase 014 esta misma regla estaba copiada como
// SQL crudo en 2 sitios independientes (aquí, vía conditions.push, y en
// /api/stats/summary para pct_with_salary) más el índice
// idx_jobs_salary_by_role_country en schema.sql — mismo patrón de
// fragilidad que TOP_SKILLS_IGNORED_FILTERS/applyDefaultPeriodoFallback
// en buildFilters.js (fases 012/013): si el umbral cambia en un sitio y
// no en los demás, un KPI deja de coincidir con otro en silencio.
// Centralizada aquí (salaryQuery.js es el dueño natural de esta regla de
// negocio) y reusada por statsQuery.js. Recibe el alias de `jobs` como
// parámetro (función, no array fijo) porque statsQuery.js necesita
// aplicar la misma regla con alias distintos en subconsultas propias
// (j2/j3) sin colisionar con el alias `j` de la query principal.
//
// Techo dirigido contra outliers de origen (fase 015): verificado en
// vivo que 32 ofertas activas (31 en NL + 1 en FR) comparten el patrón
// salary_min = salary_max Y contract_time IS NULL Y salary_mid >=
// 500.000 — entre ellas, 31 valores IDÉNTICOS de exactamente 500.000€
// repartidos en decenas de títulos sin relación (AI Engineer, Business
// Analyst, Test Engineer, Project Manager...), la firma típica de un
// valor tope/placeholder del origen, no de 31 coincidencias reales; la
// oferta restante (1.904.448€, "Formation Monteur Réseaux", un puesto de
// formación) es igual de imposible por sí sola. El resto de ofertas con
// el mismo patrón estructural (salary_min = salary_max, sin jornada
// declarada) pero por debajo de 500.000€ se dejan intactas — no muestran
// el mismo patrón de duplicado exacto y no hay evidencia de que sean
// corruptas, así que excluirlas sin más sería inventar un criterio sin
// respaldo. 500.000€ como corte es el valor real más bajo del cluster
// corrupto confirmado; el máximo país-por-país fuera de este cluster
// (ES, 496.928€, único, no duplicado) queda justo por debajo, así que el
// corte no recorta ningún valor alto pero legítimo detectado hasta
// ahora. Ver spec/features/015-business-logic-audit/015-spec.md
// sección 2.3 para el detalle completo de la evidencia.
export function salaryQualityConditions(alias = "j") {
  return [
    `${alias}.salary_mid IS NOT NULL`,
    `${alias}.salary_is_predicted = FALSE`,
    `${alias}.salary_mid >= 1000`,
    `NOT (${alias}.salary_min = ${alias}.salary_max AND ${alias}.contract_time IS NULL AND ${alias}.salary_mid >= 500000)`,
  ];
}

/**
 * @param {string[]} conditions - condiciones SQL ya construidas (buildFilters + extras)
 * @returns {{ text: string }}
 */
export function buildSalaryByRoleCountryQuery(conditions) {
  return {
    text: `SELECT
       j.country_code,
       c.name AS country_name,
       j.role_category,
       COUNT(*) AS job_count,
       ROUND(AVG(j.salary_mid)) AS avg_salary_eur,
       ROUND(
         PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY j.salary_mid)::numeric
       ) AS median_salary_eur,
       SUM(COUNT(*)) OVER ()::int AS total_matching_jobs
     FROM jobs j
     JOIN countries c ON c.code = j.country_code
     WHERE ${conditions.join(" AND ")}
     GROUP BY j.country_code, c.name, j.role_category
     ORDER BY j.country_code, median_salary_eur DESC NULLS LAST`,
  };
}

// shapeSalaryRows
// Separa total_matching_jobs (idéntico en todas las filas, viene de la
// window function) del resto de columnas para no repetirlo en cada fila
// de la respuesta JSON.
export function shapeSalaryRows(rows) {
  const total_matching_jobs = rows[0]?.total_matching_jobs ?? 0;
  return {
    rows: rows.map(({ total_matching_jobs: _t, ...row }) => row),
    total_matching_jobs,
  };
}
