import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { formatPct, calcMaxPct, getHeatmapTextColor } from "@/lib/heatmapUtils";

// Tamaño de cada celda cuadrada en píxeles.
const CELL = 44;

// Espacio entre celdas para que no se toquen visualmente.
const GAP = 3;

// Márgenes del SVG para dejar espacio a las etiquetas de fila y columna.
const MARGIN = { top: 16, right: 16, bottom: 120, left: 120 };

// HeatmapSvg
// Sub-componente que encapsula todo el renderizado D3 del heatmap.
// Recibe datos ya procesados y se limita a dibujar el SVG.
//
// El prop `loading` reduce la opacidad del wrapper pero NO desmonta
// el componente. Esto es crítico: si el componente se desmontara al
// cambiar de categoría, el layout encogería y el browser subiría el
// scroll al elemento anterior visible.
function HeatmapSvg({ skills, lookup, jobCountMap, loading = false }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!skills.length || !svgRef.current) return;

    const n = skills.length;

    // Escala de color: rojo para co-ocurrencias bajas, verde para altas.
    // El dominio va de 0 al porcentaje máximo real del dataset (no 100%),
    // para que las diferencias entre celdas sean visibles.
    const maxPct = calcMaxPct(skills, lookup, jobCountMap);
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxPct])
      .interpolator(d3.interpolateRdYlGn);

    // El SVG crece con el número de skills.
    const W = CELL * n + MARGIN.left + MARGIN.right;
    const H = CELL * n + MARGIN.top + MARGIN.bottom;

    const svg = d3.select(svgRef.current).attr("width", W).attr("height", H);

    // Limpiamos el SVG antes de redibujar para evitar elementos duplicados.
    svg.selectAll("*").remove();

    // Grupo principal desplazado por los márgenes para dejar espacio a las etiquetas.
    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Rectángulos de resaltado de fila y columna al hacer hover.
    // Están ocultos por defecto y D3 los muestra/oculta en los eventos de ratón.
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

    // Etiquetas del eje Y (fila, a la izquierda).
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
      .text((d) => d);

    // Etiquetas del eje X (columna, abajo, rotadas 45° para que quepan).
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
      .text((d) => d);

    // Generamos solo las celdas del triángulo inferior (j < i).
    // La tabla es simétrica en co-ocurrencias absolutas, pero el porcentaje
    // NO es simétrico: depende de quién es la fila (el denominador cambia).
    // Mostrar ambos triángulos duplicaría información y confundiría al usuario.
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

    // Rectángulo de color de cada celda.
    // Gris neutro si no hay datos: no usamos rojo para no confundir
    // "sin datos" con "raramente juntas" (que también es rojo en la escala).
    cellGroups
      .append("rect")
      .attr("x", (d) => d.j * CELL + GAP / 2)
      .attr("y", (d) => d.i * CELL + GAP / 2)
      .attr("width", CELL - GAP)
      .attr("height", CELL - GAP)
      .attr("rx", 4)
      .attr("fill", (d) => {
        const co = lookup[`${d.row}|${d.col}`] ?? 0;
        if (co === 0) return "#f1f5f9";
        const pct = (co / (jobCountMap[d.row] ?? 1)) * 100;
        return colorScale(pct);
      });

    // Texto del porcentaje dentro de cada celda.
    // pointer-events: none evita que el texto interfiera con los eventos de ratón.
    // El color del texto se elige según la luminancia del fondo para garantizar legibilidad.
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

    // Tooltip: usamos un div del DOM en lugar de JSX de React para evitar
    // re-renders completos del componente cada vez que el ratón se mueve.
    // Lo buscamos por id para reutilizarlo si ya existe de un render anterior.
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
      // Lo añadimos como hermano del SVG para que position:absolute funcione.
      svgRef.current.parentElement.appendChild(tip);
    }

    cellGroups
      .on("mouseenter", function (event, d) {
        const co = lookup[`${d.row}|${d.col}`] ?? 0;
        const jcA = jobCountMap[d.row] ?? 0;
        const jcB = jobCountMap[d.col] ?? 0;

        // Mostramos los resaltados de fila y columna.
        rowHighlight.attr("y", d.i * CELL).attr("display", null);
        colHighlight.attr("x", d.j * CELL).attr("display", null);

        // Desvanecemos las etiquetas que no corresponden a la celda activa.
        yLabels
          .attr("font-weight", (_, idx) => (idx === d.i ? "600" : "400"))
          .attr("opacity", (_, idx) => (idx === d.i ? 1 : 0.3));
        xLabels
          .attr("font-weight", (_, idx) => (idx === d.j ? "600" : "400"))
          .attr("opacity", (_, idx) => (idx === d.j ? 1 : 0.3));

        if (co > 0) {
          // Mostramos el porcentaje en ambas direcciones para más contexto.
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
              ${co.toLocaleString()} co-ocurrencias absolutas
            </span>`;
        } else {
          tip.innerHTML = `
            <strong style="font-weight:600">${d.row}</strong>
            <span style="color:var(--muted-foreground)"> + </span>
            <strong style="font-weight:600">${d.col}</strong><br>
            <span style="color:var(--muted-foreground)">Sin co-ocurrencias en el dataset</span>`;
        }

        // Posicionamos el tooltip junto al cursor.
        const svgRect = svgRef.current.getBoundingClientRect();
        tip.style.display = "block";
        tip.style.left = event.clientX - svgRect.left + 14 + "px";
        tip.style.top = event.clientY - svgRect.top - 36 + "px";
      })
      .on("mouseleave", function () {
        rowHighlight.attr("display", "none");
        colHighlight.attr("display", "none");
        yLabels.attr("font-weight", "400").attr("opacity", 1);
        xLabels.attr("font-weight", "400").attr("opacity", 1);
        tip.style.display = "none";
      });
  }, [skills, lookup, jobCountMap]);

  // Eliminamos el tooltip del DOM al desmontar este componente.
  useEffect(() => {
    return () => {
      document.getElementById("skill-hm-tooltip")?.remove();
    };
  }, []);

  return (
    // El wrapper siempre ocupa espacio en el DOM aunque loading sea true.
    // Cuando loading=true, reducimos la opacidad para indicar que se está
    // actualizando, pero el tamaño del bloque no cambia y el scroll no se mueve.
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
