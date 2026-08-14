import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import BottomNav from "@/components/layout/BottomNav";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

const filtersNeutros = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

// BottomNav ya no recibe `activeSection` (fase 016, bloque C): ahora usa
// <NavLink> real, que resuelve el ítem activo a partir de la URL. Los
// tests controlan la "ruta activa" con `initialEntries` de MemoryRouter
// en vez de una prop.
function renderNav({ route = "/", ...props } = {}) {
  const onOpenFilters = vi.fn();
  render(
    <MemoryRouter initialEntries={[route]}>
      <BottomNav onOpenFilters={onOpenFilters} filters={filtersNeutros} {...props} />
    </MemoryRouter>,
  );
  return { onOpenFilters };
}

describe("BottomNav", () => {
  describe("estructura", () => {
    it("renderiza los 7 botones de navegación", () => {
      renderNav();
      expect(screen.getByText("Inicio")).toBeInTheDocument();
      expect(screen.getByText("Tendencias")).toBeInTheDocument();
      expect(screen.getByText("Salarios")).toBeInTheDocument();
      expect(screen.getByText("Mapa")).toBeInTheDocument();
      expect(screen.getByText("Skills")).toBeInTheDocument();
      expect(screen.getByText("Top Skills")).toBeInTheDocument();
      expect(screen.getByText("Filtros")).toBeInTheDocument();
    });
  });

  describe("ruta activa", () => {
    it("aplica aurora-text al label de la ruta activa", () => {
      renderNav({ route: "/tendencias" });
      expect(screen.getByText("Tendencias")).toHaveClass("aurora-text");
    });

    it("no aplica aurora-text a las rutas inactivas", () => {
      renderNav({ route: "/" });
      expect(screen.getByText("Tendencias")).not.toHaveClass("aurora-text");
      expect(screen.getByText("Mapa")).not.toHaveClass("aurora-text");
    });

    it('"Inicio" no queda activo en otra ruta (NavLink "end")', () => {
      // Sin `end`, NavLink marcaría "/" como activo en cualquier ruta,
      // porque por defecto compara con startsWith y todo path empieza
      // por "/" — regresión fácil de reintroducir sin darse cuenta.
      renderNav({ route: "/mapa" });
      expect(screen.getByText("Inicio")).not.toHaveClass("aurora-text");
      expect(screen.getByText("Mapa")).toHaveClass("aurora-text");
    });
  });

  describe("botón Filtros", () => {
    it("llama a onOpenFilters al pulsar Filtros", async () => {
      const user = userEvent.setup();
      const { onOpenFilters } = renderNav();
      await user.click(screen.getByText("Filtros"));
      expect(onOpenFilters).toHaveBeenCalledTimes(1);
    });

    it("no muestra badge cuando no hay filtros activos", () => {
      renderNav();
      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });

    it("muestra badge con el número de filtros activos", () => {
      renderNav({ filters: { ...filtersNeutros, pais: "DE", remote: "Sí" } });
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("el badge muestra 1 cuando solo hay un filtro activo", () => {
      renderNav({ filters: { ...filtersNeutros, pais: "FR" } });
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("Filtros es un botón, no un enlace de ruta", () => {
      renderNav();
      expect(screen.getByText("Filtros").closest("button")).toBeInTheDocument();
      expect(screen.getByText("Filtros").closest("a")).not.toBeInTheDocument();
    });
  });

  describe("navegación por ruta (NavLink)", () => {
    it("cada ítem de ruta enlaza a su URL correspondiente", () => {
      renderNav();
      expect(screen.getByText("Inicio").closest("a")).toHaveAttribute("href", "/");
      expect(screen.getByText("Tendencias").closest("a")).toHaveAttribute(
        "href",
        "/tendencias",
      );
      expect(screen.getByText("Salarios").closest("a")).toHaveAttribute(
        "href",
        "/salarios",
      );
      expect(screen.getByText("Mapa").closest("a")).toHaveAttribute("href", "/mapa");
      expect(screen.getByText("Skills").closest("a")).toHaveAttribute(
        "href",
        "/skills",
      );
      expect(screen.getByText("Top Skills").closest("a")).toHaveAttribute(
        "href",
        "/top-skills",
      );
    });
  });
});
