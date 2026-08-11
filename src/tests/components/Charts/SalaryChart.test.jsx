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

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import SalaryChart, {
  pivotData,
  TooltipSalario,
} from "@/components/Charts/SalaryChart";
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
      // Ámbito reducido a las pills de filtro (data-testid añadido en la
      // fase 010): antes esta comprobación buscaba "alemania" en todo el
      // documento, lo cual dejó de servir en cuanto el eje X empezó a
      // mostrar nombres de país en español — "Alemania" ahora aparece
      // legítimamente como etiqueta del gráfico, no como pill de filtro.
      render(<SalaryChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText("Todos")).toBeInTheDocument();
      });
      const pills = screen.getByTestId("chart-filter-pills");
      expect(
        within(pills).queryByText(/alemania|españa|solo remoto/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("sin datos", () => {
    it("muestra el mensaje de 'no hay datos' en vez de culpar al usuario de no elegir un rol", async () => {
      // Antes, con rows: [], se mostraba "Selecciona al menos un rol para
      // ver los salarios" — pero no había ningún rol para elegir, el
      // problema real era la ausencia de datos para esos filtros.
      server.use(
        http.get("/api/salary/by-role-country", () =>
          HttpResponse.json({ rows: [], total_matching_jobs: 0 }),
        ),
      );
      render(<SalaryChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(
          screen.getByText(/no hay datos para los filtros seleccionados/i),
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByText(/selecciona al menos un rol/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("nota de contrato", () => {
    it("con el filtro de contrato activo, la nota no mezcla inglés y español", async () => {
      render(
        <SalaryChart
          filters={{ ...filtersNeutros, contrato: "Contract" }}
        />,
      );
      await waitFor(() => {
        expect(screen.getByText(/contrato temporal/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/"contract"/i)).not.toBeInTheDocument();
    });

    it("con contrato en su valor neutro, no aparece ninguna nota de contrato", async () => {
      render(<SalaryChart filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText("Todos")).toBeInTheDocument();
      });
      expect(screen.queryByText(/mostrando solo contratos/i)).not.toBeInTheDocument();
    });
  });

  describe("selección de roles por defecto", () => {
    it("los roles disponibles (allRoles) vienen ordenados por volumen, no por orden de llegada — cubierto a fondo en roleLabels.test.js (rankRolesByVolume); aquí solo se comprueba la integración", async () => {
      render(<SalaryChart filters={filtersNeutros} />);
      await waitFor(() => {
        // backend (830 ofertas sumadas DE+FR) y data_science (280, solo DE)
        // son los únicos dos roles del mock — ambos caben en el "top 5" y
        // deben aparecer como botones disponibles independientemente del
        // orden en que llegaron las filas.
        expect(
          screen.getByRole("button", { name: /^backend$/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /data science/i }),
        ).toBeInTheDocument();
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

// pivotData y TooltipSalario — named exports añadidos en la fase 010 para
// poder testearlos aislados, sin montar el componente completo ni simular
// hover sobre el SVG de Recharts (frágil en jsdom, sin precedente en el
// resto del repo).
describe("pivotData", () => {
  it("usa NOMBRES_PAISES para el nombre de país, no country_name del backend", () => {
    // country_name viene en inglés de la BD real ("Germany") — ver
    // api/schema.sql, seed de la tabla countries. Debe prevalecer
    // NOMBRES_PAISES (español, ya usado en el resto de la UI).
    const rows = [
      {
        country_code: "de",
        country_name: "Germany",
        role_category: "backend",
        median_salary_eur: "65000",
        job_count: "10",
        avg_salary_eur: "68000",
      },
    ];
    const result = pivotData(rows);
    expect(result).toEqual([
      {
        country: "Alemania",
        backend: 65000,
        backend__meta: { job_count: 10, avg_salary_eur: 68000 },
      },
    ]);
  });

  it("cae a country_name si el código no está en NOMBRES_PAISES", () => {
    const rows = [
      {
        country_code: "xx",
        country_name: "Wonderland",
        role_category: "backend",
        median_salary_eur: "50000",
        job_count: "1",
        avg_salary_eur: "50000",
      },
    ];
    expect(pivotData(rows)[0].country).toBe("Wonderland");
  });

  it("agrupa varias filas del mismo país en un único objeto", () => {
    const rows = [
      {
        country_code: "de",
        country_name: "Germany",
        role_category: "backend",
        median_salary_eur: "65000",
        job_count: "10",
        avg_salary_eur: "68000",
      },
      {
        country_code: "de",
        country_name: "Germany",
        role_category: "data_science",
        median_salary_eur: "70000",
        job_count: "5",
        avg_salary_eur: "72000",
      },
    ];
    const result = pivotData(rows);
    expect(result).toHaveLength(1);
    expect(result[0].backend).toBe(65000);
    expect(result[0].data_science).toBe(70000);
  });

  it("array vacío devuelve array vacío", () => {
    expect(pivotData([])).toEqual([]);
  });
});

describe("TooltipSalario", () => {
  const chartConfig = { backend: { label: "Backend" } };

  it("no renderiza nada si active es false", () => {
    const { container } = render(
      <TooltipSalario active={false} payload={[]} chartConfig={chartConfig} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el número de ofertas y la media junto a la mediana", () => {
    render(
      <TooltipSalario
        active
        label="Alemania"
        chartConfig={chartConfig}
        payload={[
          {
            dataKey: "backend",
            value: 65000,
            fill: "#000",
            payload: {
              backend__meta: { job_count: 450, avg_salary_eur: 68000 },
            },
          },
        ]}
      />,
    );
    expect(screen.getByText(/450 ofertas/i)).toBeInTheDocument();
    expect(screen.getByText(/media 68.000/i)).toBeInTheDocument();
  });

  it("muestra el aviso de muestra pequeña cuando job_count < 5", () => {
    render(
      <TooltipSalario
        active
        label="Austria"
        chartConfig={chartConfig}
        payload={[
          {
            dataKey: "backend",
            value: 72500,
            fill: "#000",
            payload: {
              backend__meta: { job_count: 3, avg_salary_eur: 72500 },
            },
          },
        ]}
      />,
    );
    expect(screen.getByText(/muestra pequeña/i)).toBeInTheDocument();
  });

  it("no muestra el aviso de muestra pequeña cuando job_count >= 5", () => {
    render(
      <TooltipSalario
        active
        label="Alemania"
        chartConfig={chartConfig}
        payload={[
          {
            dataKey: "backend",
            value: 65000,
            fill: "#000",
            payload: {
              backend__meta: { job_count: 5, avg_salary_eur: 65000 },
            },
          },
        ]}
      />,
    );
    expect(screen.queryByText(/muestra pequeña/i)).not.toBeInTheDocument();
  });
});
