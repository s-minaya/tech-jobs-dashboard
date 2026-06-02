import { describe, it, expect } from "vitest";
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

    it("muestra aviso ⚠ cuando jornada está activa (filtro ignorado)", async () => {
      render(
        <DemandByRoleChart
          filters={{ ...filtersNeutros, jornada: "Full time" }}
        />,
      );
      await waitFor(() => {
        expect(screen.getByText("⚠")).toBeInTheDocument();
      });
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
});
