import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/FilterWarningPopover", () => ({
  default: ({ texto }) => (
    <button data-testid="warning-popover" aria-label={`aviso: ${texto}`}>
      ⓘ
    </button>
  ),
}));

vi.mock("@/components/ui/DecryptedText", () => ({
  default: ({ text }) => <span>{text}</span>,
}));

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
    it("la API devuelve datos y el badge de ofertas aparece", async () => {
      // Recharts no renderiza SVG en jsdom (width=0) — los nombres de skills
      // aparecen como ticks SVG que jsdom no mide. Verificamos que los datos
      // llegaron comprobando el badge de ofertas que sí es HTML normal.
      render(<TopSkillsChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(/26\.023/)).toBeInTheDocument();
        expect(screen.queryByText(/no hay datos/i)).not.toBeInTheDocument();
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
        // Con filtros neutros solo aparece el badge de ofertas, no pills de filtro
        expect(
          screen.queryByText(/alemania|españa|solo remoto/i),
        ).not.toBeInTheDocument();
      });
    });

    it("muestra los filtros activos cuando los hay", async () => {
      render(<TopSkillsChart filters={{ ...filtersNeutros, pais: "DE" }} />);
      await waitFor(() => {
        expect(
          screen.getByText(/alemania|españa|francia/i),
        ).toBeInTheDocument();
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
