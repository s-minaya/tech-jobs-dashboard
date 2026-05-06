import { useState } from "react";
import * as d3 from "d3";
import {
  coOccurrenceSkills,
  coOccurrenceLookup,
  heatmapColorScale,
  maxCount,
} from "@/lib/heatmapConfig";

const MARGIN = { top: 48, right: 16, bottom: 16, left: 80 };
const CELL_SIZE = 48;

// Calcula las dimensiones del SVG en función del número de skills
const width =
  CELL_SIZE * coOccurrenceSkills.length + MARGIN.left + MARGIN.right;
const height =
  CELL_SIZE * coOccurrenceSkills.length + MARGIN.top + MARGIN.bottom;

// Devuelve un color de texto legible (blanco u oscuro) sobre el color de fondo dado.
// Usa la luminancia relativa del color para decidir cuál contrasta mejor.
function getTextColor(bgColor) {
  const rgb = d3.color(bgColor);
  if (!rgb) return "#0f172a";
  const luminance =
    0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);
  return luminance > 0.4 ? "#0f172a" : "#ffffff";
}

// Heatmap de co-ocurrencia de skills renderizado con D3 + SVG.
// Cada celda [i, j] muestra cuántas veces skill[i] y skill[j]
// aparecen juntas en una oferta. La diagonal queda vacía (una skill consigo misma).
function SkillHeatmap() {
  // Celda actualmente bajo el cursor — { skill, coSkill, count } o null
  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 text-sm font-semibold">
        Skills que suelen aparecer juntas
      </h2>

      <div className="overflow-x-auto">
        <svg width={width} height={height}>
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {/* Etiquetas del eje X (skills en horizontal, rotadas 45°) */}
            {coOccurrenceSkills.map((skill, i) => (
              <text
                key={`x-${skill}`}
                x={i * CELL_SIZE + CELL_SIZE / 2}
                y={-8}
                textAnchor="start"
                fontSize={11}
                fill="currentColor"
                className="text-muted-foreground"
                transform={`rotate(-45, ${i * CELL_SIZE + CELL_SIZE / 2}, -8)`}
              >
                {skill}
              </text>
            ))}

            {/* Etiquetas del eje Y (skills en vertical) */}
            {coOccurrenceSkills.map((skill, i) => (
              <text
                key={`y-${skill}`}
                x={-8}
                y={i * CELL_SIZE + CELL_SIZE / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="currentColor"
                className="text-muted-foreground"
              >
                {skill}
              </text>
            ))}

            {/* Celdas del heatmap */}
            {coOccurrenceSkills.map((skill, i) =>
              coOccurrenceSkills.map((coSkill, j) => {
                // La diagonal (skill consigo misma) se deja vacía
                if (skill === coSkill) return null;

                const count = coOccurrenceLookup[`${skill}|${coSkill}`] ?? 0;
                const bgColor = heatmapColorScale(count);
                const textColor = getTextColor(bgColor);

                return (
                  <g key={`${skill}|${coSkill}`}>
                    <rect
                      x={j * CELL_SIZE}
                      y={i * CELL_SIZE}
                      width={CELL_SIZE - 2}
                      height={CELL_SIZE - 2}
                      rx={4}
                      fill={bgColor}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onMouseEnter={(e) =>
                        setTooltip({
                          x: e.clientX,
                          y: e.clientY,
                          skill,
                          coSkill,
                          count,
                        })
                      }
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {/* Solo mostramos el número si la celda es grande enough para leerlo */}
                    {count > 0 && (
                      <text
                        x={j * CELL_SIZE + CELL_SIZE / 2 - 1}
                        y={i * CELL_SIZE + CELL_SIZE / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={10}
                        fill={textColor}
                        className="pointer-events-none select-none"
                      >
                        {count >= 1000
                          ? `${(count / 1000).toFixed(1)}k`
                          : count}
                      </text>
                    )}
                  </g>
                );
              }),
            )}
          </g>
        </svg>
      </div>

      {/* Tooltip flotante */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded border border-border bg-background px-2 py-1 text-xs shadow"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          <span className="font-medium">{tooltip.skill}</span>
          {" + "}
          <span className="font-medium">{tooltip.coSkill}</span>
          {": "}
          {tooltip.count.toLocaleString()} co-ocurrencias
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Menos frecuente</span>
        <div className="flex h-3 w-24 overflow-hidden rounded">
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: heatmapColorScale(t * maxCount) }}
            />
          ))}
        </div>
        <span>Más frecuente</span>
      </div>
    </div>
  );
}

export default SkillHeatmap;
