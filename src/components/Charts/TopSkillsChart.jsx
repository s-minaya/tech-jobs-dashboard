import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { getTopSkills } from "@/services/jobServices";
import { useChartData } from "@/hooks/useChartData";
import { useIsDark } from "@/hooks/useIsDark";
import ChartCard from "@/components/ui/ChartCard";
import ChartDescription, {
  getWarningNodes,
} from "@/components/ui/ChartDescription";

const chartConfig = {
  job_count: { label: "Número de ofertas", color: "var(--color-primary)" },
};

const PX_POR_SKILL = 32;
const ALTURA_MINIMA = 200;

// TopSkillsChart
// Gráfica de barras horizontales con las skills más demandadas.
// La altura se calcula dinámicamente para que siempre quepan todos los nombres.
// El color del tick del eje Y adapta al tema activo en tiempo real.
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

  // useIsDark con MutationObserver garantiza que el color se actualiza
  // correctamente al cambiar el tema en cualquier dirección.
  // Recharts renderiza los ticks como <text> SVG fuera del árbol React y
  // no puede leer variables CSS — hay que resolver el token a un valor
  // concreto con getComputedStyle en el momento del render. El fallback
  // cubre jsdom en tests, donde getComputedStyle no resuelve custom
  // properties y devuelve string vacío.
  const isDark = useIsDark();
  const tickColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue(isDark ? "--color-text-primary" : "--color-text-secondary")
      .trim() || (isDark ? "#f5f6f8" : "#4b4b63");

  return (
    <ChartCard
      title="Top Skills más demandadas"
      warning={getWarningNodes(filters, ["jornada"], "topskills")}
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
        <div className="chart-graph-area">
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
                <Bar dataKey="job_count" fill="var(--color-primary)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

export default TopSkillsChart;
