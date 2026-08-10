import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterDrawer, { FilterFAB } from "@/components/Filters/FilterDrawer";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

// Nota: este archivo testeaba por error SummaryStats (contenido duplicado
// desde el commit que lo creó) — FilterDrawer nunca tuvo tests propios.
// Reescrito en la fase 004 al modificar el componente.

const filtersNeutros = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

function renderDrawer(props = {}) {
  const onClose = vi.fn();
  const onFilterChange = vi.fn();
  const onReset = vi.fn();
  const utils = render(
    <FilterDrawer
      isOpen={true}
      onClose={onClose}
      filters={filtersNeutros}
      onFilterChange={onFilterChange}
      onReset={onReset}
      {...props}
    />,
  );
  return { ...utils, onClose, onFilterChange, onReset };
}

describe("FilterDrawer", () => {
  describe("estructura", () => {
    it("muestra el título Filtros en la cabecera", () => {
      renderDrawer();
      expect(screen.getByText("Filtros")).toBeInTheDocument();
    });

    it("renderiza una sección por cada filtro configurado", () => {
      renderDrawer();
      expect(screen.getByText("País")).toBeInTheDocument();
      expect(screen.getByText("Periodo")).toBeInTheDocument();
      expect(screen.getByText("Tipo de contrato")).toBeInTheDocument();
      expect(screen.getByText("Jornada")).toBeInTheDocument();
      expect(screen.getByText("Remote")).toBeInTheDocument();
      expect(screen.getByText("Categoría de skills")).toBeInTheDocument();
    });

    it("muestra el botón Ver resultados", () => {
      renderDrawer();
      expect(screen.getByText("Ver resultados")).toBeInTheDocument();
    });
  });

  describe("estado abierto/cerrado", () => {
    it("aplica translate-x-0 cuando isOpen=true", () => {
      const { container } = renderDrawer({ isOpen: true });
      const panel = container.querySelector(".w-72");
      expect(panel).toHaveClass("translate-x-0");
    });

    it("aplica -translate-x-full cuando isOpen=false", () => {
      const { container } = renderDrawer({ isOpen: false });
      const panel = container.querySelector(".w-72");
      expect(panel).toHaveClass("-translate-x-full");
    });
  });

  describe("badge de filtros activos", () => {
    it("no muestra badge cuando todos los filtros están en su valor neutro", () => {
      renderDrawer();
      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });

    it("muestra el badge con el número de filtros activos", () => {
      renderDrawer({
        filters: { ...filtersNeutros, pais: "DE", remote: "Sí" },
      });
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  describe("interacciones", () => {
    it("llama a onClose al pulsar el botón de cerrar", async () => {
      const user = userEvent.setup();
      const { onClose } = renderDrawer();
      await user.click(screen.getByLabelText("Cerrar filtros"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar el overlay", async () => {
      const user = userEvent.setup();
      const { onClose, container } = renderDrawer();
      const overlay = container.querySelector('[aria-hidden="true"]');
      await user.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar Ver resultados", async () => {
      const user = userEvent.setup();
      const { onClose } = renderDrawer();
      await user.click(screen.getByText("Ver resultados"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onReset al pulsar Resetear", async () => {
      const user = userEvent.setup();
      const { onReset } = renderDrawer();
      await user.click(screen.getByText("Resetear"));
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("llama a onFilterChange con la key y el valor al elegir una opción", async () => {
      const user = userEvent.setup();
      const { onFilterChange } = renderDrawer();
      await user.click(screen.getByText("DE"));
      expect(onFilterChange).toHaveBeenCalledWith("pais", "DE");
    });
  });
});

describe("FilterFAB", () => {
  function renderFAB(props = {}) {
    const onClick = vi.fn();
    const utils = render(
      <FilterFAB filters={filtersNeutros} onClick={onClick} {...props} />,
    );
    return { ...utils, onClick };
  }

  it("muestra el texto Filtros", () => {
    renderFAB();
    expect(screen.getByText("Filtros")).toBeInTheDocument();
  });

  it("llama a onClick al pulsar", async () => {
    const user = userEvent.setup();
    const { onClick } = renderFAB();
    await user.click(screen.getByText("Filtros"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("no muestra badge cuando no hay filtros activos", () => {
    renderFAB();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("muestra el badge con el número de filtros activos", () => {
    renderFAB({ filters: { ...filtersNeutros, pais: "DE" } });
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
