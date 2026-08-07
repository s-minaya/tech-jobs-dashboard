// ─────────────────────────────────────────────────────────────────────────────
// Leyenda de colores del heatmap.
// Muestra el gradiente RdYlGn (rojo→amarillo→verde), el máximo real del
// dataset, y la celda de "sin datos" (gris).
//
// Lo separamos como componente porque:
//   1. El JSX de la leyenda es un bloque independiente y bien delimitado
//   2. Si quisiéramos cambiar el diseño de la leyenda, no tocamos el resto
//   3. En un futuro podría reutilizarse en otro heatmap
// ─────────────────────────────────────────────────────────────────────────────
import * as d3 from "d3";

/**
 * HeatmapLegend
 * Leyenda visual que explica la escala de color del heatmap.
 * Usa el mismo interpolador d3.interpolateRdYlGn que HeatmapSvg.
 *
 * @param {number} maxPct - El porcentaje más alto del dataset (para el label del extremo)
 */
function HeatmapLegend({ maxPct }) {
  // Mismo interpolador que HeatmapSvg: RdYlGn (rojo → amarillo → verde)
  const steps = [0, 0.2, 0.4, 0.6, 0.8, 1];
  // dark: fondo oscuro azulado / light: gris claro — igual que las celdas vacías del SVG
  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {/* Celda "sin datos" — mismo color que las celdas vacías del SVG */}
      <div className="flex items-center gap-1.5">
        <div
          className="h-3.5 w-3.5 rounded"
          style={{
            backgroundColor: isDark ? "hsl(237, 22%, 22%)" : "#f1f5f9",
            border: isDark
              ? "1px solid hsl(237, 22%, 30%)"
              : "1px solid #e2e8f0",
          }}
        />
        <span>Sin datos</span>
      </div>

      {/* Barra de gradiente rojo→amarillo→verde + etiquetas */}
      <div className="flex items-center gap-2">
        <span>Raramente juntas</span>
        <div className="flex h-3 w-32 overflow-hidden rounded">
          {steps.map((t, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: d3.interpolateRdYlGn(t) }}
            />
          ))}
        </div>
        <span>Muy frecuentes ({maxPct.toFixed(1)}%)</span>
      </div>

      {/* Nota explicativa del máximo */}
      <p className="mt-0.5 w-full text-xs text-muted-foreground/70">
        El verde intenso representa la relación más fuerte del dataset, no el
        100%. Cada celda muestra el % desde la perspectiva de la fila.
      </p>
    </div>
  );
}

export default HeatmapLegend;
