import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopFilterSidebar from "@/components/Filters/DesktopFilterSidebar";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

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
  const utils = render(
    <DesktopFilterSidebar
      filters={filtersNeutros}
      onFilterChange={onFilterChange}
      onReset={onReset}
      {...props}
    />,
  );
  return { ...utils, onFilterChange, onReset };
}

describe("DesktopFilterSidebar", () => {
  describe("estructura", () => {
    it("muestra el título y las 6 secciones, abierto por defecto", () => {
      renderSidebar();
      expect(screen.getByText("Filtros")).toBeInTheDocument();
      expect(screen.getByText("País")).toBeInTheDocument();
      expect(screen.getByText("Periodo")).toBeInTheDocument();
      expect(screen.getByText("Tipo de contrato")).toBeInTheDocument();
      expect(screen.getByText("Jornada")).toBeInTheDocument();
      expect(screen.getByText("Remoto")).toBeInTheDocument();
      expect(screen.getByText("Categoría de skills")).toBeInTheDocument();
    });

    it("no renderiza ningún overlay fijo sobre la página", () => {
      const { container } = renderSidebar();
      expect(
        container.querySelector('[aria-hidden="true"]'),
      ).not.toBeInTheDocument();
    });
  });

  describe("colapso", () => {
    it("empieza expandido", () => {
      renderSidebar();
      expect(
        screen.getByRole("button", { name: /colapsar filtros/i }),
      ).toHaveAttribute("aria-expanded", "true");
    });

    it("al colapsar, oculta las secciones de filtro", async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(
        screen.getByRole("button", { name: /colapsar filtros/i }),
      );
      expect(screen.queryByText("País")).not.toBeInTheDocument();
    });

    it("al expandir de nuevo, las secciones reaparecen", async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(
        screen.getByRole("button", { name: /colapsar filtros/i }),
      );
      await user.click(
        screen.getByRole("button", { name: /expandir filtros/i }),
      );
      expect(screen.getByText("País")).toBeInTheDocument();
    });
  });

  describe("badge de filtros activos", () => {
    it("no muestra badge sin filtros activos", () => {
      renderSidebar();
      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });

    it("muestra el badge con el número de filtros activos", () => {
      renderSidebar({ filters: { ...filtersNeutros, pais: "DE", remote: "Sí" } });
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  describe("interacciones", () => {
    it("llama a onFilterChange con la key y el valor crudo", async () => {
      const user = userEvent.setup();
      const { onFilterChange } = renderSidebar();
      await user.click(screen.getByText("Alemania"));
      expect(onFilterChange).toHaveBeenCalledWith("pais", "DE");
    });

    it("llama a onReset al pulsar Resetear", async () => {
      const user = userEvent.setup();
      const { onReset } = renderSidebar();
      await user.click(screen.getByText("Resetear"));
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });
});
