import { describe, it, expect } from "vitest";
import {
  buildSalaryByRoleCountryQuery,
  shapeSalaryRows,
  salaryQualityConditions,
} from "../src/salaryQuery.js";

// Tests de salaryQuery — lógica pura de GET /api/salary/by-role-country,
// sin BD ni Express. Añadidos en la fase 010 (Salary Chart Quality) al
// extraer la query en línea del endpoint a este módulo, para poder
// testear la SQL generada y la transformación de filas de forma aislada.

describe("buildSalaryByRoleCountryQuery", () => {
  it("incluye PERCENTILE_CONT(0.5) para la mediana", () => {
    const { text } = buildSalaryByRoleCountryQuery(["j.is_active = TRUE"]);
    expect(text).toContain("PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY j.salary_mid)");
  });

  it("agrupa por country_code, country_name y role_category", () => {
    const { text } = buildSalaryByRoleCountryQuery(["j.is_active = TRUE"]);
    expect(text).toContain("GROUP BY j.country_code, c.name, j.role_category");
  });

  it("incluye el total combinado vía SUM(COUNT(*)) OVER() en vez de una segunda query", () => {
    const { text } = buildSalaryByRoleCountryQuery(["j.is_active = TRUE"]);
    expect(text).toContain("SUM(COUNT(*)) OVER ()::int AS total_matching_jobs");
  });

  it("interpola las condiciones recibidas en el WHERE", () => {
    const { text } = buildSalaryByRoleCountryQuery([
      "j.is_active = TRUE",
      "j.country_code = $1",
      "j.salary_mid >= 1000",
    ]);
    expect(text).toContain(
      "WHERE j.is_active = TRUE AND j.country_code = $1 AND j.salary_mid >= 1000",
    );
  });

  it("ordena por país y luego por mediana descendente", () => {
    const { text } = buildSalaryByRoleCountryQuery(["j.is_active = TRUE"]);
    expect(text).toContain(
      "ORDER BY j.country_code, median_salary_eur DESC NULLS LAST",
    );
  });
});

describe("shapeSalaryRows", () => {
  it("extrae total_matching_jobs de la primera fila", () => {
    const rows = [
      { country_code: "de", role_category: "backend", total_matching_jobs: 42 },
      { country_code: "fr", role_category: "frontend", total_matching_jobs: 42 },
    ];
    const result = shapeSalaryRows(rows);
    expect(result.total_matching_jobs).toBe(42);
  });

  it("quita total_matching_jobs de cada fila individual (no se repite en el payload)", () => {
    const rows = [
      { country_code: "de", role_category: "backend", total_matching_jobs: 42 },
    ];
    const result = shapeSalaryRows(rows);
    expect(result.rows[0]).not.toHaveProperty("total_matching_jobs");
    expect(result.rows[0]).toEqual({
      country_code: "de",
      role_category: "backend",
    });
  });

  it("con array vacío devuelve rows vacío y total 0", () => {
    expect(shapeSalaryRows([])).toEqual({ rows: [], total_matching_jobs: 0 });
  });
});

// Fase 014: extraída de 3 copias independientes de la misma regla SQL
// (aquí, /api/stats/summary y el índice idx_jobs_salary_by_role_country
// en schema.sql) a un único punto de verdad.
describe("salaryQualityConditions", () => {
  it("con alias por defecto ('j'), devuelve las 3 condiciones de calidad", () => {
    expect(salaryQualityConditions()).toEqual([
      "j.salary_mid IS NOT NULL",
      "j.salary_is_predicted = FALSE",
      "j.salary_mid >= 1000",
    ]);
  });

  it("acepta un alias distinto sin colisionar con otras subconsultas", () => {
    expect(salaryQualityConditions("j2")).toEqual([
      "j2.salary_mid IS NOT NULL",
      "j2.salary_is_predicted = FALSE",
      "j2.salary_mid >= 1000",
    ]);
  });

  it("el resultado es directamente usable en un WHERE vía join(\" AND \")", () => {
    expect(salaryQualityConditions("j").join(" AND ")).toBe(
      "j.salary_mid IS NOT NULL AND j.salary_is_predicted = FALSE AND j.salary_mid >= 1000",
    );
  });
});
