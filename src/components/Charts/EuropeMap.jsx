import { useEffect, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import {
  GEO_URL,
  INCLUDED_ISO_NUMERIC,
  COUNTRY_CODE_TO_NUMERIC,
  NUMERIC_TO_COUNTRY_CODE,
  COUNTRY_NAMES,
} from "@/lib/mapConfig";
import { useChartData } from "@/hooks/useChartData";
import { getOffersByCountry } from "@/services/jobServices";
import ChartCard from "@/components/ui/ChartCard";
import ChartDescription from "@/components/ui/ChartDescription";

const WIDTH = 600;
const HEIGHT = 300;

const projection = d3
  .geoAzimuthalEqualArea()
  .rotate([-10, -46, 0])
  .scale(900)
  .translate([WIDTH / 2, HEIGHT / 2]);

const pathGenerator = d3.geoPath().projection(projection);

// EuropeMap
// Mapa coroplético de Europa. El color refleja el número de ofertas
// que cumplen los filtros activos. Escala rojo→verde igual que el heatmap.
// Filtros que aplican: periodo, contrato, jornada, remote.
// País NO filtra: resalta el país seleccionado con borde blanco.
// Categoría de skill NO aplica.
function EuropeMap({ filters }) {
  const [geographies, setGeographies] = useState([]);
  const [geoLoading, setGeoLoading] = useState(true);

  // Solo se recarga cuando cambian los filtros que aplican al mapa.
  const {
    data: response,
    loading: offersLoading,
    isInitialLoad,
    error,
  } = useChartData(
    () => getOffersByCountry(filters),
    [filters.periodo, filters.contrato, filters.jornada, filters.remote],
  );

  const offersData = response?.rows ?? [];
  const totalJobs = response?.total_matching_jobs ?? null;

  const selectedCountry =
    filters?.pais && filters.pais !== "Todos"
      ? filters.pais.toLowerCase()
      : null;

  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((world) => {
        setGeographies(
          topojson.feature(world, world.objects.countries).features,
        );
      })
      .finally(() => setGeoLoading(false));
  }, []);

  const offersByNumeric = Object.fromEntries(
    offersData.map(({ country_code, total_jobs }) => [
      COUNTRY_CODE_TO_NUMERIC[country_code],
      Number(total_jobs),
    ]),
  );

  const maxOffers = offersData.length
    ? Math.max(...offersData.map((d) => Number(d.total_jobs)))
    : 1;

  const colorScale = d3
    .scaleSequential()
    .domain([0, maxOffers])
    .interpolator(d3.interpolateRdYlGn);

  const loading = geoLoading || offersLoading;

  return (
    <ChartCard
      title="Ofertas por país en Europa"
      loading={loading}
      isInitialLoad={isInitialLoad}
      error={error}
    >
      <ChartDescription
        description="Distribución geográfica de las ofertas de empleo tech. El color va de rojo (pocas ofertas) a verde (muchas). Pasa el ratón sobre un país para ver el número exacto."
        filters={filters}
        totalJobs={totalJobs}
        // País no filtra el mapa (resalta visualmente), skillCategoria no aplica
        excludeFilters={["pais", "skillCategoria"]}
        contexto="mapa"
        nota={
          selectedCountry
            ? `${COUNTRY_NAMES[selectedCountry] ?? selectedCountry.toUpperCase()} resaltado con borde blanco.`
            : "Selecciona un país en el panel lateral para resaltarlo."
        }
      />

      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
          {geographies.map((geo, i) => {
            const id = geo.id;
            const isIncluded = INCLUDED_ISO_NUMERIC.has(id);
            const offers = offersByNumeric[id];
            const countryCode = NUMERIC_TO_COUNTRY_CODE[id];
            const isSelected =
              selectedCountry && countryCode === selectedCountry;

            const fill = isIncluded ? colorScale(offers ?? 0) : "var(--muted)";
            const opacity =
              selectedCountry && isIncluded && !isSelected ? 0.4 : 1;
            const stroke = isSelected ? "#ffffff" : "var(--border)";
            const strokeWidth = isSelected ? 2 : 0.5;

            const path = pathGenerator(geo);
            if (!path) return null;

            return (
              <path
                key={geo.id ?? i}
                d={path}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                opacity={opacity}
                style={{ transition: "opacity 200ms ease" }}
                className={isIncluded ? "cursor-pointer" : ""}
                onMouseEnter={(e) => {
                  if (!isIncluded) return;
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    offers,
                    name:
                      COUNTRY_NAMES[countryCode] ?? countryCode?.toUpperCase(),
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </svg>

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded border border-border bg-background px-2 py-1.5 text-xs shadow-md"
            style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
          >
            <span className="font-medium">{tooltip.name}</span>
            <span className="ml-1.5 text-muted-foreground">
              {tooltip.offers != null
                ? `${tooltip.offers.toLocaleString("es-ES")} ofertas`
                : "Sin datos"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Menos ofertas</span>
        <div className="flex h-3 w-32 overflow-hidden rounded">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: colorScale(t * maxOffers) }}
            />
          ))}
        </div>
        <span>Más ofertas</span>
      </div>
    </ChartCard>
  );
}

export default EuropeMap;
