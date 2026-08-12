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
import EuropeMap from "@/components/Charts/EuropeMap";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

// EuropeMap carga el GeoJSON de una CDN externa y la lista de skills.
// El GeoJSON es un archivo estático de topojson que D3 usa para dibujar el mapa.
// Mockeamos ambas peticiones para que los tests no dependan de la red.

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// GeoJSON mínimo con un solo país (Alemania, código 276) para que
// el mapa tenga algo que renderizar sin cargar el archivo real de 100kb.
const geoJsonMock = {
  type: "Topology",
  objects: {
    countries: {
      type: "GeometryCollection",
      geometries: [
        {
          type: "Polygon",
          id: "276",
          arcs: [[0]],
          properties: {},
        },
      ],
    },
  },
  arcs: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
  ],
  transform: { scale: [1, 1], translate: [0, 0] },
};

const filtersNeutros = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

// Antes de cada test, añadimos el handler del GeoJSON externo.
// Los handlers de la API interna (offers-by-country, skills/list)
// ya están en handlers.js y MSW los aplica automáticamente.
function setupGeoHandler() {
  server.use(http.get(GEO_URL, () => HttpResponse.json(geoJsonMock)));
}

describe("EuropeMap", () => {
  describe("estado de carga", () => {
    it("muestra el título siempre", () => {
      setupGeoHandler();
      render(<EuropeMap filters={filtersNeutros} />);
      expect(
        screen.getByText("Ofertas por país en Europa"),
      ).toBeInTheDocument();
    });
  });

  describe("autocomplete de skills", () => {
    it("muestra el input de búsqueda de skills", async () => {
      setupGeoHandler();
      render(<EuropeMap filters={filtersNeutros} />);
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/buscar skill/i),
        ).toBeInTheDocument();
      });
    });

    it("muestra las skills de la API en el dropdown al hacer foco", async () => {
      setupGeoHandler();
      const user = userEvent.setup();
      render(<EuropeMap filters={filtersNeutros} />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/buscar skill/i),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByPlaceholderText(/buscar skill/i));

      // El handler de skills/list devuelve Python, React, PostgreSQL, AWS, Docker
      expect(screen.getByText("Python")).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
    });

    it("filtra las skills mientras el usuario escribe", async () => {
      setupGeoHandler();
      const user = userEvent.setup();
      render(<EuropeMap filters={filtersNeutros} />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/buscar skill/i),
        ).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/buscar skill/i), "react");

      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.queryByText("Python")).not.toBeInTheDocument();
    });
  });

  describe("descripción y filtros", () => {
    it("muestra la descripción sin skill seleccionada", async () => {
      setupGeoHandler();
      render(<EuropeMap filters={filtersNeutros} />);
      await waitFor(() => {
        expect(
          screen.getByText(/distribución geográfica/i),
        ).toBeInTheDocument();
      });
    });

    it("skillCategoria excluida no aparece como filtro activo en EuropeMap", async () => {
      setupGeoHandler();
      render(
        <EuropeMap
          filters={{ ...filtersNeutros, skillCategoria: "Database" }}
        />,
      );
      await waitFor(() => {
        // skillCategoria está en excludeFilters — no debe aparecer como pill activo
        expect(screen.queryByText(/database/i)).not.toBeInTheDocument();
        // La descripción sí aparece
        expect(
          screen.getByText(/distribución geográfica/i),
        ).toBeInTheDocument();
      });
    });

    it("muestra el aviso ⓘ cuando skillCategoria está activa (fase 012 — antes solo avisaba de país)", async () => {
      setupGeoHandler();
      render(
        <EuropeMap
          filters={{ ...filtersNeutros, skillCategoria: "Database" }}
        />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("warning-popover")).toBeInTheDocument();
      });
    });
  });

  describe("total de ofertas", () => {
    it("muestra el total de ofertas del handler", async () => {
      setupGeoHandler();
      render(<EuropeMap filters={filtersNeutros} />);
      // El handler devuelve total_matching_jobs: 16005
      await waitFor(() => {
        expect(screen.getByText(/16\.005/)).toBeInTheDocument();
      });
    });
  });
});
