import { describe, it, expect } from "vitest";
import { buildTopSkillsQueries, shapeTopSkillsResult } from "../src/skillsQuery.js";

// Tests de skillsQuery.js (fase 013)
//
// Historial de bugs que estos tests cubren:
//   - "Todo el histórico" era un no-op silencioso: el fallback de 90 días
//     saltaba también con periodo="all", no solo cuando periodo faltaba.
//   - pct_of_all_jobs se calculaba mal con category activo (dato muerto,
//     eliminado — este test confirma que ya no se selecciona).
//   - category se colaba en la query del total (rompía el propio total).

describe("buildTopSkillsQueries", () => {
  describe("sin filtros", () => {
    it("LIMIT es 20 sin category activa", () => {
      const { rowsQuery } = buildTopSkillsQueries({});
      expect(rowsQuery.values.at(-1)).toBe(20);
      expect(rowsQuery.text).toContain(`LIMIT $${rowsQuery.values.length}`);
    });

    it("sin periodo, aplica el fallback de 90 días en ambas queries", () => {
      const { rowsQuery, countQuery } = buildTopSkillsQueries({});
      expect(rowsQuery.text).toContain("INTERVAL '90 days'");
      expect(countQuery.text).toContain("INTERVAL '90 days'");
    });

    it("no selecciona pct_of_all_jobs (dato muerto eliminado en la fase 013)", () => {
      const { rowsQuery } = buildTopSkillsQueries({});
      expect(rowsQuery.text).not.toContain("pct_of_all_jobs");
      expect(rowsQuery.text).not.toContain("OVER");
    });
  });

  describe("periodo", () => {
    it("periodo='all' NO añade el fallback de 90 días (bug de la fase 013)", () => {
      const { rowsQuery, countQuery } = buildTopSkillsQueries({ periodo: "all" });
      expect(rowsQuery.text).not.toContain("90 days");
      expect(countQuery.text).not.toContain("90 days");
    });

    it("periodo='90d' usa el intervalo parametrizado de buildFilters, no el fallback hardcodeado", () => {
      const { rowsQuery, countQuery } = buildTopSkillsQueries({ periodo: "90d" });
      expect(rowsQuery.text).toContain("$1::interval");
      expect(rowsQuery.values).toContain("90 days");
      // El fallback (literal "INTERVAL '90 days'" sin placeholder) no debe
      // duplicarse cuando buildFilters ya añadió la condición parametrizada.
      expect(rowsQuery.text).not.toContain("INTERVAL '90 days'");
      expect(countQuery.text).not.toContain("INTERVAL '90 days'");
    });
  });

  describe("category", () => {
    it("category activa sube el LIMIT a 50", () => {
      const { rowsQuery } = buildTopSkillsQueries({ category: "language" });
      expect(rowsQuery.values.at(-1)).toBe(50);
    });

    it("category se añade solo a la query de filas, nunca a la del total", () => {
      const { rowsQuery, countQuery } = buildTopSkillsQueries({
        country: "de",
        category: "language",
      });
      expect(rowsQuery.text).toContain("s.category = $2");
      expect(rowsQuery.values).toEqual(["de", "language", 50]);
      expect(countQuery.text).not.toContain("s.category");
      expect(countQuery.values).toEqual(["de"]);
    });

    it("category se normaliza a minúsculas", () => {
      const { rowsQuery } = buildTopSkillsQueries({ category: "Language" });
      expect(rowsQuery.values).toContain("language");
    });
  });

  describe("jornada", () => {
    it("jornada nunca llega a ninguna de las dos queries", () => {
      const { rowsQuery, countQuery } = buildTopSkillsQueries({
        jornada: "full_time",
      });
      expect(rowsQuery.text).not.toContain("contract_time");
      expect(countQuery.text).not.toContain("contract_time");
      expect(rowsQuery.values).not.toContain("full_time");
    });
  });

  describe("indexación de $N con filtros combinados", () => {
    it("country + periodo + contrato + remote + category: $N consecutivos, sin huecos", () => {
      const { rowsQuery, countQuery } = buildTopSkillsQueries({
        country: "de",
        periodo: "90d",
        contrato: "permanent",
        remote: "true",
        category: "cloud",
      });
      // buildFilters ya cubre esta combinación (buildFilters.test.js);
      // aquí solo confirmamos que el LIMIT y category se numeran después,
      // sin saltarse ni repetir ningún índice.
      expect(countQuery.values).toHaveLength(4);
      expect(rowsQuery.values).toEqual([
        "de",
        "90 days",
        "permanent",
        true,
        "cloud",
        50,
      ]);
      expect(rowsQuery.text).toContain("s.category = $5");
      expect(rowsQuery.text).toContain("LIMIT $6");
    });
  });
});

describe("shapeTopSkillsResult", () => {
  it("combina las filas de skills con el total de la segunda query", () => {
    const skillsRows = [{ skill: "Python", job_count: "10" }];
    const totalRows = [{ total: 25 }];
    expect(shapeTopSkillsResult(skillsRows, totalRows)).toEqual({
      rows: skillsRows,
      total_matching_jobs: 25,
    });
  });

  it("total ausente no rompe (defensivo)", () => {
    expect(shapeTopSkillsResult([], [])).toEqual({
      rows: [],
      total_matching_jobs: 0,
    });
  });
});
