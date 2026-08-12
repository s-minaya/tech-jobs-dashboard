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
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import DemandByRoleChart from "@/components/Charts/DemandByRoleChart";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

const filtersNeutros = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

describe("DemandByRoleChart", () => {
  describe("aviso de periodo insuficiente", () => {
    it("muestra aviso cuando el periodo es 'Últimos 30 días'", async () => {
      render(
        <DemandByRoleChart
          filters={{ ...filtersNeutros, periodo: "Últimos 30 días" }}
        />,
      );
      // El aviso vive dentro de ChartCard, que oculta el contenido durante
      // la carga inicial. Necesitamos waitFor para que la carga termine
      // y ChartCard renderice el contenido.
      await waitFor(() => {
        expect(screen.getByText(/periodo insuficiente/i)).toBeInTheDocument();
      });
    });

    it("no muestra aviso con el periodo por defecto (90 días)", async () => {
      render(<DemandByRoleChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(
          screen.queryByText(/periodo insuficiente/i),
        ).not.toBeInTheDocument();
      });
    });

    it("no muestra aviso con 'Últimos 6 meses'", async () => {
      render(
        <DemandByRoleChart
          filters={{ ...filtersNeutros, periodo: "Últimos 6 meses" }}
        />,
      );
      await waitFor(() => {
        expect(
          screen.queryByText(/periodo insuficiente/i),
        ).not.toBeInTheDocument();
      });
    });

    it("no muestra aviso con 'Todo el histórico'", async () => {
      render(
        <DemandByRoleChart
          filters={{ ...filtersNeutros, periodo: "Todo el histórico" }}
        />,
      );
      await waitFor(() => {
        expect(
          screen.queryByText(/periodo insuficiente/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("selector de roles", () => {
    it("muestra los botones Todos y Ninguno", async () => {
      render(<DemandByRoleChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText("Todos")).toBeInTheDocument();
        expect(screen.getByText("Ninguno")).toBeInTheDocument();
      });
    });

    it("muestra los roles disponibles como botones toggle", async () => {
      render(<DemandByRoleChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /backend/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /devops/i }),
        ).toBeInTheDocument();
      });
    });

    it("al pulsar Ninguno, muestra el mensaje de seleccionar rol", async () => {
      const user = userEvent.setup();
      render(<DemandByRoleChart filters={filtersNeutros} />);

      await waitFor(() =>
        expect(screen.getByText("Ninguno")).toBeInTheDocument(),
      );
      await user.click(screen.getByText("Ninguno"));

      expect(
        screen.getByText(/selecciona al menos un rol/i),
      ).toBeInTheDocument();
    });

    it("al pulsar Todos después de Ninguno, desaparece el mensaje", async () => {
      const user = userEvent.setup();
      render(<DemandByRoleChart filters={filtersNeutros} />);

      await waitFor(() =>
        expect(screen.getByText("Todos")).toBeInTheDocument(),
      );
      await user.click(screen.getByText("Ninguno"));
      await user.click(screen.getByText("Todos"));

      expect(
        screen.queryByText(/selecciona al menos un rol/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("descripción y filtros", () => {
    it("muestra la descripción de la gráfica", async () => {
      render(<DemandByRoleChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(
          screen.getByText(/número de ofertas publicadas/i),
        ).toBeInTheDocument();
      });
    });

    it("NO muestra aviso ⚠ cuando jornada está activa — sí se aplica como filtro real (hallazgo post-implementación, ver 011-tasks.md)", async () => {
      render(
        <DemandByRoleChart
          filters={{ ...filtersNeutros, jornada: "Full time" }}
        />,
      );
      await waitFor(() => {
        expect(screen.getByText(/número de ofertas publicadas/i)).toBeInTheDocument();
      });
      expect(screen.queryByTestId("warning-popover")).not.toBeInTheDocument();
    });
  });

  describe("eficiencia de las consultas", () => {
    it("no llama a la API cuando el periodo es 'Últimos 30 días' — el gráfico nunca se renderiza en ese estado, pedir los datos sería una consulta desperdiciada", async () => {
      let calls = 0;
      server.use(
        http.get("/api/jobs/demand-by-role", () => {
          calls++;
          return HttpResponse.json({ rows: [], total_matching_jobs: 0 });
        }),
      );
      render(
        <DemandByRoleChart
          filters={{ ...filtersNeutros, periodo: "Últimos 30 días" }}
        />,
      );
      await waitFor(() => {
        expect(screen.getByText(/periodo insuficiente/i)).toBeInTheDocument();
      });
      expect(calls).toBe(0);
    });
  });

  describe("manejo de errores", () => {
    it("muestra error cuando la API falla", async () => {
      server.use(
        http.get("/api/jobs/demand-by-role", () =>
          HttpResponse.json(
            { detail: "Error en demand-by-role" },
            { status: 500 },
          ),
        ),
      );
      render(<DemandByRoleChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe("selección de roles por defecto", () => {
    it("los roles disponibles (allRoles) vienen ordenados por volumen, no por orden de llegada — cubierto a fondo en roleLabels.test.js (rankRolesByVolume); aquí solo se comprueba la integración", async () => {
      render(<DemandByRoleChart filters={filtersNeutros} />);
      await waitFor(() => {
        // backend (365 ofertas sumadas feb+mar) y devops (208) son los
        // únicos dos roles del mock — ambos caben en el "top 5" y deben
        // aparecer como botones disponibles independientemente del orden
        // en que llegaron las filas.
        expect(
          screen.getByRole("button", { name: /^backend$/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /^devops$/i }),
        ).toBeInTheDocument();
      });
    });

    it("excluye 'other' de la selección automática aunque sea el rol con más volumen, pero lo deja disponible para selección manual", async () => {
      server.use(
        http.get("/api/jobs/demand-by-role", () =>
          HttpResponse.json({
            rows: [
              { month: "2025-02-01T00:00:00.000Z", role_category: "other", job_count: 500 },
              { month: "2025-02-01T00:00:00.000Z", role_category: "backend", job_count: 100 },
              { month: "2025-02-01T00:00:00.000Z", role_category: "devops", job_count: 80 },
              { month: "2025-02-01T00:00:00.000Z", role_category: "frontend", job_count: 60 },
              { month: "2025-02-01T00:00:00.000Z", role_category: "cloud", job_count: 40 },
              { month: "2025-02-01T00:00:00.000Z", role_category: "data_science", job_count: 20 },
            ],
            total_matching_jobs: 800,
          }),
        ),
      );
      render(<DemandByRoleChart filters={filtersNeutros} />);

      // "other" tiene más volumen (500) que cualquier otro rol, pero no
      // debe estar entre los 5 seleccionados por defecto — data_science
      // (el 5º por volumen tras excluir "other") sí debe estarlo.
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /data science/i }),
        ).toBeInTheDocument();
      });
      const botonOther = screen.getByRole("button", { name: /^other$/i });
      // Disponible como botón (selección manual sigue siendo posible)...
      expect(botonOther).toBeInTheDocument();
      // ...pero no resaltado como parte de la selección por defecto —
      // RoleSelector solo aplica "border-transparent text-white" a los
      // roles activos (ver RoleSelector.jsx).
      expect(botonOther).toHaveClass("border-border");
      expect(botonOther).not.toHaveClass("border-transparent");
    });
  });

  describe("sin datos", () => {
    it("muestra el mensaje de 'sin datos' cuando rows está vacío", async () => {
      server.use(
        http.get("/api/jobs/demand-by-role", () =>
          HttpResponse.json({ rows: [], total_matching_jobs: 0 }),
        ),
      );
      render(<DemandByRoleChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(
          screen.getByText(/no hay datos para los filtros seleccionados/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("nota", () => {
    it("menciona que la selección es por volumen total y que el último mes puede estar incompleto", async () => {
      render(<DemandByRoleChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(/en total/i)).toBeInTheDocument();
        expect(screen.getByText(/puede estar incompleto/i)).toBeInTheDocument();
      });
    });
  });
});
