// demandQuery.js
// Lógica pura de GET /api/jobs/demand-by-role, separada de index.js para
// poder testearla sin BD ni Express — mismo patrón que buildFilters.js y
// salaryQuery.js.
//
// No selecciona ni agrupa por country_code: el frontend (DemandByRoleChart)
// nunca desglosa por país, siempre suma la demanda de un rol en un mes
// entre todos los países que pasan el filtro — igual que ocurría con
// role_category en /api/skills/cooccurrence (fase 008). Antes, agrupar por
// country_code fragmentaba cada (mes, rol) en hasta 8 filas (una por país)
// que el frontend tenía que volver a sumar; con "Todos" los países
// seleccionado (el filtro por defecto), pivotData se quedaba solo con la
// última fila que llegaba de Postgres en vez de sumarlas, infrarrepresentando
// la demanda real sin ningún error visible (ver fase 011). Quitar
// country_code del SELECT/GROUP BY resuelve el bug en el origen — el
// filtro `country=` sigue funcionando igual (condición del WHERE,
// independiente de qué columnas se seleccionan).
//
// Combina el total en la misma query con SUM(COUNT(*)) OVER() — mismo
// patrón que /api/salary/by-role-country (fase 010) — en vez de una
// segunda query COUNT(DISTINCT j.id) aparte.

/**
 * @param {string[]} conditions - condiciones SQL ya construidas (buildFilters + extras)
 * @returns {{ text: string }}
 */
export function buildDemandByRoleQuery(conditions) {
  return {
    text: `SELECT
       DATE_TRUNC('month', j.posted_at) AS month,
       j.role_category,
       COUNT(*) AS job_count,
       SUM(COUNT(*)) OVER ()::int AS total_matching_jobs
     FROM jobs j
     WHERE ${conditions.join(" AND ")}
     GROUP BY DATE_TRUNC('month', j.posted_at), j.role_category
     ORDER BY month ASC, j.role_category ASC`,
  };
}

// shapeDemandRows
// Separa total_matching_jobs (idéntico en todas las filas, viene de la
// window function) del resto de columnas para no repetirlo en cada fila
// de la respuesta JSON — mismo patrón que shapeSalaryRows.
export function shapeDemandRows(rows) {
  const total_matching_jobs = rows[0]?.total_matching_jobs ?? 0;
  return {
    rows: rows.map(({ total_matching_jobs: _t, ...row }) => row),
    total_matching_jobs,
  };
}
