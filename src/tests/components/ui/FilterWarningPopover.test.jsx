import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterWarningPopover from "@/components/ui/FilterWarningPopover";

// FilterWarningPopover
// Testamos: renderizado del botón ⓘ, apertura del popover,
// contenido del aviso, cierre con X, y descarte con localStorage.

describe("FilterWarningPopover", () => {
  describe("renderizado inicial", () => {
    it("muestra el botón 'Filtro ignorado'", () => {
      render(
        <FilterWarningPopover
          filterKey="pais"
          contexto="mapa"
          texto="El mapa ignora el filtro de país."
        />,
      );
      expect(
        screen.getByRole("button", { name: /ver aviso/i }),
      ).toBeInTheDocument();
    });

    it("no muestra el popover hasta que se pulsa el botón", () => {
      render(
        <FilterWarningPopover
          filterKey="pais"
          contexto="mapa"
          texto="El mapa ignora el filtro de país."
        />,
      );
      expect(screen.queryByText(/filtro no aplicado/i)).not.toBeInTheDocument();
    });
  });

  describe("apertura del popover", () => {
    it("abre el popover al pulsar el botón", async () => {
      const user = userEvent.setup();
      render(
        <FilterWarningPopover
          filterKey="pais"
          contexto="mapa"
          texto="El mapa ignora el filtro de país."
        />,
      );
      await user.click(screen.getByRole("button", { name: /ver aviso/i }));
      expect(screen.getByText(/filtro no aplicado/i)).toBeInTheDocument();
    });

    it("muestra el texto del aviso en el popover", async () => {
      const user = userEvent.setup();
      render(
        <FilterWarningPopover
          filterKey="jornada"
          contexto="heatmap"
          texto="El heatmap no tiene en cuenta la jornada."
        />,
      );
      await user.click(screen.getByRole("button", { name: /ver aviso/i }));
      expect(
        screen.getByText("El heatmap no tiene en cuenta la jornada."),
      ).toBeInTheDocument();
    });
  });

  describe("cierre del popover", () => {
    it("cierra el popover al pulsar el botón X", async () => {
      const user = userEvent.setup();
      render(
        <FilterWarningPopover
          filterKey="pais"
          contexto="mapa"
          texto="Aviso de prueba."
        />,
      );
      await user.click(screen.getByRole("button", { name: /ver aviso/i }));
      expect(screen.getByText(/filtro no aplicado/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "" }));
      expect(screen.queryByText(/filtro no aplicado/i)).not.toBeInTheDocument();
    });

    it("cierra el popover al hacer click fuera", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <FilterWarningPopover
            filterKey="pais"
            contexto="mapa"
            texto="Aviso."
          />
          <button>Fuera</button>
        </div>,
      );
      await user.click(screen.getByRole("button", { name: /ver aviso/i }));
      expect(screen.getByText(/filtro no aplicado/i)).toBeInTheDocument();

      await user.click(screen.getByText("Fuera"));
      expect(screen.queryByText(/filtro no aplicado/i)).not.toBeInTheDocument();
    });
  });

  describe("descarte con localStorage", () => {
    it("desaparece al pulsar 'Entendido, no mostrar de nuevo'", async () => {
      const user = userEvent.setup();
      render(
        <FilterWarningPopover
          filterKey="pais"
          contexto="mapa"
          texto="Aviso."
        />,
      );
      await user.click(screen.getByRole("button", { name: /ver aviso/i }));
      await user.click(screen.getByText(/entendido/i));

      // El componente entero desaparece
      expect(
        screen.queryByRole("button", { name: /ver aviso/i }),
      ).not.toBeInTheDocument();
    });

    it("guarda el descarte en localStorage", async () => {
      const user = userEvent.setup();
      render(
        <FilterWarningPopover
          filterKey="contrato"
          contexto="salario"
          texto="Aviso."
        />,
      );
      await user.click(screen.getByRole("button", { name: /ver aviso/i }));
      await user.click(screen.getByText(/entendido/i));

      const dismissed = JSON.parse(
        localStorage.getItem("chart_filter_warnings_dismissed") ?? "[]",
      );
      expect(dismissed).toContain("contrato:salario");
    });

    it("no se renderiza si el aviso ya fue descartado en localStorage", () => {
      localStorage.setItem(
        "chart_filter_warnings_dismissed",
        JSON.stringify(["pais:mapa"]),
      );
      render(
        <FilterWarningPopover
          filterKey="pais"
          contexto="mapa"
          texto="Aviso."
        />,
      );
      expect(
        screen.queryByRole("button", { name: /ver aviso/i }),
      ).not.toBeInTheDocument();
    });
  });
});
