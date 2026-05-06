import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { salaryByRoleAndCountry } from "@/data/mockData";
import { ROLE_LABELS } from "@/lib/roleLabels";
import { filterSalary } from "@/lib/filterData";

const chartConfig = {
  data_engineer: { label: ROLE_LABELS.data_engineer, color: "var(--chart-1)" },
  data_scientist: {
    label: ROLE_LABELS.data_scientist,
    color: "var(--chart-2)",
  },
  data_analyst: { label: ROLE_LABELS.data_analyst, color: "var(--chart-3)" },
  ml_engineer: { label: ROLE_LABELS.ml_engineer, color: "var(--chart-4)" },
};

const ROLES = Object.keys(chartConfig);

// Formatea números grandes como salarios de forma legible.
// Ej: 65000 → "65k"
function formatSalary(value) {
  return `${(value / 1000).toFixed(0)}k`;
}

// Gráfica de barras agrupadas que muestra el salario medio por rol en cada país.
// Cada grupo de barras representa un país, y cada barra un rol.
// Reacciona al filtro de país mostrando uno o todos los países.
function SalaryChart({ filters }) {
  const data = filterSalary(salaryByRoleAndCountry, filters);

  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 text-sm font-semibold">
        Salario medio por rol y país (€)
      </h2>
      <ChartContainer config={chartConfig} className="h-72 w-full">
        <BarChart data={data} margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="country" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={40}
            tickFormatter={formatSalary}
          />
          <ChartTooltip
            content={
              // formatter personalizado para mostrar el símbolo € en el tooltip
              <ChartTooltipContent
                formatter={(value) => `${value.toLocaleString()} €`}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {ROLES.map((role) => (
            <Bar
              key={role}
              dataKey={role}
              fill={chartConfig[role].color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export default SalaryChart;
