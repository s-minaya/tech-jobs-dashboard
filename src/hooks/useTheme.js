import { useState, useEffect } from "react";

// useTheme
// Gestiona el tema claro/oscuro del dashboard.
// Persiste la preferencia en localStorage para que se recuerde entre sesiones.
// Si no hay preferencia guardada, usa la preferencia del sistema operativo.
//
// El tema se aplica añadiendo/quitando la clase "dark" en el <html>.
// Tailwind y shadcn usan esa clase para activar las variables CSS del modo oscuro.
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    // Prioridad: 1) preferencia guardada, 2) preferencia del sistema
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  function toggleTheme() {
    setIsDark((prev) => !prev);
  }

  return { isDark, toggleTheme };
}
