import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilters } from "@/hooks/useFilters";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

// useFilters
// Testamos el estado inicial, que cada campo se actualiza de forma
// independiente, que resetFilters restaura todo correctamente,
// y que los filtros se persisten y recuperan de localStorage.
// No hay fetch ni efectos secundarios, así que no necesitamos MSW.

// El setup.js ya limpia localStorage entre tests con afterEach.

describe("useFilters", () => {
  describe("estado inicial", () => {
    it("pais empieza en 'Todos'", () => {
      const { result } = renderHook(() => useFilters());
      expect(result.current.filters.pais).toBe("Todos");
    });

    it("periodo empieza en PERIODO_DEFAULT", () => {
      const { result } = renderHook(() => useFilters());
      expect(result.current.filters.periodo).toBe(PERIODO_DEFAULT);
    });

    it("contrato empieza en 'Todos'", () => {
      const { result } = renderHook(() => useFilters());
      expect(result.current.filters.contrato).toBe("Todos");
    });

    it("jornada empieza en 'Todos'", () => {
      const { result } = renderHook(() => useFilters());
      expect(result.current.filters.jornada).toBe("Todos");
    });

    it("remote empieza en 'Todos'", () => {
      const { result } = renderHook(() => useFilters());
      expect(result.current.filters.remote).toBe("Todos");
    });

    it("skillCategoria empieza en 'Todas'", () => {
      const { result } = renderHook(() => useFilters());
      expect(result.current.filters.skillCategoria).toBe("Todas");
    });
  });

  describe("handleFilterChange", () => {
    it("actualiza el campo correcto", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.handleFilterChange("pais", "DE");
      });

      expect(result.current.filters.pais).toBe("DE");
    });

    it("no afecta a los demás campos al cambiar uno", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.handleFilterChange("pais", "FR");
      });

      // El resto de campos permanece igual
      expect(result.current.filters.periodo).toBe(PERIODO_DEFAULT);
      expect(result.current.filters.contrato).toBe("Todos");
      expect(result.current.filters.jornada).toBe("Todos");
      expect(result.current.filters.remote).toBe("Todos");
      expect(result.current.filters.skillCategoria).toBe("Todas");
    });

    it("permite actualizar cualquier campo", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.handleFilterChange("pais", "ES");
      });
      act(() => {
        result.current.handleFilterChange("periodo", "Últimos 30 días");
      });
      act(() => {
        result.current.handleFilterChange("contrato", "permanent");
      });
      act(() => {
        result.current.handleFilterChange("jornada", "full_time");
      });
      act(() => {
        result.current.handleFilterChange("remote", "Sí");
      });
      act(() => {
        result.current.handleFilterChange("skillCategoria", "Database");
      });

      expect(result.current.filters.pais).toBe("ES");
      expect(result.current.filters.periodo).toBe("Últimos 30 días");
      expect(result.current.filters.contrato).toBe("permanent");
      expect(result.current.filters.jornada).toBe("full_time");
      expect(result.current.filters.remote).toBe("Sí");
      expect(result.current.filters.skillCategoria).toBe("Database");
    });
  });

  describe("resetFilters", () => {
    it("restaura todos los campos a sus valores iniciales", () => {
      const { result } = renderHook(() => useFilters());

      // Cambiamos todos los campos
      act(() => {
        result.current.handleFilterChange("pais", "DE");
        result.current.handleFilterChange("periodo", "Últimos 30 días");
        result.current.handleFilterChange("remote", "Sí");
      });

      // Reseteamos
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters.pais).toBe("Todos");
      expect(result.current.filters.periodo).toBe(PERIODO_DEFAULT);
      expect(result.current.filters.remote).toBe("Todos");
      expect(result.current.filters.contrato).toBe("Todos");
      expect(result.current.filters.jornada).toBe("Todos");
      expect(result.current.filters.skillCategoria).toBe("Todas");
    });

    it("después de reset se puede volver a cambiar filtros", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.handleFilterChange("pais", "IT");
      });
      act(() => {
        result.current.resetFilters();
      });
      act(() => {
        result.current.handleFilterChange("pais", "NL");
      });

      expect(result.current.filters.pais).toBe("NL");
    });
  });

  describe("persistencia en localStorage", () => {
    it("guarda los filtros en localStorage al cambiar un valor", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.handleFilterChange("pais", "DE");
      });

      const saved = JSON.parse(localStorage.getItem("dashboard_filters"));
      expect(saved.pais).toBe("DE");
    });

    it("recupera los filtros guardados al montar el hook de nuevo", () => {
      // Simulamos una sesión anterior guardando filtros en localStorage
      localStorage.setItem(
        "dashboard_filters",
        JSON.stringify({
          pais: "FR",
          periodo: PERIODO_DEFAULT,
          contrato: "Todos",
          jornada: "Todos",
          remote: "Todos",
          skillCategoria: "Todas",
        }),
      );

      const { result } = renderHook(() => useFilters());

      // El hook debe arrancar con el filtro guardado
      expect(result.current.filters.pais).toBe("FR");
    });

    it("resetFilters limpia también localStorage", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.handleFilterChange("pais", "ES");
      });
      act(() => {
        result.current.resetFilters();
      });

      const saved = JSON.parse(localStorage.getItem("dashboard_filters"));
      expect(saved.pais).toBe("Todos");
    });

    it("si localStorage tiene datos corruptos arranca con los valores iniciales", () => {
      localStorage.setItem("dashboard_filters", "esto no es json válido {{");

      const { result } = renderHook(() => useFilters());

      expect(result.current.filters.pais).toBe("Todos");
      expect(result.current.filters.periodo).toBe(PERIODO_DEFAULT);
    });

    it("si localStorage tiene filtros parciales fusiona con los iniciales", () => {
      // Solo guardamos 'pais' — el resto debe coger los valores iniciales
      localStorage.setItem("dashboard_filters", JSON.stringify({ pais: "IT" }));

      const { result } = renderHook(() => useFilters());

      expect(result.current.filters.pais).toBe("IT");
      expect(result.current.filters.periodo).toBe(PERIODO_DEFAULT);
      expect(result.current.filters.contrato).toBe("Todos");
    });

    it("persiste todos los campos cuando se cambian varios", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.handleFilterChange("pais", "DE");
        result.current.handleFilterChange("remote", "Sí");
        result.current.handleFilterChange("skillCategoria", "Database");
      });

      const saved = JSON.parse(localStorage.getItem("dashboard_filters"));
      expect(saved.pais).toBe("DE");
      expect(saved.remote).toBe("Sí");
      expect(saved.skillCategoria).toBe("Database");
    });
  });
});
