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
import SkillHeatmap from "@/components/Charts/SkillHeatmap";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

const filtersNeutros = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

const TEXTO_DESCRIPCION = /muestra qué skills aparecen juntas/i;

describe("SkillHeatmap", () => {
  describe("estado de carga", () => {
    it("muestra el título siempre", () => {
      render(<SkillHeatmap filters={filtersNeutros} />);
      expect(
        screen.getByText("Co-ocurrencia de skills en ofertas de empleo"),
      ).toBeInTheDocument();
    });

    it("muestra 'Cargando...' durante la primera carga", () => {
      server.use(
        http.get("/api/skills/cooccurrence", () => new Promise(() => {})),
      );
      render(<SkillHeatmap filters={filtersNeutros} />);
      expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });
  });

  describe("datos cargados", () => {
    it("muestra la descripción de la gráfica", async () => {
      render(<SkillHeatmap filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(TEXTO_DESCRIPCION)).toBeInTheDocument();
      });
    });

    it("muestra el total de ofertas sobre las que se calculan los porcentajes", async () => {
      render(<SkillHeatmap filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(/26\.023/)).toBeInTheDocument();
      });
    });

    it("muestra cuántas skills se están mostrando", async () => {
      render(<SkillHeatmap filters={filtersNeutros} />);
      // El párrafo "Mostrando 5 skills..." tiene el número en un <strong> separado.
      // getByText con regex no puede cruzar elementos hijos, así que usamos
      // una función matcher que compara contra el textContent completo del elemento.
      await waitFor(() => {
        const parrafo = screen.getByText(
          (_, element) =>
            element?.tagName === "P" &&
            /mostrando/i.test(element.textContent) &&
            /skills/i.test(element.textContent),
        );
        expect(parrafo).toBeInTheDocument();
      });
    });

    it("indica que las skills son las más populares globalmente sin filtro de categoría", async () => {
      render(<SkillHeatmap filters={filtersNeutros} />);
      await waitFor(() => {
        expect(
          screen.getByText(/más populares globalmente/i),
        ).toBeInTheDocument();
      });
    });

    it("renderiza el contenedor SVG del heatmap", async () => {
      render(<SkillHeatmap filters={filtersNeutros} />);
      await waitFor(() => {
        expect(document.querySelector("svg")).toBeInTheDocument();
      });
    });
  });

  describe("filtro de categoría", () => {
    it("muestra el nombre de la categoría activa", async () => {
      render(
        <SkillHeatmap
          filters={{ ...filtersNeutros, skillCategoria: "Language" }}
        />,
      );
      await waitFor(() => {
        const elementos = screen.getAllByText(/language/i);
        expect(elementos.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("muestra mensaje cuando no hay skills para la categoría seleccionada", async () => {
      server.use(
        http.get("/api/skills/top", () =>
          HttpResponse.json({ rows: [], total_matching_jobs: 0 }),
        ),
      );
      render(
        <SkillHeatmap
          filters={{ ...filtersNeutros, skillCategoria: "Methodology" }}
        />,
      );
      await waitFor(() => {
        expect(screen.getByText(/no hay skills/i)).toBeInTheDocument();
      });
    });
  });

  describe("filtros ignorados — avisos ⚠", () => {
    it("muestra aviso ⚠ cuando pais está activo", async () => {
      render(<SkillHeatmap filters={{ ...filtersNeutros, pais: "DE" }} />);
      await waitFor(() => {
        expect(screen.getByTestId("warning-popover")).toBeInTheDocument();
      });
    });

    it("muestra aviso ⚠ cuando contrato está activo", async () => {
      render(
        <SkillHeatmap filters={{ ...filtersNeutros, contrato: "permanent" }} />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("warning-popover")).toBeInTheDocument();
      });
    });

    it("muestra aviso ⚠ cuando jornada está activa", async () => {
      render(
        <SkillHeatmap filters={{ ...filtersNeutros, jornada: "Full time" }} />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("warning-popover")).toBeInTheDocument();
      });
    });

    it("muestra aviso ⚠ cuando remote está activo", async () => {
      render(<SkillHeatmap filters={{ ...filtersNeutros, remote: "Sí" }} />);
      await waitFor(() => {
        expect(screen.getByTestId("warning-popover")).toBeInTheDocument();
      });
    });

    it("no muestra avisos cuando todos los filtros ignorados están en sus valores neutros", async () => {
      render(<SkillHeatmap filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(TEXTO_DESCRIPCION)).toBeInTheDocument();
      });
      expect(screen.queryByTestId("warning-popover")).not.toBeInTheDocument();
    });
  });

  describe("aviso de actualización al cambiar de categoría", () => {
    it("atenúa la tarjeta completa y muestra el badge 'Actualizando...' de ChartCard mientras carga las skills de la nueva categoría (no solo el texto interno)", async () => {
      const { rerender } = render(<SkillHeatmap filters={filtersNeutros} />);

      // Esperamos a que termine la carga inicial (loadingPairs=false) —
      // en este punto solo debería haber, como mucho, el texto interno
      // "Mostrando N skills...", ningún "Actualizando...".
      await waitFor(() => {
        expect(document.querySelector("svg")).toBeInTheDocument();
      });
      expect(screen.queryByText(/actualizando/i)).not.toBeInTheDocument();

      // A partir de aquí, /api/skills/top nunca resuelve — afecta solo a
      // la petición que dispara el cambio de categoría (la carga inicial
      // ya se resolvió con el handler por defecto), dejando loadingSkills
      // en `true` de forma estable para poder inspeccionar ese estado.
      server.use(
        http.get("/api/skills/top", () => new Promise(() => {})),
      );
      rerender(
        <SkillHeatmap
          filters={{ ...filtersNeutros, skillCategoria: "Language" }}
        />,
      );

      // Dos apariciones: el texto interno de SkillHeatmap ("Actualizando...")
      // y el badge flotante de ChartCard (mismo texto) — antes del fix,
      // ChartCard no recibía loadingSkills y este badge no aparecía.
      await waitFor(() => {
        expect(screen.getAllByText(/actualizando/i)).toHaveLength(2);
      });
    });
  });

  describe("manejo de errores", () => {
    it("muestra error cuando el endpoint de co-ocurrencia falla", async () => {
      server.use(
        http.get("/api/skills/cooccurrence", () =>
          HttpResponse.json(
            { detail: "Error en cooccurrence" },
            { status: 500 },
          ),
        ),
      );
      render(<SkillHeatmap filters={filtersNeutros} />);
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
