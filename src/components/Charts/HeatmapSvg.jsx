import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { formatPct, calcMaxPct, getHeatmapTextColor } from "@/lib/heatmapUtils";

const CELL = 44;
const GAP = 3;
const MARGIN = { top: 16, right: 16, bottom: 120, left: 120 };

// HeatmapSvg
// Dibuja el SVG de co-ocurrencia con D3. Recibe datos ya procesados.
//
// El heatmap muestra un triángulo inferior (j < i): la celda [i][j]
// representa el % de ofertas que piden skills[i] y también piden skills[j].
// Esto significa que skills[0] (la más popular) aparece en:
//   - Eje Y en la posición i=0: esa fila no tiene celdas (j < 0 no existe)
//   - Eje X en la posición j=0: esa columna tiene celdas desde i=1 en adelante
// Para evitar confusión, ocultamos la etiqueta Y de i=0 y la etiqueta X de j=n-1,
// que son las únicas posiciones que no tienen ninguna celda asociada.
function HeatmapSvg({ skills, lookup, jobCountMap, loading = false }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!skills.length || !svgRef.current) return;

    const n = skills.length;

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
      .attr("rx", 4)
      .attr("fill", "rgba(0,0,0,0.06)")
      .attr("display", "none");

    const colHighlight = g
      .append("rect")
      .attr("width", CELL)
      .attr("height", n * CELL)
      .attr("y", 0)
      .attr("rx", 4)
      .attr("fill", "rgba(0,0,0,0.06)")
      .attr("display", "none");

    // Etiquetas eje Y: ocultamos i=0 porque esa fila no tiene celdas en el triángulo.
    const yLabels = g
      .selectAll(".y-label")
      .data(skills)
      .join("text")
      .attr("class", "y-label")
      .attr("x", -10)
      .attr("y", (_, i) => i * CELL + CELL / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 11)
      .attr("fill", "currentColor")
      // i=0 no tiene celdas → ocultar para que no confunda al usuario
      .attr("opacity", (_, i) => (i === 0 ? 0 : 1))
      .text((d) => d);

    // Etiquetas eje X: ocultamos j=n-1 porque esa columna tampoco tiene celdas.
    const xLabels = g
      .selectAll(".x-label")
      .data(skills)
      .join("text")
      .attr("class", "x-label")
      .attr("font-size", 11)
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .attr("transform", (_, i) => {
        const x = i * CELL + CELL / 2;
        const y = n * CELL + 10;
        return `translate(${x},${y}) rotate(-45)`;
      })
      // j=n-1 no tiene celdas → ocultar
      .attr("opacity", (_, i) => (i === n - 1 ? 0 : 1))
      .text((d) => d);

    // Celdas del triángulo inferior (j < i)
    const cellData = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < i; j++) {
        cellData.push({ i, j, row: skills[i], col: skills[j] });
      }
    }

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
      .attr("rx", 4)
      .attr("fill", (d) => {
        const co = lookup[`${d.row}|${d.col}`] ?? 0;
        // Gris neutro para celdas sin datos, para no confundirlas con "raramente juntas"
        if (co === 0) return "#f1f5f9";
        const pct = (co / (jobCountMap[d.row] ?? 1)) * 100;
        return colorScale(pct);
      });

    cellGroups
      .append("text")
      .attr("x", (d) => d.j * CELL + CELL / 2)
      .attr("y", (d) => d.i * CELL + CELL / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 9)
      .attr("pointer-events", "none")
      .attr("fill", (d) => {
        const co = lookup[`${d.row}|${d.col}`] ?? 0;
        if (co === 0) return "transparent";
        const pct = (co / (jobCountMap[d.row] ?? 1)) * 100;
        return getHeatmapTextColor(colorScale(pct));
      })
      .text((d) => {
        const co = lookup[`${d.row}|${d.col}`] ?? 0;
        if (co === 0) return "";
        return formatPct(co, jobCountMap[d.row]);
      });

    // Tooltip
    let tip = document.getElementById("skill-hm-tooltip");
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "skill-hm-tooltip";
      Object.assign(tip.style, {
        position: "absolute",
        display: "none",
        background: "var(--background)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "8px 12px",
        fontSize: "12px",
        lineHeight: "1.7",
        pointerEvents: "none",
        zIndex: "50",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      });
      svgRef.current.parentElement.appendChild(tip);
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
          .attr("opacity", (_, idx) => {
            if (idx === 0) return 0; // i=0 siempre oculto
            return idx === d.i ? 1 : 0.3;
          });
        xLabels
          .attr("font-weight", (_, idx) => (idx === d.j ? "600" : "400"))
          .attr("opacity", (_, idx) => {
            if (idx === n - 1) return 0; // j=n-1 siempre oculto
            return idx === d.j ? 1 : 0.3;
          });

        if (co > 0) {
          const pctAB = formatPct(co, jcA);
          const pctBA = formatPct(co, jcB);
          tip.innerHTML = `
            <strong style="font-weight:600">${d.row}</strong>
            <span style="color:var(--muted-foreground)"> + </span>
            <strong style="font-weight:600">${d.col}</strong><br>
            <span style="color:var(--muted-foreground)">
              <strong style="font-weight:600;color:var(--foreground)">${pctAB}</strong>
              de ofertas con <em>${d.row}</em> también piden <em>${d.col}</em>
            </span><br>
            <span style="color:var(--muted-foreground)">
              <strong style="font-weight:600;color:var(--foreground)">${pctBA}</strong>
              de ofertas con <em>${d.col}</em> también piden <em>${d.row}</em>
            </span><br>
            <span style="color:var(--muted-foreground);font-size:10px">
              ${co.toLocaleString("es-ES")} co-ocurrencias absolutas
            </span>`;
        } else {
          tip.innerHTML = `
            <strong style="font-weight:600">${d.row}</strong>
            <span style="color:var(--muted-foreground)"> + </span>
            <strong style="font-weight:600">${d.col}</strong><br>
            <span style="color:var(--muted-foreground)">Sin co-ocurrencias en el dataset</span>`;
        }

        const svgRect = svgRef.current.getBoundingClientRect();
        tip.style.display = "block";
        tip.style.left = event.clientX - svgRect.left + 14 + "px";
        tip.style.top = event.clientY - svgRect.top - 36 + "px";
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
  }, [skills, lookup, jobCountMap]);

  useEffect(() => {
    return () => {
      document.getElementById("skill-hm-tooltip")?.remove();
    };
  }, []);

  return (
    <div
      className="relative overflow-x-auto"
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
