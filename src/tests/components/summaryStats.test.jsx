import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import SummaryStats from "@/components/SummaryStats";

describe("SummaryStats", () => {
  describe("estado de carga", () => {
    it("muestra 5 skeletons mientras carga", () => {
      render(<SummaryStats />);
      // Los skeletons tienen animate-pulse, es la única forma de identificarlos
      // ya que no tienen texto ni rol semántico propio
      expect(document.querySelectorAll(".animate-pulse")).toHaveLength(5);
    });

    it("los skeletons desaparecen cuando los datos llegan", async () => {
      render(<SummaryStats />);
      // Primero verificamos que los skeletons SÍ están (para evitar falso positivo)
      expect(document.querySelectorAll(".animate-pulse")).toHaveLength(5);
      // Luego esperamos a que desaparezcan
      await waitFor(() => {
        expect(document.querySelectorAll(".animate-pulse")).toHaveLength(0);
      });
    });
  });

  describe("datos cargados correctamente", () => {
    it("muestra el total de ofertas activas formateado con separador de miles", async () => {
      render(<SummaryStats />);
      await waitFor(() => {
        expect(screen.getByText("26.023")).toBeInTheDocument();
      });
    });

    it("muestra el número de países cubiertos", async () => {
      render(<SummaryStats />);
      await waitFor(() => {
        expect(screen.getByText("8")).toBeInTheDocument();
      });
    });

    it("muestra el número de skills rastreadas", async () => {
      render(<SummaryStats />);
      await waitFor(() => {
        expect(screen.getByText("312")).toBeInTheDocument();
      });
    });

    it("muestra el porcentaje de ofertas con salario", async () => {
      render(<SummaryStats />);
      await waitFor(() => {
        expect(screen.getByText("34.5%")).toBeInTheDocument();
      });
    });

    it("muestra la fecha de última actualización formateada", async () => {
      render(<SummaryStats />);
      // El handler devuelve "2025-05-15T10:30:00.000Z"
      // /may/i cubre "may", "May", "mayo" según el locale del sistema
      await waitFor(() => {
        expect(screen.getByText(/may/i)).toBeInTheDocument();
      });
    });

    it("muestra las 5 etiquetas de los KPI cards", async () => {
      render(<SummaryStats />);
      await waitFor(() => {
        expect(screen.getByText("Ofertas activas")).toBeInTheDocument();
        expect(screen.getByText("Países cubiertos")).toBeInTheDocument();
        expect(screen.getByText("Skills rastreadas")).toBeInTheDocument();
        expect(screen.getByText("Con salario declarado")).toBeInTheDocument();
        expect(screen.getByText("Última actualización")).toBeInTheDocument();
      });
    });
  });

  describe("manejo de errores", () => {
    it("no rompe la UI si el endpoint falla y no muestra KPI cards", async () => {
      server.use(http.get("/api/stats/summary", () => HttpResponse.error()));

      render(<SummaryStats />);

      // Primero verificamos que los skeletons SÍ aparecen al montar.
      // Sin esta comprobación el test podría pasar trivialmente si el
      // componente devuelve null desde el principio por algún otro motivo.
      expect(document.querySelectorAll(".animate-pulse")).toHaveLength(5);

      // Esperamos a que el estado de carga termine (los skeletons desaparecen)
      await waitFor(() => {
        expect(document.querySelectorAll(".animate-pulse")).toHaveLength(0);
      });

      // Después del error el componente devuelve null: no hay KPI cards
      expect(screen.queryByText("Ofertas activas")).not.toBeInTheDocument();
      expect(screen.queryByText("26.023")).not.toBeInTheDocument();
    });
  });
});
