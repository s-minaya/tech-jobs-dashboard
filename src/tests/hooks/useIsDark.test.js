import { describe, it, expect, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useIsDark } from "@/hooks/useIsDark";

// useIsDark
// Testamos la inicialización a partir de la clase "dark" en <html> y la
// reactividad vía MutationObserver al añadir/quitar esa clase después de
// montar. Patrón similar a useTheme.test.js.

describe("useIsDark", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  describe("inicialización", () => {
    it("arranca en false si <html> no tiene la clase 'dark'", () => {
      const { result } = renderHook(() => useIsDark());
      expect(result.current).toBe(false);
    });

    it("arranca en true si <html> ya tiene la clase 'dark'", () => {
      document.documentElement.classList.add("dark");
      const { result } = renderHook(() => useIsDark());
      expect(result.current).toBe(true);
    });
  });

  describe("reactividad (MutationObserver)", () => {
    it("pasa a true cuando se añade la clase 'dark' después de montar", async () => {
      const { result } = renderHook(() => useIsDark());
      expect(result.current).toBe(false);

      document.documentElement.classList.add("dark");

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it("pasa a false cuando se quita la clase 'dark' después de montar", async () => {
      document.documentElement.classList.add("dark");
      const { result } = renderHook(() => useIsDark());
      expect(result.current).toBe(true);

      document.documentElement.classList.remove("dark");

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });
});
