import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AuroraText from "@/components/ui/AuroraText";

describe("AuroraText", () => {
  it("renderiza el texto (accesible vía sr-only)", () => {
    render(<AuroraText>Mercado Tech</AuroraText>);
    expect(screen.getAllByText("Mercado Tech").length).toBeGreaterThan(0);
  });

  it("aplica className custom al wrapper", () => {
    const { container } = render(
      <AuroraText className="text-6xl">Mercado Tech</AuroraText>,
    );
    expect(container.querySelector("span")).toHaveClass("text-6xl");
  });

  it("usa los colores por defecto si no se pasan", () => {
    render(<AuroraText>Mercado Tech</AuroraText>);
    const auroraSpan = screen.getByText("Mercado Tech", { selector: "[aria-hidden]" });
    // jsdom normaliza los hex a rgb() en style.backgroundImage.
    expect(auroraSpan.style.backgroundImage).toContain("rgb(255, 0, 128)");
  });

  it("usa los colores custom cuando se pasan", () => {
    render(
      <AuroraText colors={["#111111", "#222222"]}>Mercado Tech</AuroraText>,
    );
    const auroraSpan = screen.getByText("Mercado Tech", { selector: "[aria-hidden]" });
    expect(auroraSpan.style.backgroundImage).toContain("rgb(17, 17, 17)");
    expect(auroraSpan.style.backgroundImage).toContain("rgb(34, 34, 34)");
  });
});
