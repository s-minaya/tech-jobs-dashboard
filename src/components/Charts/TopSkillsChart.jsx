import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { getTopSkills } from "@/services/jobServices";
import { useChartData } from "@/hooks/useChartData";
import ChartCard from "@/components/ui/ChartCard";
import ChartDescription from "@/components/ui/ChartDescription";

const chartConfig = {
  job_count: { label: "Número de ofertas", color: "var(--chart-1)" },
};

const PX_POR_SKILL = 32;
const ALTURA_MINIMA = 200;

// TopSkillsChart
// Gráfica de barras horizontales con las skills más demandadas.
// La altura se calcula dinámicamente para que siempre quepan todos los nombres.
// El color del tick del eje Y adapta al tema:
//   - Light: foreground oscuro (heredado de currentColor)
//   - Dark: blanco para contrastar sobre el fondo oscuro de la card
function TopSkillsChart({ filters }) {
  const {
    data: response,
    loading,
    isInitialLoad,
    error,
  } = useChartData(
    () => getTopSkills(filters),
    [
      filters.pais,
      filters.periodo,
      filters.contrato,
      filters.remote,
      filters.skillCategoria,
    ],
  );

  const rows = response?.rows ?? [];
  const totalJobs = response?.total_matching_jobs ?? null;
  const alturaPx = Math.max(ALTURA_MINIMA, rows.length * PX_POR_SKILL);

  // El color del texto de las etiquetas varía según el tema activo.
  // Recharts renderiza los ticks fuera del árbol de React (SVG directo),
  // así que no puede leer variables CSS — necesitamos el valor resuelto.
  const isDark = document.documentElement.classList.contains("dark");
  const tickColor = isDark ? "#ffffff" : "var(--foreground)";

  return (
    <ChartCard
      title="Top Skills más demandadas"
      loading={loading}
      isInitialLoad={isInitialLoad}
      error={error}
    >
      <ChartDescription
        description={`Skills técnicas que aparecen en más ofertas de empleo, ordenadas de mayor a menor. Cada barra muestra en cuántas ofertas se menciona esa tecnología${filters.skillCategoria !== "Todas" ? ` de la categoría "${filters.skillCategoria.toLowerCase()}"` : ""}.`}
        filters={filters}
        totalJobs={totalJobs}
        excludeFilters={["jornada"]}
      />

      {rows.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground">
          No hay datos para los filtros seleccionados. Prueba a ampliar el
          periodo o quitar algún filtro.
        </p>
      ) : (
        <div style={{ width: "100%", height: alturaPx }}>
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
            >
              <XAxis type="number" dataKey="job_count" hide />
              <YAxis
                type="category"
                dataKey="skill"
                width={100}
                tick={{ fontSize: 12, fill: tickColor }}
                interval={0}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="job_count" fill="var(--primary)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </ChartCard>
  );
}

export default TopSkillsChart;
