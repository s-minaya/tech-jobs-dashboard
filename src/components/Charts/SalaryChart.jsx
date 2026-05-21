import { useState, useEffect } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { getSalaryByRoleAndCountry } from "@/services/jobServices";
import { getRoleLabel } from "@/lib/roleLabels";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Los datos de la API vienen con una fila por país+rol.
// Recharts necesita una fila por país con todos los roles como columnas.
// Transformamos: [{ country_code, role_category, median_salary_eur }] →
//                [{ country: "DE", backend: 65000, data_analyst: 48000, ... }]
function pivotData(rows) {
  const byCountry = {};
  for (const { country_code, role_category, median_salary_eur } of rows) {
    const code = country_code.toUpperCase();
    if (!byCountry[code]) byCountry[code] = { country: code };
    byCountry[code][role_category] = Number(median_salary_eur);
  }
  return Object.values(byCountry);
}

function extractRoles(rows) {
  return [...new Set(rows.map((r) => r.role_category))];
}

function formatSalary(value) {
  return `${(value / 1000).toFixed(0)}k`;
}

// Gráfica de barras agrupadas de salario mediano por rol y país.
// Los roles se calculan dinámicamente a partir de los datos de la API.
// Usa la mediana como métrica principal — más robusta que la media frente a outliers.
// El usuario puede seleccionar qué roles mostrar mediante botones toggle.
// Por defecto muestra los 5 primeros para no saturar la gráfica.
function SalaryChart({ filters }) {
  const [data, setData] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getSalaryByRoleAndCountry(filters)
      .then((rows) => {
        const roles = extractRoles(rows);
        setAllRoles(roles);
        setSelectedRoles(roles.slice(0, 5));
        setData(pivotData(rows));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters.pais]);

  function toggleRole(role) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  const chartConfig = Object.fromEntries(
    allRoles.map((role, i) => [
      role,
      {
        label: getRoleLabel(role),
        color: CHART_COLORS[i % CHART_COLORS.length],
      },
    ]),
  );

  if (loading)
    return (
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );

  if (error)
    return (
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );

  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 text-sm font-semibold">
        Salario mediano por rol y país (€)
      </h2>

      {/* Controles de selección */}
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => setSelectedRoles([...allRoles])}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Todos
        </button>
        <span className="text-xs text-muted-foreground">·</span>
        <button
          onClick={() => setSelectedRoles([])}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Ninguno
        </button>
      </div>

      {/* Selector de roles */}
      <div className="mb-4 flex flex-wrap gap-1">
        {allRoles.map((role, i) => {
          const isSelected = selectedRoles.includes(role);
          return (
            <button
              key={role}
              onClick={() => toggleRole(role)}
              className={`rounded border px-2 py-1 text-xs transition-colors ${
                isSelected
                  ? "border-transparent text-white"
                  : "border-border text-muted-foreground"
              }`}
              style={
                isSelected
                  ? { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }
                  : {}
              }
            >
              {getRoleLabel(role)}
            </button>
          );
        })}
      </div>

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
              <ChartTooltipContent
                formatter={(value) =>
                  value ? `${Number(value).toLocaleString()} €` : "Sin datos"
                }
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {/* Solo renderizamos las barras de los roles seleccionados */}
          {allRoles
            .filter((role) => selectedRoles.includes(role))
            .map((role, i) => (
              <Bar
                key={role}
                dataKey={role}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export default SalaryChart;
