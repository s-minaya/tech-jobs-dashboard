import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import TopSkillsChart from "@/components/Charts/TopSkillsChart";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

const filtersNeutros = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

describe("TopSkillsChart", () => {
  describe("estado de carga", () => {
    it("muestra el título siempre", () => {
      render(<TopSkillsChart filters={filtersNeutros} />);
      expect(screen.getByText("Top Skills más demandadas")).toBeInTheDocument();
    });

    it("muestra 'Cargando...' durante la primera carga", () => {
      // Petición que nunca resuelve para mantener el estado de carga
      server.use(http.get("/api/skills/top", () => new Promise(() => {})));
      render(<TopSkillsChart filters={filtersNeutros} />);
      expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });
  });

  describe("datos cargados", () => {
    it("muestra las skills devueltas por la API", async () => {
      render(<TopSkillsChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText("Python")).toBeInTheDocument();
        expect(screen.getByText("SQL")).toBeInTheDocument();
        expect(screen.getByText("React")).toBeInTheDocument();
      });
    });

    it("muestra la descripción de la gráfica", async () => {
      render(<TopSkillsChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(/skills técnicas/i)).toBeInTheDocument();
      });
    });

    it("muestra 'datos globales' cuando no hay filtros activos", async () => {
      render(<TopSkillsChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(/datos globales/i)).toBeInTheDocument();
      });
    });

    it("muestra los filtros activos cuando los hay", async () => {
      render(<TopSkillsChart filters={{ ...filtersNeutros, pais: "DE" }} />);
      await waitFor(() => {
        expect(screen.getByText(/filtros activos/i)).toBeInTheDocument();
        expect(screen.getByText(/alemania/i)).toBeInTheDocument();
      });
    });
  });

  describe("sin resultados", () => {
    it("muestra mensaje cuando la API devuelve array vacío", async () => {
      server.use(
        http.get("/api/skills/top", () =>
          HttpResponse.json({ rows: [], total_matching_jobs: 0 }),
        ),
      );
      render(<TopSkillsChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(/no hay datos/i)).toBeInTheDocument();
      });
    });
  });

  describe("manejo de errores", () => {
    it("muestra el mensaje de error cuando la API falla", async () => {
      server.use(
        http.get("/api/skills/top", () =>
          HttpResponse.json({ detail: "Error en skills-top" }, { status: 500 }),
        ),
      );
      render(<TopSkillsChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
