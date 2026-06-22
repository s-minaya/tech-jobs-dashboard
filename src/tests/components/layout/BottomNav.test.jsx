import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

function renderNav(props = {}) {
  const onOpenFilters = vi.fn();
  render(
    <BottomNav
      activeSection="inicio"
      onOpenFilters={onOpenFilters}
      filters={filtersNeutros}
      {...props}
    />,
  );
  return { onOpenFilters };
}

describe("BottomNav", () => {
  describe("estructura", () => {
    it("renderiza los 5 botones de navegación", () => {
      renderNav();
      expect(screen.getByText("Inicio")).toBeInTheDocument();
      expect(screen.getByText("Tendencias")).toBeInTheDocument();
      expect(screen.getByText("Mapa")).toBeInTheDocument();
      expect(screen.getByText("Skills")).toBeInTheDocument();
      expect(screen.getByText("Filtros")).toBeInTheDocument();
    });
  });

  describe("sección activa", () => {
    it("aplica aurora-text al label de la sección activa", () => {
      renderNav({ activeSection: "tendencias" });
      const label = screen.getByText("Tendencias");
      expect(label).toHaveClass("aurora-text");
    });

    it("no aplica aurora-text a las secciones inactivas", () => {
      renderNav({ activeSection: "inicio" });
      expect(screen.getByText("Tendencias")).not.toHaveClass("aurora-text");
      expect(screen.getByText("Mapa")).not.toHaveClass("aurora-text");
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
  });

  describe("navegación por scroll", () => {
    it("llama a scrollIntoView al pulsar una sección", async () => {
      const user = userEvent.setup();
      const mockEl = { scrollIntoView: vi.fn() };
      vi.spyOn(document, "getElementById").mockReturnValue(mockEl);

      renderNav();
      await user.click(screen.getByText("Mapa"));

      expect(document.getElementById).toHaveBeenCalledWith("mapa");
      expect(mockEl.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });

      vi.restoreAllMocks();
    });

    it("no llama a scrollIntoView al pulsar Filtros", async () => {
      const user = userEvent.setup();
      const spy = vi.spyOn(document, "getElementById");

      renderNav();
      await user.click(screen.getByText("Filtros"));

      expect(spy).not.toHaveBeenCalled();
      vi.restoreAllMocks();
    });
  });
});
