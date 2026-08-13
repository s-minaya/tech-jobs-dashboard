import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCountUp } from "@/hooks/useCountUp";

// Tests de useCountUp (fase 014) — anima un número de 0 a `target` con
// requestAnimationFrame. Se usan duraciones cortas (reales, no
// temporizadores simulados — jsdom implementa un requestAnimationFrame
// real) y waitFor para no depender de la precisión frame a frame.

describe("useCountUp", () => {
  it("empieza en 0", () => {
    const { result } = renderHook(() => useCountUp(1000, 50));
    expect(result.current).toBe(0);
  });

  it("target=null no anima — se queda en 0", async () => {
    const { result } = renderHook(() => useCountUp(null, 50));
    await new Promise((r) => setTimeout(r, 80));
    expect(result.current).toBe(0);
  });

  it("converge al valor final una vez pasa la duración", async () => {
    const { result } = renderHook(() => useCountUp(200, 30));
    await waitFor(() => expect(result.current).toBe(200), { timeout: 1000 });
  });

  it("nunca supera el valor final durante la animación", async () => {
    const { result } = renderHook(() => useCountUp(500, 100));
    // Muestreamos varias veces mientras anima — ninguna lectura intermedia
    // debe superar el target (la easing es monótona creciente).
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 20));
      expect(result.current).toBeLessThanOrEqual(500);
    }
    await waitFor(() => expect(result.current).toBe(500));
  });

  // pct_with_salary (35.7) necesita terminar en su valor decimal exacto,
  // no en un entero redondeado — si no, la KPI card mostraría "36%" en
  // vez de "35.7%" justo al terminar de animar.
  it("con un target decimal, termina en el valor exacto (sin redondear)", async () => {
    const { result } = renderHook(() => useCountUp(35.7, 30));
    await waitFor(() => expect(result.current).toBe(35.7), { timeout: 1000 });
  });
});
