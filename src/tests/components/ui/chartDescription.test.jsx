import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ChartDescription from "@/components/ui/ChartDescription";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

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
          description="Skills técnicas más demandadas."
          filters={filtersNeutros}
        />,
      );
      expect(
        screen.getByText("Skills técnicas más demandadas."),
      ).toBeInTheDocument();
    });
  });

  describe("total de ofertas", () => {
    it("muestra el total formateado con separador de miles", () => {
      render(
        <ChartDescription
          description="Test"
          filters={filtersNeutros}
          totalJobs={26023}
        />,
      );
      expect(screen.getByText(/26\.023/)).toBeInTheDocument();
      expect(screen.getByText(/ofertas/)).toBeInTheDocument();
    });

    it("no muestra el bloque de ofertas cuando totalJobs es null", () => {
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
    it("muestra 'datos globales' cuando no hay filtros activos", () => {
      render(<ChartDescription description="Test" filters={filtersNeutros} />);
      expect(screen.getByText(/datos globales/i)).toBeInTheDocument();
    });

    it("muestra 'Filtros activos' cuando hay algún filtro activo", () => {
      render(
        <ChartDescription
          description="Test"
          filters={{ ...filtersNeutros, pais: "DE" }}
        />,
      );
      expect(screen.getByText(/filtros activos/i)).toBeInTheDocument();
      expect(screen.getByText(/alemania/i)).toBeInTheDocument();
    });

    it("muestra el nombre en español del país seleccionado", () => {
      render(
        <ChartDescription
          description="Test"
          filters={{ ...filtersNeutros, pais: "ES" }}
        />,
      );
      expect(screen.getByText(/españa/i)).toBeInTheDocument();
    });

    it("muestra 'solo remoto' cuando remote es Sí", () => {
      render(
        <ChartDescription
          description="Test"
          filters={{ ...filtersNeutros, remote: "Sí" }}
        />,
      );
      expect(screen.getByText(/solo remoto/i)).toBeInTheDocument();
    });
  });

  describe("avisos de filtros ignorados", () => {
    it("muestra aviso ⚠ cuando un filtro excluido está activo", () => {
      render(
        <ChartDescription
          description="Test"
          filters={{ ...filtersNeutros, jornada: "Full time" }}
          excludeFilters={["jornada"]}
        />,
      );
      expect(screen.getByText("⚠")).toBeInTheDocument();
      expect(screen.getByText(/jornada/i)).toBeInTheDocument();
    });

    it("el aviso de país en contexto 'mapa' menciona que el mapa muestra todos los países", () => {
      render(
        <ChartDescription
          description="Test"
          filters={{ ...filtersNeutros, pais: "DE" }}
          excludeFilters={["pais"]}
          contexto="mapa"
        />,
      );
      // Verificamos que el texto es específico del contexto mapa,
      // no el genérico de co-ocurrencias
      expect(
        screen.getByText(/el mapa siempre muestra todos/i),
      ).toBeInTheDocument();
    });

    it("el aviso de país sin contexto menciona las co-ocurrencias", () => {
      render(
        <ChartDescription
          description="Test"
          filters={{ ...filtersNeutros, pais: "DE" }}
          excludeFilters={["pais"]}
        />,
      );
      expect(screen.getByText(/co-ocurrencias/i)).toBeInTheDocument();
    });

    it("no muestra aviso cuando el filtro excluido está en su valor neutro", () => {
      render(
        <ChartDescription
          description="Test"
          filters={{ ...filtersNeutros, jornada: "Todos" }}
          excludeFilters={["jornada"]}
        />,
      );
      expect(screen.queryByText("⚠")).not.toBeInTheDocument();
    });

    it("muestra un aviso por cada filtro excluido que esté activo", () => {
      render(
        <ChartDescription
          description="Test"
          filters={{
            ...filtersNeutros,
            jornada: "Full time",
            contrato: "permanent",
          }}
          excludeFilters={["jornada", "contrato"]}
        />,
      );
      expect(screen.getAllByText("⚠")).toHaveLength(2);
    });
  });

  describe("nota adicional", () => {
    it("muestra la nota cuando se proporciona", () => {
      render(
        <ChartDescription
          description="Test"
          filters={filtersNeutros}
          nota="Los datos se actualizan cada 24h."
        />,
      );
      expect(screen.getByText(/los datos se actualizan/i)).toBeInTheDocument();
    });

    it("no muestra el texto de la nota cuando es null", () => {
      render(
        <ChartDescription
          description="Test"
          filters={filtersNeutros}
          nota={null}
        />,
      );
      // Verificamos que el texto de la nota no está, no contamos elementos
      expect(
        screen.queryByText(/los datos se actualizan/i),
      ).not.toBeInTheDocument();
    });
  });
});
