import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "@/hooks/useTheme";

// useTheme
// Testamos la inicialización desde localStorage, la aplicación de la clase
// "dark" en el <html>, la persistencia al cambiar y el toggle.
// matchMedia ya está mockeado en setup.js (devuelve matches: false).

describe("useTheme", () => {
  describe("inicialización", () => {
    it("arranca en dark mode si localStorage tiene 'dark'", () => {
      localStorage.setItem("theme", "dark");
      const { result } = renderHook(() => useTheme());
      expect(result.current.isDark).toBe(true);
    });

    it("arranca en light mode si localStorage tiene 'light'", () => {
      localStorage.setItem("theme", "light");
      const { result } = renderHook(() => useTheme());
      expect(result.current.isDark).toBe(false);
    });

    it("usa la preferencia del sistema si no hay nada en localStorage", () => {
      // El mock de matchMedia en setup.js devuelve matches: false (light)
      const { result } = renderHook(() => useTheme());
      expect(result.current.isDark).toBe(false);
    });
  });

  describe("aplicación de clase CSS", () => {
    it("añade la clase 'dark' al <html> cuando isDark es true", () => {
      localStorage.setItem("theme", "dark");
      renderHook(() => useTheme());
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("quita la clase 'dark' del <html> cuando isDark es false", () => {
      localStorage.setItem("theme", "light");
      // Nos aseguramos de que empieza con dark para ver el cambio
      document.documentElement.classList.add("dark");
      renderHook(() => useTheme());
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("toggleTheme", () => {
    it("cambia de light a dark al hacer toggle", () => {
      localStorage.setItem("theme", "light");
      const { result } = renderHook(() => useTheme());
      expect(result.current.isDark).toBe(false);

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.isDark).toBe(true);
    });

    it("cambia de dark a light al hacer toggle", () => {
      localStorage.setItem("theme", "dark");
      const { result } = renderHook(() => useTheme());
      expect(result.current.isDark).toBe(true);

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.isDark).toBe(false);
    });

    it("persiste el nuevo tema en localStorage al hacer toggle", () => {
      localStorage.setItem("theme", "light");
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("actualiza la clase del <html> al hacer toggle", () => {
      localStorage.setItem("theme", "light");
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("persistencia", () => {
    it("guarda 'dark' en localStorage cuando isDark es true", () => {
      localStorage.setItem("theme", "light");
      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.toggleTheme();
      });
      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("guarda 'light' en localStorage cuando isDark es false", () => {
      localStorage.setItem("theme", "dark");
      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.toggleTheme();
      });
      expect(localStorage.getItem("theme")).toBe("light");
    });
  });
});
