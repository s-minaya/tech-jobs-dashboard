import { useState, useEffect } from "react";

// useIsDark
// Devuelve true si el documento tiene la clase "dark" en <html>.
// Usa MutationObserver para reaccionar al cambio de tema en tiempo real
// sin necesidad de recargar la página.
// Centralizado aquí para que todas las gráficas usen la misma lógica
// en vez de leer document.documentElement.classList directamente en cada
// render (lectura no reactiva) o duplicar este mismo hook en cada archivo
// (estaba así en TopSkillsChart desde la fase 001 — diferido hasta ahora
// porque tocar las gráficas era trabajo de la fase 007).
export function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
