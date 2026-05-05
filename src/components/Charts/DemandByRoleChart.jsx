import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { demandByRole } from "@/data/mockData";
import { ROLE_LABELS } from "@/lib/roleLabels";

// Cada rol tiene su propia variable CSS de color de shadcn
const chartConfig = {
  data_engineer: { label: ROLE_LABELS.data_engineer, color: "var(--chart-1)" },
  data_scientist: { label: ROLE_LABELS.data_scientist, color: "var(--chart-2)" },
  data_analyst: { label: ROLE_LABELS.data_analyst, color: "var(--chart-3)" },
  ml_engineer: { label: ROLE_LABELS.ml_engineer, color: "var(--chart-4)" },
};

const ROLES = Object.keys(chartConfig);

// Gráfica de líneas que muestra la evolución mensual de ofertas por rol.
// Cada línea representa un rol, con color y etiqueta definidos en chartConfig.
function DemandByRoleChart() {
  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 text-sm font-semibold">
        Evolución mensual de demanda por rol
      </h2>
      <ChartContainer config={chartConfig} className="h-72 w-full">
        <LineChart data={demandByRole} margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={40} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {ROLES.map((role) => (
            <Line
              key={role}
              type="monotone"
              dataKey={role}
              stroke={chartConfig[role].color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

export default DemandByRoleChart;