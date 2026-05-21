import * as d3 from "d3";

// Escala de color para el heatmap.
// El dominio se configura dinámicamente en el componente
// una vez que se conoce el máximo de co-ocurrencias.
export function createHeatmapColorScale(maxCount) {
  return d3
    .scaleSequential()
    .domain([0, maxCount])
    .interpolator(d3.interpolate("#e2e8f0", "#1d4ed8"));
}

// Devuelve un color de texto legible sobre el color de fondo dado.
export function getTextColor(bgColor) {
  const rgb = d3.color(bgColor);
  if (!rgb) return "#0f172a";
  const luminance =
    0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);
  return luminance > 0.4 ? "#0f172a" : "#ffffff";
}
