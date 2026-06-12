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
import SalaryChart from "@/components/Charts/SalaryChart";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

const filtersNeutros = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

describe("SalaryChart", () => {
  describe("estado de carga", () => {
    it("muestra el título siempre", () => {
      render(<SalaryChart filters={filtersNeutros} />);
      expect(
        screen.getByText("Salario mediano anual por rol y país"),
      ).toBeInTheDocument();
    });
  });

  describe("datos cargados", () => {
    it("muestra la descripción de la gráfica", async () => {
      render(<SalaryChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(
          screen.getByText(/salario mediano anual en euros/i),
        ).toBeInTheDocument();
      });
    });

    it("muestra los botones Todos y Ninguno", async () => {
      render(<SalaryChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText("Todos")).toBeInTheDocument();
        expect(screen.getByText("Ninguno")).toBeInTheDocument();
      });
    });

    it("muestra los roles disponibles como botones toggle", async () => {
      render(<SalaryChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /backend/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /data science/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("selector de roles", () => {
    it("al pulsar Ninguno muestra el mensaje de seleccionar rol", async () => {
      const user = userEvent.setup();
      render(<SalaryChart filters={filtersNeutros} />);

      await waitFor(() =>
        expect(screen.getByText("Ninguno")).toBeInTheDocument(),
      );
      await user.click(screen.getByText("Ninguno"));

      expect(
        screen.getByText(/selecciona al menos un rol/i),
      ).toBeInTheDocument();
    });

    it("al pulsar Todos después de Ninguno desaparece el mensaje", async () => {
      const user = userEvent.setup();
      render(<SalaryChart filters={filtersNeutros} />);

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

  describe("filtros ignorados", () => {
    it("muestra aviso ⚠ cuando skillCategoria está activa porque SalaryChart la ignora", async () => {
      // Este es el comportamiento CORRECTO: cuando el usuario tiene activa
      // skillCategoria pero SalaryChart no la usa, debe ver el aviso explicando
      // por qué ese filtro no tiene efecto en esta gráfica.
      render(
        <SalaryChart
          filters={{ ...filtersNeutros, skillCategoria: "Database" }}
        />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("warning-popover")).toBeInTheDocument();
      });
    });

    it("no muestra aviso ⚠ cuando skillCategoria está en su valor neutro", async () => {
      render(<SalaryChart filters={filtersNeutros} />);
      await waitFor(() => {
        // Esperamos a que carguen los datos para que el contenido sea visible
        expect(screen.getByText("Todos")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("warning-popover")).not.toBeInTheDocument();
    });

    it("muestra datos globales cuando no hay filtros activos visibles", async () => {
      render(<SalaryChart filters={filtersNeutros} />);
      await waitFor(() => {
        // Con filtros neutros solo aparece el badge de ofertas, no pills de filtro
        expect(
          screen.queryByText(/alemania|españa|solo remoto/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("manejo de errores", () => {
    it("muestra error cuando la API falla", async () => {
      server.use(
        http.get("/api/salary/by-role-country", () =>
          HttpResponse.json({ detail: "Error en salary" }, { status: 500 }),
        ),
      );
      render(<SalaryChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
