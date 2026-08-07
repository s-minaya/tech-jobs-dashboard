import { describe, it, expect } from "vitest";
import {
  describeFiltros,
  NOMBRES_PAISES,
  PERIODO_DEFAULT,
  activeFilterCount,
} from "@/lib/filterUtils";

// filtersNeutros usa los valores que producen array vacío en describeFiltros.
// Usa PERIODO_DEFAULT importado directamente para que si cambia el default,
// los tests sigan siendo correctos sin tocarlos.
const filtersNeutros = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

describe("NOMBRES_PAISES", () => {
  it("contiene los 8 países cubiertos", () => {
    expect(Object.keys(NOMBRES_PAISES)).toHaveLength(8);
    ["DE", "FR", "ES", "NL", "PL", "IT", "AT", "BE"].forEach((code) => {
      expect(Object.keys(NOMBRES_PAISES)).toContain(code);
    });
  });

  it("los valores son strings no vacíos", () => {
    Object.values(NOMBRES_PAISES).forEach((nombre) => {
      expect(typeof nombre).toBe("string");
      expect(nombre.length).toBeGreaterThan(0);
    });
  });
});

describe("PERIODO_DEFAULT", () => {
  it("es un string no vacío", () => {
    expect(typeof PERIODO_DEFAULT).toBe("string");
    expect(PERIODO_DEFAULT.length).toBeGreaterThan(0);
  });
});

describe("describeFiltros", () => {
  describe("sin filtros activos", () => {
    it("devuelve array vacío cuando todos los filtros están en sus valores neutros", () => {
      expect(describeFiltros(filtersNeutros)).toEqual([]);
    });

    it("devuelve array vacío con objeto vacío", () => {
      expect(describeFiltros({})).toEqual([]);
    });
  });

  describe("filtro de país", () => {
    it.each([
      ["DE", "Alemania"],
      ["FR", "Francia"],
      ["ES", "España"],
      ["NL", "Países Bajos"],
      ["PL", "Polonia"],
      ["IT", "Italia"],
      ["AT", "Austria"],
      ["BE", "Bélgica"],
    ])("código %s produce el nombre '%s' en español", (codigo, nombre) => {
      const resultado = describeFiltros({ ...filtersNeutros, pais: codigo });
      expect(resultado).toContain(nombre);
    });

    it("'Todos' no aparece en el resultado", () => {
      const resultado = describeFiltros({ ...filtersNeutros, pais: "Todos" });
      expect(resultado.some((r) => r.includes("Todos"))).toBe(false);
    });
  });

  describe("filtro de periodo", () => {
    it("PERIODO_DEFAULT no aparece en el resultado (es el valor neutro)", () => {
      // Si el periodo es el default, no tiene sentido mostrarlo como filtro activo.
      // El usuario no ha cambiado nada respecto al estado inicial.
      const resultado = describeFiltros({
        ...filtersNeutros,
        periodo: PERIODO_DEFAULT,
      });
      expect(resultado).toEqual([]);
    });

    it.each(["Últimos 30 días", "Últimos 6 meses", "Todo el histórico"])(
      "'%s' (distinto del default) sí aparece en el resultado",
      (periodo) => {
        const resultado = describeFiltros({ ...filtersNeutros, periodo });
        expect(resultado.length).toBeGreaterThan(0);
        expect(
          resultado.some((r) =>
            r.toLowerCase().includes(periodo.toLowerCase()),
          ),
        ).toBe(true);
      },
    );

    it("periodo undefined no añade ninguna entrada", () => {
      const resultado = describeFiltros({
        ...filtersNeutros,
        periodo: undefined,
      });
      expect(resultado).toEqual([]);
    });
  });

  describe("filtro de remote", () => {
    it("'Sí' produce 'solo remoto'", () => {
      expect(describeFiltros({ ...filtersNeutros, remote: "Sí" })).toContain(
        "solo remoto",
      );
    });

    it("'No' produce 'excluye remoto'", () => {
      expect(describeFiltros({ ...filtersNeutros, remote: "No" })).toContain(
        "excluye remoto",
      );
    });

    it("'Todos' no añade ninguna entrada", () => {
      const resultado = describeFiltros({ ...filtersNeutros, remote: "Todos" });
      expect(resultado.some((r) => r.includes("remoto"))).toBe(false);
    });
  });

  describe("filtro de skillCategoria", () => {
    it("'Todas' no aparece en el resultado", () => {
      expect(
        describeFiltros(filtersNeutros).some((r) => r.includes("categoría")),
      ).toBe(false);
    });

    it("categoría activa aparece en minúsculas", () => {
      const resultado = describeFiltros({
        ...filtersNeutros,
        skillCategoria: "Database",
      });
      expect(resultado.some((r) => r.includes("database"))).toBe(true);
    });
  });

  describe("excludeKeys", () => {
    it("omite el filtro de país cuando está en excludeKeys", () => {
      const resultado = describeFiltros({ ...filtersNeutros, pais: "DE" }, [
        "pais",
      ]);
      expect(resultado).not.toContain("Alemania");
    });

    it("omite skillCategoria cuando está en excludeKeys", () => {
      const resultado = describeFiltros(
        { ...filtersNeutros, skillCategoria: "Framework" },
        ["skillCategoria"],
      );
      expect(resultado.some((r) => r.includes("framework"))).toBe(false);
    });

    it("excluir una key no afecta a las demás", () => {
      const resultado = describeFiltros(
        { ...filtersNeutros, pais: "ES", remote: "Sí" },
        ["pais"],
      );
      expect(resultado).not.toContain("España");
      expect(resultado).toContain("solo remoto");
    });
  });

  describe("múltiples filtros activos a la vez", () => {
    it("incluye una entrada por cada filtro activo", () => {
      const resultado = describeFiltros({
        pais: "DE",
        periodo: "Últimos 30 días",
        contrato: "permanent",
        jornada: "full_time",
        remote: "Sí",
        skillCategoria: "Cloud",
      });
      expect(resultado).toContain("Alemania");
      expect(resultado).toContain("solo remoto");
      expect(resultado.some((r) => r.includes("cloud"))).toBe(true);
      expect(resultado.length).toBeGreaterThanOrEqual(5);
    });
  });
});

describe("activeFilterCount", () => {
  it("devuelve 0 cuando todos los filtros están en su valor neutro", () => {
    expect(activeFilterCount(filtersNeutros)).toBe(0);
  });

  it("devuelve 0 con filters undefined o null", () => {
    expect(activeFilterCount(undefined)).toBe(0);
    expect(activeFilterCount(null)).toBe(0);
  });

  it("cuenta un único filtro activo", () => {
    expect(activeFilterCount({ ...filtersNeutros, pais: "DE" })).toBe(1);
  });

  it("cuenta varios filtros activos a la vez", () => {
    expect(
      activeFilterCount({ ...filtersNeutros, pais: "DE", remote: "Sí" }),
    ).toBe(2);
  });

  it("trata PERIODO_DEFAULT como neutro en vez de un string hardcodeado", () => {
    // Usa PERIODO_DEFAULT (no un literal) para que este test detecte si
    // activeFilterCount alguna vez deja de sincronizarse con el default real.
    expect(
      activeFilterCount({ ...filtersNeutros, periodo: PERIODO_DEFAULT }),
    ).toBe(0);
  });
});
