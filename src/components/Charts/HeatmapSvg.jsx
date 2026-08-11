import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { formatPct, calcMaxPct, getHeatmapTextColor } from "@/lib/heatmapUtils";

const GAP = 2;
const CELL_MAX = 44; // desktop con pocas skills
const CELL_MIN = 28; // mínimo para que quepan los porcentajes

// HeatmapSvg
// Dibuja el SVG de co-ocurrencia con D3.
// El tamaño de celda es dinámico: se calcula a partir del ancho del
// contenedor medido con ResizeObserver. Así con pocos filtros y pocas
// skills las celdas son grandes, y en landscape móvil se encogen
// para caber en pantalla. Los porcentajes siempre se muestran.
function HeatmapSvg({ skills, lookup, jobCountMap, loading = false }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!skills.length || !svgRef.current || !containerRef.current) return;

    function draw(availableWidth) {
      const n = skills.length;

      // Margen izquierdo basado en la skill más larga (para que la etiqueta quepa).
      // Multiplicamos por 7px por carácter y usamos mínimo 80px para que nombres
      // como "Kubernetes" o "Data Engineering" no queden cortados.
      const maxLabelLen = Math.max(...skills.map((s) => s.length));
      const marginLeft = Math.min(Math.max(maxLabelLen * 7, 80), 160);
      const marginBottom = 110;
      const MARGIN = {
        top: 12,
        right: 12,
        bottom: marginBottom,
        left: marginLeft,
      };

      // Celda: lo que cabe dividiendo el ancho útil entre n skills
      const usableWidth = availableWidth - MARGIN.left - MARGIN.right;
      const cellFromWidth = Math.floor(usableWidth / n);
      const CELL = Math.max(CELL_MIN, Math.min(CELL_MAX, cellFromWidth));

      // Fuente proporcional al tamaño de celda
      const labelFont = CELL < 34 ? 9 : 11;
      const cellFont = CELL < 34 ? 7 : 9;

      const maxPct = calcMaxPct(skills, lookup, jobCountMap);
      const colorScale = d3
        .scaleSequential()
        .domain([0, maxPct])
        .interpolator(d3.interpolateRdYlGn);

      const W = CELL * n + MARGIN.left + MARGIN.right;
      const H = CELL * n + MARGIN.top + MARGIN.bottom;

      const svg = d3.select(svgRef.current).attr("width", W).attr("height", H);
      svg.selectAll("*").remove();

      const g = svg
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

      const rowHighlight = g
        .append("rect")
        .attr("height", CELL)
        .attr("width", n * CELL)
        .attr("x", 0)
        .attr("rx", 3)
        .attr("fill", "rgba(0,0,0,0.06)")
        .attr("display", "none");

      const colHighlight = g
        .append("rect")
        .attr("width", CELL)
        .attr("height", n * CELL)
        .attr("y", 0)
        .attr("rx", 3)
        .attr("fill", "rgba(0,0,0,0.06)")
        .attr("display", "none");

      // Etiquetas eje Y — i=0 oculto (sin celdas en el triángulo)
      const yLabels = g
        .selectAll(".y-label")
        .data(skills)
        .join("text")
        .attr("class", "y-label")
        .attr("x", -8)
        .attr("y", (_, i) => i * CELL + CELL / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", labelFont)
        .attr("fill", "currentColor")
        .attr("opacity", (_, i) => (i === 0 ? 0 : 1))
        .text((d) => d);

      // Etiquetas eje X — j=n-1 oculto (sin celdas en el triángulo)
      const xLabels = g
        .selectAll(".x-label")
        .data(skills)
        .join("text")
        .attr("class", "x-label")
        .attr("font-size", labelFont)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .attr("transform", (_, i) => {
          const x = i * CELL + CELL / 2;
          const y = n * CELL + 8;
          return `translate(${x},${y}) rotate(-45)`;
        })
        .attr("opacity", (_, i) => (i === n - 1 ? 0 : 1))
        .text((d) => d);

      // Celdas del triángulo inferior (j < i)
      const cellData = [];
      for (let i = 0; i < n; i++)
        for (let j = 0; j < i; j++)
          cellData.push({ i, j, row: skills[i], col: skills[j] });

      const cellGroups = g
        .selectAll(".cell")
        .data(cellData)
        .join("g")
        .attr("class", "cell");

      cellGroups
        .append("rect")
        .attr("x", (d) => d.j * CELL + GAP / 2)
        .attr("y", (d) => d.i * CELL + GAP / 2)
        .attr("width", CELL - GAP)
        .attr("height", CELL - GAP)
        .attr("rx", 3)
        .attr("fill", (d) => {
          const co = lookup[`${d.row}|${d.col}`] ?? 0;
          // --color-surface para celdas sin datos — distinto del rojo de
          // "raramente juntas" y del fondo, en ambos temas. Los atributos
          // SVG fill sí resuelven variables CSS en el navegador (a
          // diferencia de los <text> de Recharts).
          if (co === 0) return "var(--color-surface)";
          return colorScale((co / (jobCountMap[d.row] ?? 1)) * 100);
        });

      // Porcentajes siempre visibles
      cellGroups
        .append("text")
        .attr("x", (d) => d.j * CELL + CELL / 2)
        .attr("y", (d) => d.i * CELL + CELL / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", cellFont)
        .attr("pointer-events", "none")
        .attr("fill", (d) => {
          const co = lookup[`${d.row}|${d.col}`] ?? 0;
          if (co === 0) return "transparent";
          return getHeatmapTextColor(
            colorScale((co / (jobCountMap[d.row] ?? 1)) * 100),
          );
        })
        .text((d) => {
          const co = lookup[`${d.row}|${d.col}`] ?? 0;
          return co === 0 ? "" : formatPct(co, jobCountMap[d.row]);
        });

      // Tooltip con position:fixed para no quedar recortado
      let tip = document.getElementById("skill-hm-tooltip");
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "skill-hm-tooltip";
        Object.assign(tip.style, {
          position: "fixed",
          display: "none",
          background: "var(--color-background)",
          border: "1px solid var(--color-border)",
          borderRadius: "6px",
          padding: "8px 12px",
          fontSize: "12px",
          lineHeight: "1.7",
          pointerEvents: "none",
          zIndex: "9999",
          whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        });
        document.body.appendChild(tip);
      }

      cellGroups
        .on("mouseenter", function (event, d) {
          const co = lookup[`${d.row}|${d.col}`] ?? 0;
          const jcA = jobCountMap[d.row] ?? 0;
          const jcB = jobCountMap[d.col] ?? 0;
          rowHighlight.attr("y", d.i * CELL).attr("display", null);
          colHighlight.attr("x", d.j * CELL).attr("display", null);
          yLabels
            .attr("font-weight", (_, idx) => (idx === d.i ? "600" : "400"))
            .attr("opacity", (_, idx) =>
              idx === 0 ? 0 : idx === d.i ? 1 : 0.3,
            );
          xLabels
            .attr("font-weight", (_, idx) => (idx === d.j ? "600" : "400"))
            .attr("opacity", (_, idx) =>
              idx === n - 1 ? 0 : idx === d.j ? 1 : 0.3,
            );
          if (co > 0) {
            tip.innerHTML = `
              <strong>${d.row}</strong>
              <span style="color:var(--color-text-muted)"> + </span>
              <strong>${d.col}</strong><br>
              <strong style="color:var(--color-text-primary)">${formatPct(co, jcA)}</strong>
              <span style="color:var(--color-text-muted)"> de ofertas con <em>${d.row}</em> también piden <em>${d.col}</em></span><br>
              <strong style="color:var(--color-text-primary)">${formatPct(co, jcB)}</strong>
              <span style="color:var(--color-text-muted)"> de ofertas con <em>${d.col}</em> también piden <em>${d.row}</em></span><br>
              <span style="color:var(--color-text-muted);font-size:10px">${co.toLocaleString("es-ES")} co-ocurrencias absolutas</span>`;
          } else {
            tip.innerHTML = `
              <strong>${d.row}</strong>
              <span style="color:var(--color-text-muted)"> + </span>
              <strong>${d.col}</strong><br>
              <span style="color:var(--color-text-muted)">Sin co-ocurrencias en el dataset</span>`;
          }
          tip.style.display = "block";
          tip.style.left = event.clientX + 14 + "px";
          tip.style.top = event.clientY - 36 + "px";
        })
        .on("mouseleave", function () {
          rowHighlight.attr("display", "none");
          colHighlight.attr("display", "none");
          yLabels
            .attr("font-weight", "400")
            .attr("opacity", (_, i) => (i === 0 ? 0 : 1));
          xLabels
            .attr("font-weight", "400")
            .attr("opacity", (_, i) => (i === n - 1 ? 0 : 1));
          tip.style.display = "none";
        });
    }

    // Dibuja con el ancho actual
    draw(containerRef.current.offsetWidth);

    // ResizeObserver: redibuja al cambiar orientación o tamaño de ventana
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) draw(w);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [skills, lookup, jobCountMap]);

  useEffect(() => {
    return () => {
      document.getElementById("skill-hm-tooltip")?.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{
        opacity: loading ? 0.4 : 1,
        transition: "opacity 200ms ease",
        minHeight: "200px",
      }}
    >
      <svg ref={svgRef} />
    </div>
  );
}

export default HeatmapSvg;
