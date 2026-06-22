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

    it("renderiza un chip por cada opción", () => {
      render(
        <FilterSection
          title="País"
          options={["Todos", "DE", "ES"]}
          selected="Todos"
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText("Todos")).toBeInTheDocument();
      expect(screen.getByText("DE")).toBeInTheDocument();
      expect(screen.getByText("ES")).toBeInTheDocument();
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
      expect(screen.getByText("DE").closest("button")).toHaveClass(
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

    it("llama a onSelect al pulsar un chip", async () => {
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
      await user.click(screen.getByText("FR"));
      expect(onSelect).toHaveBeenCalledWith("FR");
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
