import { useState, useEffect } from "react";
import { getSkillCoOccurrence } from "@/services/jobServices";
import { createHeatmapColorScale, getTextColor } from "@/lib/heatmapConfig";

const MARGIN = { top: 48, right: 16, bottom: 16, left: 80 };
const CELL_SIZE = 48;

// Selecciona las N skills más conectadas del dataset.
// "Más conectada" = la que aparece más veces como skill o co_skill en los pares.
// Esto garantiza que el heatmap muestre las skills con más relaciones entre sí,
// maximizando el número de celdas con datos y minimizando los ceros.
function selectTopSkills(data, n = 12) {
  const frequency = {};
  for (const { skill, co_skill } of data) {
    frequency[skill] = (frequency[skill] ?? 0) + 1;
    frequency[co_skill] = (frequency[co_skill] ?? 0) + 1;
  }
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([skill]) => skill);
}

// Heatmap de co-ocurrencia de skills renderizado con D3 + SVG.
// Hace fetch a la API, selecciona las skills más conectadas y
// construye el lookup y la escala de color dinámicamente.
function SkillHeatmap() {
  const [coOccurrenceData, setCoOccurrenceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    getSkillCoOccurrence()
      .then(setCoOccurrenceData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );

  if (error)
    return (
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );

  // Seleccionamos las 12 skills más conectadas del dataset completo
  const skills = selectTopSkills(coOccurrenceData, 12);

  // Simetrizamos el lookup: si existe A|B, creamos también B|A con el mismo valor.
  // La vista de la BD evita duplicados con js1.skill_id < js2.skill_id,
  // así que solo tenemos la mitad de los pares — los completamos aquí.
  const lookup = {};
  for (const { skill, co_skill, co_count } of coOccurrenceData) {
    if (!skills.includes(skill) || !skills.includes(co_skill)) continue;
    const count = Number(co_count);
    lookup[`${skill}|${co_skill}`] = count;
    lookup[`${co_skill}|${skill}`] = count; // par simétrico
  }

  const maxCount = Math.max(...Object.values(lookup), 1);
  const colorScale = createHeatmapColorScale(maxCount);

  const width = CELL_SIZE * skills.length + MARGIN.left + MARGIN.right;
  const height = CELL_SIZE * skills.length + MARGIN.top + MARGIN.bottom;

  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 text-sm font-semibold">
        Skills que suelen aparecer juntas
      </h2>

      <div className="overflow-x-auto">
        <svg width={width} height={height}>
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {/* Etiquetas eje X — rotadas 45° para que no se solapen */}
            {skills.map((skill, i) => (
              <text
                key={`x-${skill}`}
                x={i * CELL_SIZE + CELL_SIZE / 2}
                y={-8}
                textAnchor="start"
                fontSize={11}
                fill="currentColor"
                transform={`rotate(-45, ${i * CELL_SIZE + CELL_SIZE / 2}, -8)`}
              >
                {skill}
              </text>
            ))}

            {/* Etiquetas eje Y */}
            {skills.map((skill, i) => (
              <text
                key={`y-${skill}`}
                x={-8}
                y={i * CELL_SIZE + CELL_SIZE / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="currentColor"
              >
                {skill}
              </text>
            ))}

            {/* Celdas del heatmap — una por cada par de skills */}
            {skills.map((skill, i) =>
              skills.map((coSkill, j) => {
                // La diagonal (skill consigo misma) se deja vacía
                if (skill === coSkill) return null;

                const count = lookup[`${skill}|${coSkill}`] ?? 0;
                const bgColor = colorScale(count);
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
                    {/* Solo mostramos el número si hay co-ocurrencias */}
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

      {/* Tooltip flotante — fixed para salir del overflow del SVG */}
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

      {/* Leyenda de color */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Menos frecuente</span>
        <div className="flex h-3 w-24 overflow-hidden rounded">
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: colorScale(t * maxCount) }}
            />
          ))}
        </div>
        <span>Más frecuente</span>
      </div>
    </div>
  );
}

export default SkillHeatmap;
