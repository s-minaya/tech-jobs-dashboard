import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ChartCard from "@/components/ui/ChartCard";

describe("ChartCard", () => {
  describe("título", () => {
    it("muestra el título cuando se proporciona", () => {
      render(<ChartCard title="Top Skills" loading={false} />);
      expect(screen.getByText("Top Skills")).toBeInTheDocument();
    });

    it("no renderiza el h2 cuando no se proporciona título", () => {
      render(<ChartCard loading={false} />);
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });
  });

  describe("carga inicial (isInitialLoad=true)", () => {
    it("muestra 'Cargando...' cuando loading=true e isInitialLoad=true", () => {
      render(
        <ChartCard loading={true} isInitialLoad={true}>
          <p>Contenido</p>
        </ChartCard>,
      );
      expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });

    it("no muestra el contenido durante la carga inicial", () => {
      render(
        <ChartCard loading={true} isInitialLoad={true}>
          <p>Contenido</p>
        </ChartCard>,
      );
      expect(screen.queryByText("Contenido")).not.toBeInTheDocument();
    });

    it("no muestra el badge 'Actualizando...' durante la carga inicial", () => {
      render(
        <ChartCard loading={true} isInitialLoad={true}>
          <p>Contenido</p>
        </ChartCard>,
      );
      expect(screen.queryByText("Actualizando...")).not.toBeInTheDocument();
    });
  });

  describe("recarga por filtro (loading=true, isInitialLoad=false)", () => {
    it("muestra el badge 'Actualizando...'", () => {
      render(
        <ChartCard loading={true} isInitialLoad={false}>
          <p>Contenido previo</p>
        </ChartCard>,
      );
      expect(screen.getByText("Actualizando...")).toBeInTheDocument();
    });

    it("mantiene el contenido visible durante la recarga", () => {
      render(
        <ChartCard loading={true} isInitialLoad={false}>
          <p>Contenido previo</p>
        </ChartCard>,
      );
      // El contenido sigue en el DOM para evitar saltos de scroll
      expect(screen.getByText("Contenido previo")).toBeInTheDocument();
    });

    it("no muestra 'Cargando...' durante una recarga", () => {
      render(
        <ChartCard loading={true} isInitialLoad={false}>
          <p>Contenido previo</p>
        </ChartCard>,
      );
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
    });

    it("el contenido tiene opacidad reducida durante la recarga", () => {
      render(
        <ChartCard loading={true} isInitialLoad={false}>
          <p>Contenido previo</p>
        </ChartCard>,
      );
      // El div wrapper del contenido tiene opacity: 0.4 cuando showStale=true
      const wrapper = screen.getByText("Contenido previo").parentElement;
      expect(wrapper).toHaveStyle({ opacity: "0.4" });
    });
  });

  describe("estado sin carga (loading=false)", () => {
    it("muestra el contenido con opacidad normal", () => {
      render(
        <ChartCard loading={false} isInitialLoad={false}>
          <p>Contenido</p>
        </ChartCard>,
      );
      const wrapper = screen.getByText("Contenido").parentElement;
      expect(wrapper).toHaveStyle({ opacity: "1" });
    });

    it("no muestra ni 'Cargando...' ni 'Actualizando...'", () => {
      render(
        <ChartCard loading={false} isInitialLoad={false}>
          <p>Contenido</p>
        </ChartCard>,
      );
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
      expect(screen.queryByText("Actualizando...")).not.toBeInTheDocument();
    });
  });

  describe("estado de error", () => {
    it("muestra el mensaje de error cuando loading=false y hay error", () => {
      render(
        <ChartCard loading={false} error="Error 500 en /api/skills/top">
          <p>Contenido</p>
        </ChartCard>,
      );
      expect(screen.getByText(/Error: Error 500/)).toBeInTheDocument();
    });

    it("no muestra el contenido cuando hay error", () => {
      render(
        <ChartCard loading={false} error="fallo">
          <p>Contenido</p>
        </ChartCard>,
      );
      expect(screen.queryByText("Contenido")).not.toBeInTheDocument();
    });

    it("no muestra el error mientras está cargando (espera a que termine)", () => {
      // Durante la carga no mostramos el error aunque exista —
      // puede ser un error residual del intento anterior que se está resolviendo
      render(
        <ChartCard loading={true} isInitialLoad={true} error="fallo">
          <p>Contenido</p>
        </ChartCard>,
      );
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });
  });
});
