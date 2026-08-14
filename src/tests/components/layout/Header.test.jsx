import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import Header from "@/components/layout/Header";

function renderHeader({ route = "/", ...props } = {}) {
  const toggleTheme = vi.fn();
  render(
    <MemoryRouter initialEntries={[route]}>
      <Header isDark={false} toggleTheme={toggleTheme} {...props} />
    </MemoryRouter>,
  );
  return { toggleTheme };
}

describe("Header", () => {
  describe("navegación", () => {
    it("enlaza a las 6 rutas del dashboard", () => {
      renderHeader();
      expect(screen.getByText("Inicio").closest("a")).toHaveAttribute(
        "href",
        "/",
      );
      expect(screen.getByText("Tendencias").closest("a")).toHaveAttribute(
        "href",
        "/tendencias",
      );
      expect(screen.getByText("Salarios").closest("a")).toHaveAttribute(
        "href",
        "/salarios",
      );
      expect(screen.getByText("Mapa").closest("a")).toHaveAttribute(
        "href",
        "/mapa",
      );
      expect(screen.getByText("Skills").closest("a")).toHaveAttribute(
        "href",
        "/skills",
      );
      expect(screen.getByText("Top Skills").closest("a")).toHaveAttribute(
        "href",
        "/top-skills",
      );
    });

    it("aplica aurora-text al ítem de la ruta activa", () => {
      renderHeader({ route: "/mapa" });
      expect(screen.getByText("Mapa")).toHaveClass("aurora-text");
      expect(screen.getByText("Tendencias")).not.toHaveClass("aurora-text");
    });

    it('"Inicio" no queda activo en otra ruta (NavLink "end")', () => {
      renderHeader({ route: "/skills" });
      expect(screen.getByText("Inicio")).not.toHaveClass("aurora-text");
    });

    it("no muestra ningún texto de marca (los enlaces flotan solos sobre el fondo)", () => {
      renderHeader();
      expect(screen.queryByText(/tech jobs/i)).not.toBeInTheDocument();
    });
  });

  describe("ThemeToggle", () => {
    it("aloja el ThemeToggle y llama a toggleTheme al pulsarlo", async () => {
      const user = userEvent.setup();
      const { toggleTheme } = renderHeader();
      await user.click(
        screen.getByRole("button", { name: /cambiar a modo/i }),
      );
      expect(toggleTheme).toHaveBeenCalledTimes(1);
    });
  });
});
