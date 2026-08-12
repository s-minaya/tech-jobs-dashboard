import { describe, it, expect } from "vitest";
import {
  buildDemandByRoleQuery,
  shapeDemandRows,
} from "../src/demandQuery.js";

// Tests de demandQuery — lógica pura de GET /api/jobs/demand-by-role, sin
// BD ni Express. Añadidos en la fase 011 (Demand by Role Quality) al
// extraer la query en línea del endpoint a este módulo, para poder
// testear la SQL generada y la transformación de filas de forma aislada.

describe("buildDemandByRoleQuery", () => {
  it("agrupa por mes y role_category, sin country_code", () => {
    const { text } = buildDemandByRoleQuery(["j.is_active = TRUE"]);
    expect(text).toContain(
      "GROUP BY DATE_TRUNC('month', j.posted_at), j.role_category",
    );
    expect(text).not.toContain("country_code");
  });

  it("incluye el total combinado vía SUM(COUNT(*)) OVER() en vez de una segunda query", () => {
    const { text } = buildDemandByRoleQuery(["j.is_active = TRUE"]);
    expect(text).toContain("SUM(COUNT(*)) OVER ()::int AS total_matching_jobs");
  });

  it("selecciona DATE_TRUNC('month', posted_at) como month", () => {
    const { text } = buildDemandByRoleQuery(["j.is_active = TRUE"]);
    expect(text).toContain("DATE_TRUNC('month', j.posted_at) AS month");
  });

  it("interpola las condiciones recibidas en el WHERE", () => {
    const { text } = buildDemandByRoleQuery([
      "j.is_active = TRUE",
      "j.country_code = $1",
      "j.role_category IS NOT NULL",
    ]);
    expect(text).toContain(
      "WHERE j.is_active = TRUE AND j.country_code = $1 AND j.role_category IS NOT NULL",
    );
  });

  it("ordena por mes y luego por role_category, ambos ascendente", () => {
    const { text } = buildDemandByRoleQuery(["j.is_active = TRUE"]);
    expect(text).toContain("ORDER BY month ASC, j.role_category ASC");
  });
});

describe("shapeDemandRows", () => {
  it("extrae total_matching_jobs de la primera fila", () => {
    const rows = [
      { month: "2025-02-01", role_category: "backend", total_matching_jobs: 573 },
      { month: "2025-02-01", role_category: "devops", total_matching_jobs: 573 },
    ];
    const result = shapeDemandRows(rows);
    expect(result.total_matching_jobs).toBe(573);
  });

  it("quita total_matching_jobs de cada fila individual (no se repite en el payload)", () => {
    const rows = [
      { month: "2025-02-01", role_category: "backend", total_matching_jobs: 573 },
    ];
    const result = shapeDemandRows(rows);
    expect(result.rows[0]).not.toHaveProperty("total_matching_jobs");
    expect(result.rows[0]).toEqual({
      month: "2025-02-01",
      role_category: "backend",
    });
  });

  it("con array vacío devuelve rows vacío y total 0", () => {
    expect(shapeDemandRows([])).toEqual({ rows: [], total_matching_jobs: 0 });
  });
});
