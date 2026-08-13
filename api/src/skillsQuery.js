// skillsQuery.js
// Lógica pura de GET /api/skills/top, separada de index.js para poder
// testearla sin BD ni Express — mismo patrón que buildFilters.js,
// salaryQuery.js y demandQuery.js. A diferencia de esos dos, aquí hacen
// falta DOS queries con condiciones distintas (la de filas admite
// `category`, la del total nunca la lleva) en vez de una sola query con
// SUM(...) OVER() — por eso buildTopSkillsQueries devuelve las dos ya
// completas (text + values) en vez de solo `conditions` para que el
// caller las combine.
//
// pct_of_all_jobs se eliminó (fase 013): se calculaba con
// SUM(COUNT(*)) OVER() sobre las filas YA filtradas por `category`, pero
// total_matching_jobs viene de una query que nunca incluye `category` —
// con una categoría activa, el campo pasaba a significar "% dentro de la
// categoría" sin cambiar de nombre. Ningún componente del frontend lo
// consumía (confirmado por grep, solo aparecía en el mock de test), así
// que se quita en vez de arreglar una fórmula que nadie leía.
//
// countQuery ya NO hace JOIN a job_skills (fase 013): antes contaba solo
// jobs con al menos una skill extraída — verificado en vivo que eso es
// solo ~30% de los jobs activos/recientes (68.062 de 227.160), un ~70%
// de las ofertas no tiene ninguna skill en job_skills. total_matching_jobs
// se renderiza como el mismo badge "X ofertas" que todas las demás
// gráficas (ChartDescription), que sí cuentan TODAS las ofertas activas
// que coinciden con los filtros sin exigir ninguna relación con skills
// (SalaryChart, DemandByRoleChart, EuropeMap) — con el JOIN, el usuario
// vería un número muy distinto en esta gráfica sin ninguna explicación
// para el mismo estado de filtros. Contar directamente sobre `jobs` iguala
// la semántica con el resto del dashboard, y de paso es ~15x más rápido
// (sin el JOIN a job_skills, Postgres no necesita tocar esa tabla en
// absoluto para este cálculo).

import {
  buildFilters,
  stripKeys,
  TOP_SKILLS_IGNORED_FILTERS,
  applyDefaultPeriodoFallback,
} from "./buildFilters.js";

/**
 * @param {Object} query - req.query de Express
 * @returns {{ rowsQuery: {text: string, values: any[]}, countQuery: {text: string, values: any[]} }}
 */
export function buildTopSkillsQueries(query) {
  const filtrosAplicables = stripKeys(query, TOP_SKILLS_IGNORED_FILTERS);
  const { conditions: conditionsJobs, values } = buildFilters(filtrosAplicables);

  applyDefaultPeriodoFallback(conditionsJobs, filtrosAplicables);

  // Clonamos ANTES de añadir category para que el COUNT no reciba ese
  // valor extra ("bind message supplies N parameters, but prepared
  // statement requires M" en PostgreSQL).
  const valuesForCount = [...values];

  const conditionsWithSkills = [...conditionsJobs];
  const rowValues = [...values];
  if (filtrosAplicables.category) {
    rowValues.push(filtrosAplicables.category.toLowerCase());
    conditionsWithSkills.push(`s.category = $${rowValues.length}`);
  }

  // Con una categoría activa hay menos skills candidatas por grupo, así
  // que se admite un LIMIT mayor sin perder la utilidad del "top N".
  const limit = filtrosAplicables.category ? 50 : 20;
  rowValues.push(limit);

  return {
    rowsQuery: {
      text: `SELECT
         s.name AS skill,
         s.category AS skill_category,
         COUNT(*) AS job_count
       FROM job_skills js
       JOIN jobs j ON j.id = js.job_id
       JOIN skills s ON s.id = js.skill_id
       WHERE ${conditionsWithSkills.join(" AND ")}
       GROUP BY s.name, s.category
       ORDER BY job_count DESC
       LIMIT $${rowValues.length}`,
      values: rowValues,
    },
    countQuery: {
      text: `SELECT COUNT(*)::int AS total
       FROM jobs j
       WHERE ${conditionsJobs.join(" AND ")}`,
      values: valuesForCount,
    },
  };
}

// shapeTopSkillsResult
// Da forma final a la respuesta a partir de las filas ya devueltas por
// Postgres para cada una de las dos queries.
export function shapeTopSkillsResult(skillsRows, totalRows) {
  return {
    rows: skillsRows,
    total_matching_jobs: totalRows[0]?.total ?? 0,
  };
}
