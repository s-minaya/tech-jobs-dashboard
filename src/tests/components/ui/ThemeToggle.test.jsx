import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "@/components/ui/ThemeToggle";

describe("ThemeToggle", () => {
  it("muestra aria-label 'Cambiar a modo claro' en dark mode", () => {
    render(<ThemeToggle isDark={true} onToggle={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /cambiar a modo claro/i }),
    ).toBeInTheDocument();
  });

  it("muestra aria-label 'Cambiar a modo oscuro' en light mode", () => {
    render(<ThemeToggle isDark={false} onToggle={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /cambiar a modo oscuro/i }),
    ).toBeInTheDocument();
  });

  it("llama a onToggle al pulsarlo", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ThemeToggle isDark={true} onToggle={onToggle} />);
    await user.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
