import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterSection from "@/components/Filters/FilterSection";

describe("FilterSection", () => {
  describe("chips (fullWidth=false)", () => {
    it("muestra el título de la sección", () => {
      render(
        <FilterSection
          title="País"
          options={["Todos", "DE", "ES"]}
          selected="Todos"
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText("País")).toBeInTheDocument();
    });

    it("renderiza un chip por cada opción, con el texto traducido (fase 013 — OPTION_LABELS)", () => {
      render(
        <FilterSection
          title="País"
          options={["Todos", "DE", "ES"]}
          selected="Todos"
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText("Todos")).toBeInTheDocument();
      // El texto mostrado es el traducido (OPTION_LABELS); el valor crudo
      // "DE"/"ES" sigue siendo lo que viaja por selected/onSelect (ver test
      // de abajo) — solo cambia lo que se pinta en pantalla.
      expect(screen.getByText("Alemania")).toBeInTheDocument();
      expect(screen.getByText("España")).toBeInTheDocument();
      expect(screen.queryByText("DE")).not.toBeInTheDocument();
      expect(screen.queryByText("ES")).not.toBeInTheDocument();
    });

    it("el chip activo tiene clase de color primary", () => {
      render(
        <FilterSection
          title="País"
          options={["Todos", "DE"]}
          selected="DE"
          onSelect={vi.fn()}
        />,
      );
      // El chip activo tiene bg-primary en su className
      expect(screen.getByText("Alemania").closest("button")).toHaveClass(
        "bg-primary",
      );
    });

    it("el chip inactivo no tiene clase primary", () => {
      render(
        <FilterSection
          title="País"
          options={["Todos", "DE"]}
          selected="DE"
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText("Todos").closest("button")).not.toHaveClass(
        "bg-primary",
      );
    });

    it("llama a onSelect con el valor crudo (no el traducido) al pulsar un chip", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <FilterSection
          title="País"
          options={["Todos", "DE", "FR"]}
          selected="Todos"
          onSelect={onSelect}
        />,
      );
      await user.click(screen.getByText("Francia"));
      expect(onSelect).toHaveBeenCalledWith("FR");
    });

    it("una opción sin traducción conocida se muestra tal cual (fallback ?? option)", () => {
      render(
        <FilterSection
          title="Categoría"
          options={["Todos", "Framework"]}
          selected="Todos"
          onSelect={vi.fn()}
        />,
      );
      // Framework no está en OPTION_LABELS a propósito (préstamo ya
      // asentado en español técnico) — debe pintarse sin traducir.
      expect(screen.getByText("Framework")).toBeInTheDocument();
    });
  });

  describe("toggle rows (fullWidth=true)", () => {
    it("renderiza los options como filas en lugar de chips", () => {
      render(
        <FilterSection
          title="Periodo"
          options={["Últimos 30 días", "Últimos 90 días"]}
          selected="Últimos 90 días"
          onSelect={vi.fn()}
          fullWidth
        />,
      );
      expect(screen.getByText("Últimos 30 días")).toBeInTheDocument();
      expect(screen.getByText("Últimos 90 días")).toBeInTheDocument();
    });

    it("la fila activa tiene clase bg-primary/10", () => {
      render(
        <FilterSection
          title="Periodo"
          options={["Últimos 30 días", "Últimos 90 días"]}
          selected="Últimos 90 días"
          onSelect={vi.fn()}
          fullWidth
        />,
      );
      expect(screen.getByText("Últimos 90 días").closest("button")).toHaveClass(
        "bg-primary/10",
      );
    });

    it("llama a onSelect al pulsar una fila", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <FilterSection
          title="Periodo"
          options={["Últimos 30 días", "Últimos 90 días"]}
          selected="Últimos 90 días"
          onSelect={onSelect}
          fullWidth
        />,
      );
      await user.click(screen.getByText("Últimos 30 días"));
      expect(onSelect).toHaveBeenCalledWith("Últimos 30 días");
    });
  });
});
