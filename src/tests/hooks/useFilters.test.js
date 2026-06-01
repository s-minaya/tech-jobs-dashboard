import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilters } from "@/hooks/useFilters";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

// useFilters
// Testamos el estado inicial, que cada campo se actualiza de forma
// independiente y que resetFilters restaura todo correctamente.
// No hay fetch ni efectos secundarios, así que no necesitamos MSW.

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
});
