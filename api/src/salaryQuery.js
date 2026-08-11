// salaryQuery.js
// Lógica pura de GET /api/salary/by-role-country, separada de index.js
// para poder testearla sin BD ni Express — mismo patrón que buildFilters.js.
//
// Combina en una sola query (antes eran dos en Promise.all: la agregación
// y un COUNT(DISTINCT j.id) aparte con el mismo WHERE, dos escaneos de
// `jobs`) el total con SUM(COUNT(*)) OVER() — mismo patrón que
// /api/skills/top (pct_of_all_jobs). Es seguro sumar todos los grupos sin
// duplicar: cada job pertenece a un único (country_code, role_category).

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
