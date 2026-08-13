// formatRelativeTime.js
// Fecha ISO → texto relativo en español ("hace 2 h", "hace 3 d").
// Fase 014: usado por la card "Explora el mercado por país" de la
// landing para mostrar last_updated (última vez que el pipeline vio una
// oferta activa) de forma legible, sin fecha absoluta.

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelativeTime(iso) {
  if (!iso) return "—";

  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return "hace un momento"; // reloj del cliente desincronizado — mejor no mostrar un negativo

  if (diffMs < MINUTE_MS) return "hace un momento";
  if (diffMs < HOUR_MS) return `hace ${Math.round(diffMs / MINUTE_MS)} min`;
  if (diffMs < DAY_MS) return `hace ${Math.round(diffMs / HOUR_MS)} h`;
  return `hace ${Math.round(diffMs / DAY_MS)} d`;
}
