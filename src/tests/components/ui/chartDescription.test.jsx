import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";
import ChartDescription from "@/components/ui/ChartDescription";

const filtersNeutros = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

describe("ChartDescription", () => {
  describe("descripción", () => {
    it("muestra el texto de descripción", () => {
      render(
        <ChartDescription
          description="Skills técnicas."
          filters={filtersNeutros}
        />,
      );
      expect(screen.getByText("Skills técnicas.")).toBeInTheDocument();
    });
  });
  describe("total de ofertas", () => {
    it("muestra el total formateado", () => {
      render(
        <ChartDescription
          description="Test"
          filters={filtersNeutros}
          totalJobs={26023}
        />,
      );
      expect(screen.getByText(/26\.023/)).toBeInTheDocument();
    });
    it("no muestra el badge cuando totalJobs es null", () => {
      render(
        <ChartDescription
          description="Test"
          filters={filtersNeutros}
          totalJobs={null}
        />,
      );
      expect(screen.queryByText(/ofertas/)).not.toBeInTheDocument();
    });
  });
  describe("filtros activos", () => {
    it("muestra pill global cuando no hay filtros ni totalJobs", () => {
      render(<ChartDescription description="Test" filters={filtersNeutros} />);
      expect(screen.getByText(/todos los países/i)).toBeInTheDocument();
    });
    it("muestra pill con el país activo", () => {
      render(
        <ChartDescription
          description="Test"
          filters={{ ...filtersNeutros, pais: "DE" }}
        />,
      );
      expect(screen.getByText(/alemania/i)).toBeInTheDocument();
    });
    it("muestra pill solo remoto", () => {
      render(
        <ChartDescription
          description="Test"
          filters={{ ...filtersNeutros, remote: "Sí" }}
        />,
      );
      expect(screen.getByText(/solo remoto/i)).toBeInTheDocument();
    });
    it("no muestra filtro excluido como pill activo", () => {
      render(
        <ChartDescription
          description="Test"
          filters={{ ...filtersNeutros, jornada: "Full time" }}
          excludeFilters={["jornada"]}
        />,
      );
      expect(screen.queryByText(/full time/i)).not.toBeInTheDocument();
    });
  });
  describe("nota adicional", () => {
    it("muestra la nota", () => {
      render(
        <ChartDescription
          description="Test"
          filters={filtersNeutros}
          nota="Actualización 24h."
        />,
      );
      expect(screen.getByText(/actualización 24h/i)).toBeInTheDocument();
    });
    it("no muestra nota cuando es null", () => {
      render(
        <ChartDescription
          description="Test"
          filters={filtersNeutros}
          nota={null}
        />,
      );
      expect(screen.queryByText(/actualización 24h/i)).not.toBeInTheDocument();
    });
  });
});
