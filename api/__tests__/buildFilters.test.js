import { describe, it, expect } from "vitest";
import { buildFilters } from "../src/buildFilters.js";

// Tests de buildFilters
//
// Es la función más crítica del backend: genera el WHERE de todas las queries.
// Historial de bugs que estos tests cubren:
//   - Error 500 con category: el índice $N del COUNT total era incorrecto
//     porque values incluía el valor de category antes de clonarse.
//     Cubierto en "indexación correcta de $N".
//   - Porcentajes > 100% en el heatmap: desincronización de periodo entre
//     cooccurrence y skills/top. Cubierto en combinaciones realistas.

describe("buildFilters", () => {
  describe("sin filtros", () => {
    it("solo añade is_active = TRUE", () => {
      const { conditions, values } = buildFilters({});
      expect(conditions).toEqual(["j.is_active = TRUE"]);
      expect(values).toEqual([]);
    });
  });

  describe("filtro de país", () => {
    it("añade country_code en minúsculas", () => {
      const { conditions, values } = buildFilters({ country: "DE" });
      expect(conditions).toContain("j.country_code = $1");
      expect(values).toEqual(["de"]);
    });

    it("country ya en minúsculas funciona igual", () => {
      const { values } = buildFilters({ country: "es" });
      expect(values).toEqual(["es"]);
    });
  });

  describe("filtro de periodo", () => {
    it.each([
      ["30d", "30 days"],
      ["90d", "90 days"],
      ["180d", "180 days"],
    ])("%s mapea al intervalo '%s' de PostgreSQL", (codigo, intervalo) => {
      const { conditions, values } = buildFilters({ periodo: codigo });
      expect(values).toContain(intervalo);
      expect(conditions.some((c) => c.includes("::interval"))).toBe(true);
    });

    it("'all' no añade ninguna condición de fecha", () => {
      const { conditions, values } = buildFilters({ periodo: "all" });
      expect(conditions).toEqual(["j.is_active = TRUE"]);
      expect(values).toEqual([]);
    });

    it("periodo desconocido no añade condición de fecha", () => {
      const { conditions, values } = buildFilters({ periodo: "unknown" });
      expect(conditions).toEqual(["j.is_active = TRUE"]);
      expect(values).toEqual([]);
    });
  });

  describe("filtro de contrato", () => {
    it("añade contract_type en minúsculas", () => {
      const { conditions, values } = buildFilters({ contrato: "permanent" });
      expect(conditions).toContain("j.contract_type = $1");
      expect(values).toEqual(["permanent"]);
    });
  });

  describe("filtro de jornada", () => {
    it("añade contract_time en minúsculas", () => {
      const { conditions, values } = buildFilters({ jornada: "full_time" });
      expect(conditions).toContain("j.contract_time = $1");
      expect(values).toEqual(["full_time"]);
    });
  });

  describe("filtro de remote", () => {
    it("'true' añade boolean true (no string)", () => {
      const { conditions, values } = buildFilters({ remote: "true" });
      expect(conditions).toContain("j.remote = $1");
      expect(values).toEqual([true]);
    });

    it("'false' añade boolean false (no string)", () => {
      const { values } = buildFilters({ remote: "false" });
      expect(values).toEqual([false]);
    });

    it("cualquier otro valor no añade condición", () => {
      const { conditions, values } = buildFilters({ remote: "todos" });
      expect(conditions).toEqual(["j.is_active = TRUE"]);
      expect(values).toEqual([]);
    });

    it("undefined no añade condición", () => {
      const { conditions } = buildFilters({ remote: undefined });
      expect(conditions).toEqual(["j.is_active = TRUE"]);
    });
  });

  describe("indexación correcta de $N", () => {
    // Este bloque reproduce el bug que causó el Error 500:
    // cuando el endpoint añadía category DESPUÉS de buildFilters,
    // el COUNT total recibía valores extra que su SQL no referenciaba.

    it("múltiples filtros generan $1, $2, $3... consecutivos sin saltos", () => {
      const { conditions, values } = buildFilters({
        country: "de",
        periodo: "90d",
        contrato: "permanent",
        jornada: "full_time",
        remote: "true",
      });
      expect(values).toHaveLength(5);
      expect(conditions).toContain("j.country_code = $1");
      expect(conditions).toContain("j.posted_at >= NOW() - $2::interval");
      expect(conditions).toContain("j.contract_type = $3");
      expect(conditions).toContain("j.contract_time = $4");
      expect(conditions).toContain("j.remote = $5");
    });

    it("existingValues desplaza los índices correctamente", () => {
      // Simula el caso en que el caller ya tiene un valor previo ($1 ocupado)
      const { conditions, values } = buildFilters({ country: "fr" }, [
        "valor_previo",
      ]);
      expect(conditions).toContain("j.country_code = $2");
      expect(values).toEqual(["valor_previo", "fr"]);
    });

    it("no muta el array existingValues recibido", () => {
      const original = ["algo"];
      buildFilters({ country: "de" }, original);
      expect(original).toEqual(["algo"]);
    });
  });

  describe("combinaciones realistas", () => {
    it("periodo + country sin conflicto de índices", () => {
      const { conditions, values } = buildFilters({
        country: "nl",
        periodo: "30d",
      });
      expect(values).toEqual(["nl", "30 days"]);
      expect(conditions).toContain("j.country_code = $1");
      expect(conditions).toContain("j.posted_at >= NOW() - $2::interval");
    });

    it("solo periodo (escenario heatmap con filtro de tiempo)", () => {
      const { conditions, values } = buildFilters({ periodo: "90d" });
      expect(values).toEqual(["90 days"]);
      expect(conditions).toHaveLength(2);
    });

    it("todos los filtros activos a la vez: último placeholder es $5", () => {
      const { conditions, values } = buildFilters({
        country: "es",
        periodo: "180d",
        contrato: "permanent",
        jornada: "full_time",
        remote: "false",
      });
      expect(values).toHaveLength(5);
      expect(conditions).toHaveLength(6); // is_active + 5 filtros
      // El último placeholder debe ser $5 exactamente
      const lastCondition = conditions[conditions.length - 1];
      expect(lastCondition).toContain("$5");
      expect(lastCondition).not.toContain("$6");
    });
  });
});
