import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Sidebar from "@/components/Sidebar";
import { FILTERS } from "@/config/filters";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

// Estado de filtros que produce un sidebar con todos los valores en su estado neutro.
const filtersNeutros = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

function renderSidebar(props = {}) {
  const onFilterChange = vi.fn();
  const onReset = vi.fn();
  render(
    <Sidebar
      filters={filtersNeutros}
      onFilterChange={onFilterChange}
      onReset={onReset}
      {...props}
    />,
  );
  return { onFilterChange, onReset };
}

describe("Sidebar", () => {
  describe("estructura", () => {
    it("muestra el título 'Filtros'", () => {
      renderSidebar();
      expect(screen.getByText("Filtros")).toBeInTheDocument();
    });

    it("muestra el botón 'Resetear'", () => {
      renderSidebar();
      expect(screen.getByText("Resetear")).toBeInTheDocument();
    });

    it("renderiza una sección por cada filtro definido en FILTERS", () => {
      renderSidebar();
      // Cada filtro tiene un título visible en el sidebar
      FILTERS.forEach(({ title }) => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });

    it("muestra todas las opciones de todos los filtros", () => {
      renderSidebar();
      // Verificamos un subconjunto representativo
      expect(screen.getByRole("button", { name: "DE" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Últimos 30 días" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sí" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Language" }),
      ).toBeInTheDocument();
    });
  });

  describe("botón Resetear", () => {
    it("llama a onReset al pulsarlo", async () => {
      const user = userEvent.setup();
      const { onReset } = renderSidebar();

      await user.click(screen.getByText("Resetear"));

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("no llama a onFilterChange al pulsar Resetear", async () => {
      const user = userEvent.setup();
      const { onFilterChange } = renderSidebar();

      await user.click(screen.getByText("Resetear"));

      expect(onFilterChange).not.toHaveBeenCalled();
    });
  });

  describe("selección de filtros", () => {
    it("llama a onFilterChange con la key y valor correctos al seleccionar país", async () => {
      const user = userEvent.setup();
      const { onFilterChange } = renderSidebar();

      await user.click(screen.getByRole("button", { name: "DE" }));

      expect(onFilterChange).toHaveBeenCalledWith("pais", "DE");
    });

    it("llama a onFilterChange con la key y valor correctos al seleccionar periodo", async () => {
      const user = userEvent.setup();
      const { onFilterChange } = renderSidebar();

      await user.click(screen.getByRole("button", { name: "Últimos 30 días" }));

      expect(onFilterChange).toHaveBeenCalledWith("periodo", "Últimos 30 días");
    });

    it("llama a onFilterChange con la key y valor correctos al seleccionar remote", async () => {
      const user = userEvent.setup();
      const { onFilterChange } = renderSidebar();

      await user.click(screen.getByRole("button", { name: "Sí" }));

      expect(onFilterChange).toHaveBeenCalledWith("remote", "Sí");
    });

    it("llama a onFilterChange exactamente una vez por click", async () => {
      const user = userEvent.setup();
      const { onFilterChange } = renderSidebar();

      await user.click(screen.getByRole("button", { name: "FR" }));

      expect(onFilterChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("estado visual del filtro activo", () => {
    it("el valor activo de cada filtro se marca como seleccionado", () => {
      // Con filters.pais = "ES", el botón "ES" debe tener la clase isActive
      renderSidebar({ filters: { ...filtersNeutros, pais: "ES" } });

      const botonES = screen.getByRole("button", { name: "ES" });
      // FilterButton aplica "border-primary bg-primary text-primary-foreground" cuando isActive=true
      expect(botonES.className).toContain("bg-primary");
    });

    it("los valores no activos no tienen la clase de seleccionado", () => {
      renderSidebar({ filters: { ...filtersNeutros, pais: "ES" } });

      const botonDE = screen.getByRole("button", { name: "DE" });
      expect(botonDE.className).not.toContain("bg-primary");
    });
  });
});
