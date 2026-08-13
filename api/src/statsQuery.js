// statsQuery.js
// Lógica pura de GET /api/stats/summary, separada de index.js para
// poder testearla sin BD ni Express — mismo patrón que salaryQuery.js/
// demandQuery.js/skillsQuery.js.
//
// A diferencia de esos tres, esta query no recibe filtros (buildFilters):
// representa el estado global del dataset completo, siempre la misma
// pregunta, así que buildStatsSummaryQuery() no toma ningún argumento y
// el texto SQL es siempre idéntico — es justo lo que permite cachearla
// con statsCache.js sin necesidad de una clave por combinación de
// filtros (fase 014).
import { salaryQualityConditions } from "./salaryQuery.js";

export function buildStatsSummaryQuery() {
  const salaryCondsMain = salaryQualityConditions("j").join(" AND ");
  const salaryConds90d = salaryQualityConditions("j2").join(" AND ");

  return {
    text: `
      SELECT
        COUNT(*)                                              AS total_active_jobs,
        COUNT(DISTINCT j.country_code)                        AS total_countries,
        (SELECT COUNT(DISTINCT js.skill_id)
         FROM job_skills js
         JOIN jobs j ON j.id = js.job_id
         WHERE j.is_active = TRUE)                            AS total_skills,
        ROUND(
          SUM(CASE WHEN ${salaryCondsMain}
                   THEN 1 ELSE 0 END) * 100.0
          / NULLIF(COUNT(*), 0)
        , 1)                                                  AS pct_with_salary,
        MAX(j.last_seen_at)                                   AS last_updated,

        -- KPI cards del dashboard (fase 014, revisión post-plan):
        -- "Empresas analizadas" y "Roles analizados" — orientan al
        -- usuario sobre la amplitud/granularidad del dataset antes de
        -- entrar en SalaryChart (agrupado por role_category). No se
        -- filtra 'other' de total_role_categories: es una categoría real
        -- y seleccionable en ese chart (RoleSelector no la excluye, solo
        -- la excluye del top-5 por defecto — ver SalaryChart.jsx), así
        -- que excluirla aquí subestimaría la granularidad real.
        -- Comprobado con datos reales: 'company' tiene duplicados de
        -- facto por variantes de razón social (ej. "Sii" / "Sii Sp. z
        -- o.o.") — total_companies cuenta strings distintos, no
        -- empresas reales deduplicadas; mismo tipo de limitación ya
        -- aceptada en total_skills (fase 009) para nombres extraídos por
        -- NLP, no se resuelve aquí.
        COUNT(DISTINCT j.company)                             AS total_companies,
        COUNT(DISTINCT j.role_category)                       AS total_role_categories,

        -- Card "Compara salarios en Europa" (landing, fase 014): salario
        -- mediano, ofertas activas de los últimos 90 días. La ventana es
        -- 90 días y no 6 meses (el pedido original): una oferta activa
        -- nunca supera ~90-98 días de antigüedad (is_active pasa a FALSE
        -- en origen sobre esa marca — evidencia real en la fase 013,
        -- spec/features/013-top-skills-quality/013-tasks.md), así que
        -- "últimos 6 meses" habría sido idéntico a no poner ninguna
        -- ventana — mismo bug de fondo que ya se corrigió para el filtro
        -- de periodo en esa fase, aquí evitado desde el origen. 90 días
        -- es además el mismo número que ya usa el propio selector de
        -- periodo del sidebar ("Últimos 90 días"), así que el copy de la
        -- card puede reusar un lenguaje ya familiar en el resto de la UI.
        -- Distinto de pct_with_salary, que es sobre TODAS las activas
        -- sin ninguna ventana de fecha.
        (SELECT ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY j2.salary_mid)::numeric)
         FROM jobs j2
         WHERE j2.is_active = TRUE
           AND j2.posted_at >= NOW() - INTERVAL '90 days'
           AND ${salaryConds90d}
        )                                                     AS median_salary_90d,

        -- Card "Descubre dónde está la demanda" (landing, fase 014):
        -- top 3 skills por nº de ofertas en 30 días — mismo criterio que
        -- /api/skills/top (is_active + posted_at), acotado a 3 filas
        -- dentro de la propia subconsulta.
        (SELECT json_agg(t) FROM (
           SELECT s.name, COUNT(DISTINCT js3.job_id)::int AS count
           FROM job_skills js3
           JOIN jobs j3 ON j3.id = js3.job_id
           JOIN skills s ON s.id = js3.skill_id
           WHERE j3.is_active = TRUE
             AND j3.posted_at >= NOW() - INTERVAL '30 days'
           GROUP BY s.name
           ORDER BY count DESC LIMIT 3
         ) t)                                                 AS top_skills_30d
      FROM jobs j
      WHERE j.is_active = TRUE
    `,
  };
}
