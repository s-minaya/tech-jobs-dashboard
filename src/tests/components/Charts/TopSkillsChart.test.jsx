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

  // Fase 013 — hueco de test detectado en la auditoría: ningún test
  // ejercitaba skillCategoria activo (pill traducida, texto de la
  // descripción, forma de la petición saliente).
  describe("categoría de skill activa", () => {
    it("la pill muestra la categoría traducida al español, no el valor crudo en inglés", async () => {
      render(
        <TopSkillsChart
          filters={{ ...filtersNeutros, skillCategoria: "Database" }}
        />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("chart-filter-pills")).toHaveTextContent(
          "categoría de skill: base de datos",
        );
      });
      expect(screen.queryByText(/database/i)).not.toBeInTheDocument();
    });

    it("la descripción del chart menciona la categoría traducida", async () => {
      render(
        <TopSkillsChart
          filters={{ ...filtersNeutros, skillCategoria: "Methodology" }}
        />,
      );
      await waitFor(() => {
        expect(screen.getByText(/de la categoría "metodología"/i)).toBeInTheDocument();
      });
    });

    it("la petición saliente incluye category en minúsculas y nunca jornada", async () => {
      let capturedParams;
      server.use(
        http.get("/api/skills/top", ({ request }) => {
          capturedParams = new URL(request.url).searchParams;
          return HttpResponse.json({ rows: [], total_matching_jobs: 0 });
        }),
      );
      render(
        <TopSkillsChart
          filters={{
            ...filtersNeutros,
            skillCategoria: "Database",
            jornada: "Full time",
          }}
        />,
      );
      await waitFor(() => expect(capturedParams).toBeDefined());
      expect(capturedParams.get("category")).toBe("database");
      expect(capturedParams.has("jornada")).toBe(false);
    });
  });

  // Fase 013 — hueco de test detectado: ningún test verificaba que el
  // aviso ⓘ de jornada aparece cuando ese filtro está activo (justo el
  // filtro que ChartDescription declara ignorado en este chart).
  describe("aviso de jornada", () => {
    it("aparece el ⓘ cuando jornada está activa", async () => {
      render(
        <TopSkillsChart filters={{ ...filtersNeutros, jornada: "Full time" }} />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("warning-popover")).toBeInTheDocument();
      });
    });

    it("no aparece con los filtros neutros", async () => {
      render(<TopSkillsChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(/26\.023/)).toBeInTheDocument();
      });
      expect(screen.queryByTestId("warning-popover")).not.toBeInTheDocument();
    });
  });

  // Fase 013 — hueco de test detectado: el mock solo traía 5 filas,
  // nunca se ejercitó el techo de altura (ALTURA_MAXIMA) ni el scroll
  // interno que aparece con category activa (hasta 50 filas reales).
  describe("altura dinámica a escala realista", () => {
    it("con muchas filas, el contenedor queda con scroll interno acotado", async () => {
      const muchasSkills = Array.from({ length: 30 }, (_, i) => ({
        skill: `Skill${i}`,
        skill_category: "language",
        job_count: 100 - i,
      }));
      server.use(
        http.get("/api/skills/top", () =>
          HttpResponse.json({ rows: muchasSkills, total_matching_jobs: 5000 }),
        ),
      );
      render(<TopSkillsChart filters={filtersNeutros} />);
      const scrollArea = await screen.findByTestId("top-skills-scroll-area");
      await waitFor(() => {
        expect(scrollArea.style.maxHeight).toBe("700px");
        expect(scrollArea.style.overflow).toBe("hidden auto");
      });
    });

    it("con pocas filas, no se aplica ningún límite de altura", async () => {
      render(<TopSkillsChart filters={filtersNeutros} />);
      const scrollArea = await screen.findByTestId("top-skills-scroll-area");
      await waitFor(() => {
        expect(scrollArea.style.maxHeight).toBe("");
      });
    });
  });
});
