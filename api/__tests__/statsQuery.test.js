import { describe, it, expect } from "vitest";
import { buildStatsSummaryQuery } from "../src/statsQuery.js";

// Tests de statsQuery.js (fase 014) — lógica pura de GET /api/stats/summary,
// sin BD ni Express. A diferencia de salaryQuery/demandQuery/skillsQuery,
// esta query no recibe ningún filtro: buildStatsSummaryQuery() no toma
// argumentos y el texto SQL es siempre idéntico (es justo lo que permite
// cachearla sin clave por combinación de filtros — ver statsCache.js).

describe("buildStatsSummaryQuery", () => {
  it("no depende de ningún parámetro — mismo texto en cada llamada", () => {
    expect(buildStatsSummaryQuery().text).toBe(buildStatsSummaryQuery().text);
  });

  it("selecciona los 5 campos originales", () => {
    const { text } = buildStatsSummaryQuery();
    expect(text).toContain("AS total_active_jobs");
    expect(text).toContain("AS total_countries");
    expect(text).toContain("AS total_skills");
    expect(text).toContain("AS pct_with_salary");
    expect(text).toContain("AS last_updated");
  });

  it("last_updated usa last_seen_at, no posted_at (fase 014, hallazgo 5)", () => {
    const { text } = buildStatsSummaryQuery();
    expect(text).toContain("MAX(j.last_seen_at)");
    expect(text).not.toContain("MAX(j.posted_at)");
    expect(text).not.toContain("MAX(posted_at)");
  });

  it("pct_with_salary reusa salaryQualityConditions (alias j), no condiciones sueltas", () => {
    const { text } = buildStatsSummaryQuery();
    expect(text).toContain("j.salary_mid IS NOT NULL");
    expect(text).toContain("j.salary_is_predicted = FALSE");
    expect(text).toContain("j.salary_mid >= 1000");
  });

  it("incluye median_salary_90d con su propia ventana de 90 días y alias j2", () => {
    const { text } = buildStatsSummaryQuery();
    expect(text).toContain("AS median_salary_90d");
    expect(text).toContain("PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY j2.salary_mid)");
    expect(text).toContain("j2.posted_at >= NOW() - INTERVAL '90 days'");
    expect(text).toContain("j2.salary_mid IS NOT NULL");
  });

  it("median_salary_90d NO usa una ventana de 6 meses (sería idéntica a is_active sin ventana — ver fase 013)", () => {
    const { text } = buildStatsSummaryQuery();
    expect(text).not.toContain("6 months");
  });

  it("incluye top_skills_30d limitado a 3 filas con su propia ventana de 30 días", () => {
    const { text } = buildStatsSummaryQuery();
    expect(text).toContain("AS top_skills_30d");
    expect(text).toContain("j3.posted_at >= NOW() - INTERVAL '30 days'");
    expect(text).toContain("ORDER BY count DESC LIMIT 3");
    expect(text).toContain("json_agg");
  });

  it("las 3 subconsultas usan alias distintos entre sí (j, j2, j3) sin colisionar", () => {
    const { text } = buildStatsSummaryQuery();
    expect(text).toContain("FROM jobs j2");
    expect(text).toContain("JOIN jobs j3 ON j3.id = js3.job_id");
    expect(text).toContain("FROM jobs j\n");
  });

  it("la query principal sigue exigiendo is_active = TRUE", () => {
    const { text } = buildStatsSummaryQuery();
    expect(text).toContain("WHERE j.is_active = TRUE");
  });

  // KPI cards del dashboard (revisión post-plan): "Empresas analizadas"
  // y "Roles analizados".
  it("incluye total_companies y total_role_categories en la agregación principal", () => {
    const { text } = buildStatsSummaryQuery();
    expect(text).toContain("COUNT(DISTINCT j.company)");
    expect(text).toContain("AS total_companies");
    expect(text).toContain("COUNT(DISTINCT j.role_category)");
    expect(text).toContain("AS total_role_categories");
  });
});
