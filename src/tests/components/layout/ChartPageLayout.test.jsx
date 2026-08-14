import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChartPageLayout from "@/components/layout/ChartPageLayout";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

const filtersNeutros = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

describe("ChartPageLayout", () => {
  it("renderiza su contenido (children) junto al sidebar de filtros", () => {
    render(
      <ChartPageLayout
        filters={filtersNeutros}
        onFilterChange={vi.fn()}
        onReset={vi.fn()}
      >
        <p>Contenido de la gráfica</p>
      </ChartPageLayout>,
    );
    expect(screen.getByText("Contenido de la gráfica")).toBeInTheDocument();
    // DesktopFilterSidebar montado de verdad, no un mock.
    expect(screen.getByText("Filtros")).toBeInTheDocument();
    expect(screen.getByText("País")).toBeInTheDocument();
  });

  it("pasa filters/onFilterChange/onReset al DesktopFilterSidebar", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(
      <ChartPageLayout
        filters={filtersNeutros}
        onFilterChange={onFilterChange}
        onReset={vi.fn()}
      >
        <p>Contenido</p>
      </ChartPageLayout>,
    );
    await user.click(screen.getByText("Alemania"));
    expect(onFilterChange).toHaveBeenCalledWith("pais", "DE");
  });
});
