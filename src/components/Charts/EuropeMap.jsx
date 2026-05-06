import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import {
  GEO_URL,
  INCLUDED_ISO_NUMERIC,
  offersByNumeric,
  maxOffers,
  colorScale,
} from "@/lib/mapConfig";

// Mapa coroplético de Europa renderizado con D3 + SVG.
// D3 se usa solo para calcular la proyección geográfica y convertir
// coordenadas a paths SVG — React se encarga de todo el renderizado.
function EuropeMap() {
  // Array de features GeoJSON, uno por país. Se carga una sola vez desde la CDN.
  const [geographies, setGeographies] = useState([]);

  // Datos del tooltip: posición del ratón + datos del país bajo el cursor.
  // null cuando no hay ningún país en hover.
  const [tooltip, setTooltip] = useState(null);

  const svgRef = useRef(null);

  const width = 600;
  const height = 300;

  // Proyección azimutal de área igual, centrada en Europa.
  // rotate desplaza el centro del mundo hacia Europa: [-longitud, -latitud, inclinación]
  // scale controla el zoom: más alto = más zoom
  const projection = d3
    .geoAzimuthalEqualArea()
    .rotate([-10, -46, 0])
    .scale(900)
    .translate([width / 2, height / 2]);

  // Convierte las coordenadas GeoJSON de cada país en un string de path SVG
  const pathGenerator = d3.geoPath().projection(projection);

  // Descarga el TopoJSON mundial y extrae los países como features GeoJSON.
  // Solo se ejecuta al montar el componente (array de dependencias vacío).
  useEffect(() => {
    fetch(GEO_URL)
      .then((res) => res.json())
      .then((world) => {
        // topojson.feature convierte el formato TopoJSON a GeoJSON estándar
        const countries = topojson.feature(world, world.objects.countries);
        setGeographies(countries.features);
      });
  }, []);

  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 text-sm font-semibold">Ofertas por país en Europa</h2>

      <div className="relative">
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full">
          {geographies.map((geo, i) => {
            const id = geo.id;
            const isIncluded = INCLUDED_ISO_NUMERIC.has(id);
            const offers = offersByNumeric[id];

            // Países incluidos: color según número de ofertas. Resto: color neutro.
            const fill = isIncluded ? colorScale(offers ?? 0) : "var(--muted)";
            const path = pathGenerator(geo);

            // Algunos países quedan completamente fuera del recorte de la proyección
            // y d3 devuelve null — los descartamos para no renderizar paths vacíos
            if (!path) return null;

            return (
              <path
                key={geo.id ?? i}
                d={path}
                fill={fill}
                stroke="var(--border)"
                strokeWidth={0.5}
                className={isIncluded ? "cursor-pointer" : ""}
                onMouseEnter={(e) => {
                  if (!isIncluded) return;
                  setTooltip({ x: e.clientX, y: e.clientY, offers, id });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </svg>

        {/* Tooltip flotante que sigue al ratón — fixed para salir del overflow del SVG */}
        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded border border-border bg-background px-2 py-1 text-xs shadow"
            style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
          >
            {tooltip.offers?.toLocaleString()} ofertas
          </div>
        )}
      </div>

      {/* Leyenda de color: 5 tramos del gradiente de azul */}
      <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Menos ofertas</span>
        <div className="flex h-3 w-24 overflow-hidden rounded">
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: colorScale(t * maxOffers) }}
            />
          ))}
        </div>
        <span>Más ofertas</span>
      </div>
    </div>
  );
}

export default EuropeMap;
