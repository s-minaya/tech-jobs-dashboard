import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleSelector from "@/components/ui/RoleSelector";

function getRoleLabel(role) {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const ROLES = ["backend", "frontend", "devops"];
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

function renderSelector(props = {}) {
  const onSelect = vi.fn();
  render(
    <RoleSelector
      allRoles={ROLES}
      selected={ROLES}
      onSelect={onSelect}
      chartColors={COLORS}
      getRoleLabel={getRoleLabel}
      {...props}
    />,
  );
  return { onSelect };
}

describe("RoleSelector", () => {
  describe("renderizado inicial", () => {
    it("muestra los botones Todos y Ninguno", () => {
      renderSelector();
      expect(screen.getByText("Todos")).toBeInTheDocument();
      expect(screen.getByText("Ninguno")).toBeInTheDocument();
    });

    it("muestra un botón por cada rol con su etiqueta formateada", () => {
      renderSelector();
      expect(
        screen.getByRole("button", { name: "Backend" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Frontend" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Devops" }),
      ).toBeInTheDocument();
    });

    it("no renderiza botones de rol cuando allRoles está vacío", () => {
      renderSelector({ allRoles: [], selected: [] });
      expect(
        screen.queryByRole("button", { name: "Backend" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("botón Todos", () => {
    it("llama a onSelect con todos los roles", async () => {
      const user = userEvent.setup();
      const { onSelect } = renderSelector({ selected: ["backend"] });
      await user.click(screen.getByText("Todos"));
      expect(onSelect).toHaveBeenCalledWith(["backend", "frontend", "devops"]);
    });

    it("funciona también desde estado vacío", async () => {
      const user = userEvent.setup();
      const { onSelect } = renderSelector({ selected: [] });
      await user.click(screen.getByText("Todos"));
      expect(onSelect).toHaveBeenCalledWith(["backend", "frontend", "devops"]);
    });
  });

  describe("botón Ninguno", () => {
    it("llama a onSelect con array vacío", async () => {
      const user = userEvent.setup();
      const { onSelect } = renderSelector();
      await user.click(screen.getByText("Ninguno"));
      expect(onSelect).toHaveBeenCalledWith([]);
    });
  });

  describe("toggle de roles individuales", () => {
    it("deseleccionar un rol activo lo elimina del array", async () => {
      const user = userEvent.setup();
      const { onSelect } = renderSelector({
        selected: ["backend", "frontend", "devops"],
      });
      await user.click(screen.getByRole("button", { name: "Frontend" }));
      expect(onSelect).toHaveBeenCalledWith(["backend", "devops"]);
    });

    it("seleccionar un rol inactivo lo añade al array", async () => {
      const user = userEvent.setup();
      const { onSelect } = renderSelector({ selected: ["backend"] });
      await user.click(screen.getByRole("button", { name: "Devops" }));
      expect(onSelect).toHaveBeenCalledWith(["backend", "devops"]);
    });

    it("deseleccionar el único rol activo devuelve array vacío", async () => {
      const user = userEvent.setup();
      const { onSelect } = renderSelector({ selected: ["backend"] });
      await user.click(screen.getByRole("button", { name: "Backend" }));
      expect(onSelect).toHaveBeenCalledWith([]);
    });
  });

  describe("estado visual de los roles", () => {
    it("los roles seleccionados tienen el color del chart en el style", () => {
      renderSelector({ selected: ["backend"] });
      // CSS variables como "var(--chart-1)" se pasan tal cual al style prop
      // y se pueden leer en element.style.backgroundColor sin transformación
      const boton = screen.getByRole("button", { name: "Backend" });
      expect(boton.style.backgroundColor).toBe("var(--chart-1)");
    });

    it("los roles no seleccionados no tienen backgroundColor en el style", () => {
      renderSelector({ selected: ["backend"] });
      const boton = screen.getByRole("button", { name: "Frontend" });
      expect(boton.style.backgroundColor).toBe("");
    });

    it("los colores rotan por posición cuando hay más roles que colores", () => {
      // El componente usa chartColors[i % chartColors.length].
      // Con 4 roles y 2 colores CSS válidos:
      //   r1 (i=0) → 0 % 2 = 0 → primer color
      //   r2 (i=1) → 1 % 2 = 1 → segundo color
      //   r3 (i=2) → 2 % 2 = 0 → primer color (rotación)
      //   r4 (i=3) → 3 % 2 = 1 → segundo color
      //
      // Usamos CSS variables válidas porque jsdom descarta valores
      // que no reconoce como colores CSS (ej: "color-a" queda vacío).
      const dosColores = ["var(--color-a)", "var(--color-b)"];
      render(
        <RoleSelector
          allRoles={["r1", "r2", "r3", "r4"]}
          selected={["r1", "r2", "r3", "r4"]}
          onSelect={vi.fn()}
          chartColors={dosColores}
          getRoleLabel={(r) => r}
        />,
      );
      expect(
        screen.getByRole("button", { name: "r1" }).style.backgroundColor,
      ).toBe("var(--color-a)");
      expect(
        screen.getByRole("button", { name: "r2" }).style.backgroundColor,
      ).toBe("var(--color-b)");
      expect(
        screen.getByRole("button", { name: "r3" }).style.backgroundColor,
      ).toBe("var(--color-a)");
      expect(
        screen.getByRole("button", { name: "r4" }).style.backgroundColor,
      ).toBe("var(--color-b)");
    });
  });
});
