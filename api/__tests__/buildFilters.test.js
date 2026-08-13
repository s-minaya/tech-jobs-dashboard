import { describe, it, expect } from "vitest";
import {
  buildFilters,
  stripKeys,
  COOCCURRENCE_IGNORED_FILTERS,
  TOP_SKILLS_IGNORED_FILTERS,
  applyDefaultPeriodoFallback,
} from "../src/buildFilters.js";

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

// stripKeys / COOCCURRENCE_IGNORED_FILTERS — añadidos en la fase 012
// (Auditoría cruzada de filtros). GET /api/skills/cooccurrence usaba un
// destructure inline que solo descartaba country/jornada, dejando
// contrato/remote colarse hasta buildFilters si algún día llegaban en la
// query string — un bug real de fuga de filtros, aunque dormido porque el
// único caller ya los descartaba antes de llamar. Estos tests cubren el
// contrato completo del endpoint sin tener que levantar Express ni BD.
describe("stripKeys", () => {
  it("quita las claves indicadas y conserva el resto", () => {
    const result = stripKeys(
      { country: "de", periodo: "90d", contrato: "permanent" },
      ["country", "contrato"],
    );
    expect(result).toEqual({ periodo: "90d" });
  });

  it("no muta el objeto original", () => {
    const original = { country: "de", periodo: "90d" };
    stripKeys(original, ["country"]);
    expect(original).toEqual({ country: "de", periodo: "90d" });
  });

  it("claves ausentes no rompen nada", () => {
    const result = stripKeys({ periodo: "90d" }, ["country", "contrato"]);
    expect(result).toEqual({ periodo: "90d" });
  });
});

describe("COOCCURRENCE_IGNORED_FILTERS + buildFilters (contrato de /api/skills/cooccurrence)", () => {
  it("con los 5 filtros activos en la query, tras el strip solo periodo llega a buildFilters", () => {
    const query = {
      country: "de",
      periodo: "90d",
      contrato: "permanent",
      jornada: "full_time",
      remote: "true",
    };
    const restQuery = stripKeys(query, COOCCURRENCE_IGNORED_FILTERS);
    const { conditions, values } = buildFilters(restQuery);

    // Antes del fix de la fase 012, contrato/remote sobrevivían al strip
    // y buildFilters generaba estas dos condiciones extra — deben haber
    // desaparecido.
    expect(conditions.join(" ")).not.toContain("j.contract_type");
    expect(conditions.join(" ")).not.toContain("j.remote");
    expect(conditions.join(" ")).not.toContain("j.country_code");
    expect(conditions.join(" ")).not.toContain("j.contract_time");

    // Solo queda la condición de periodo (más is_active, siempre presente).
    expect(conditions).toEqual([
      "j.is_active = TRUE",
      "j.posted_at >= NOW() - $1::interval",
    ]);
    expect(values).toEqual(["90 days"]);
  });
});

describe("TOP_SKILLS_IGNORED_FILTERS + buildFilters (contrato de /api/skills/top)", () => {
  it("jornada nunca llega a buildFilters aunque esté en la query", () => {
    const query = { country: "de", periodo: "90d", jornada: "full_time" };
    const restQuery = stripKeys(query, TOP_SKILLS_IGNORED_FILTERS);
    const { conditions, values } = buildFilters(restQuery);

    expect(conditions.join(" ")).not.toContain("j.contract_time");
    expect(values).not.toContain("full_time");
    // El resto de filtros sí deben sobrevivir — solo jornada se descarta.
    expect(conditions).toContain("j.country_code = $1");
  });
});

// applyDefaultPeriodoFallback — añadido en la fase 013 (Auditoría Top
// Skills). /api/skills/top y /api/skills/cooccurrence reimplementaban por
// separado un `if (!periodo || periodo === "all")` que capaba "Todo el
// histórico" a los mismos 90 días que el periodo por defecto — confirmado
// en vivo (mismo total_matching_jobs con periodo=90d, periodo=all y sin
// periodo). Centralizado y testeado aquí para que los dos endpoints no
// puedan volver a desincronizarse ni reintroducir el bug.
describe("applyDefaultPeriodoFallback", () => {
  it("periodo ausente: añade el fallback de 90 días", () => {
    const conditions = ["j.is_active = TRUE"];
    applyDefaultPeriodoFallback(conditions, {});
    expect(conditions).toContain("j.posted_at >= NOW() - INTERVAL '90 days'");
  });

  it("periodo='all': NO añade ningún fallback (bug de la fase 013, corregido)", () => {
    const conditions = ["j.is_active = TRUE"];
    applyDefaultPeriodoFallback(conditions, { periodo: "all" });
    expect(conditions).toEqual(["j.is_active = TRUE"]);
  });

  it("periodo='90d': no añade el fallback (buildFilters ya cubrió la fecha)", () => {
    const conditions = ["j.is_active = TRUE"];
    applyDefaultPeriodoFallback(conditions, { periodo: "90d" });
    expect(conditions).toEqual(["j.is_active = TRUE"]);
  });

  it("devuelve el mismo array que recibe (mutación in-place, como conditions.push en el resto del archivo)", () => {
    const conditions = [];
    const result = applyDefaultPeriodoFallback(conditions, {});
    expect(result).toBe(conditions);
  });
});
