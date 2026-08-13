import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { getTopSkills } from "@/services/jobServices";
import { useChartData } from "@/hooks/useChartData";
import { useIsDark } from "@/hooks/useIsDark";
import { SKILL_CATEGORIA_LABELS } from "@/lib/filterUtils";
import ChartCard from "@/components/ui/ChartCard";
import ChartDescription, {
  getWarningNodes,
} from "@/components/ui/ChartDescription";

const chartConfig = {
  job_count: { label: "Número de ofertas", color: "var(--color-primary)" },
};

const PX_POR_SKILL = 32;
const ALTURA_MINIMA = 200;
// ALTURA_MAXIMA (fase 013): sin techo, el backend puede devolver hasta 50
// filas con `category` activa (hasta 1600px de card). 700px cubre el caso
// por defecto (hasta 20 filas = 640px) sin scroll, y acota los casos con
// más filas con scroll interno en vez de una card desproporcionada.
const ALTURA_MAXIMA = 700;

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
    (signal) => getTopSkills(filters, signal),
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
  // alturaPx es la altura REAL del contenido (para que Recharts reparta las
  // barras con el mismo espaciado de siempre) — el techo se aplica en el
  // contenedor exterior con overflow, no aquí, o las barras se
  // comprimirían en vez de quedar recortadas con scroll.
  const alturaPx = Math.max(ALTURA_MINIMA, rows.length * PX_POR_SKILL);
  const necesitaScroll = alturaPx > ALTURA_MAXIMA;

  // skillCategoria llega en inglés (coincide con skills.category en BD) —
  // SKILL_CATEGORIA_LABELS traduce solo el texto mostrado, igual que
  // NOMBRES_PAISES/CONTRATO_LABELS (fase 013).
  const categoriaLabel = SKILL_CATEGORIA_LABELS[filters.skillCategoria];

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
      slowHint="Esta consulta puede tardar varios segundos, sobre todo sin filtro de país — gracias por tu paciencia."
    >
      <ChartDescription
        description={`Skills técnicas que aparecen en más ofertas de empleo, ordenadas de mayor a menor. Cada barra muestra en cuántas ofertas se menciona esa tecnología${categoriaLabel ? ` de la categoría "${categoriaLabel.toLowerCase()}"` : ""}.`}
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
        <div
          data-testid="top-skills-scroll-area"
          className="chart-graph-area"
          // .chart-graph-area trae overflow: hidden por defecto (index.css)
          // — el estilo inline sobreescribe explícitamente los dos ejes
          // (no solo overflowY) para no depender de cómo resuelva el
          // navegador la cascada entre el shorthand de la clase y una sola
          // propiedad longhand inline.
          style={
            necesitaScroll
              ? { maxHeight: ALTURA_MAXIMA, overflow: "hidden auto" }
              : undefined
          }
        >
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
