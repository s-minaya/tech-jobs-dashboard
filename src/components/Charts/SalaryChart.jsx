import { useState } from "react";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { getSalaryByRoleAndCountry } from "@/services/jobServices";
import { getRoleLabel, getRoleColor } from "@/lib/roleLabels";
import { useChartData } from "@/hooks/useChartData";
import ChartCard from "@/components/ui/ChartCard";
import ChartDescription from "@/components/ui/ChartDescription";
import RoleSelector from "@/components/ui/RoleSelector";

// pivotData
// Transforma [{ country_code, role_category, median_salary_eur }]
// en [{ country: "DE", backend: 65000, data_analyst: 48000 }]
// para que Recharts agrupe las barras por país.
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

// TooltipSalario
// Muestra el salario con unidad y una nota sobre qué es la mediana.
function TooltipSalario({ active, payload, label, chartConfig }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="grid min-w-52 gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">Salario mediano anual en euros</p>
      {payload.map((entry) =>
        entry.value != null ? (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-muted-foreground">
                {chartConfig[entry.dataKey]?.label ?? entry.dataKey}
              </span>
            </div>
            <span className="font-medium tabular-nums">
              {Number(entry.value).toLocaleString("es-ES")} €/año
            </span>
          </div>
        ) : null,
      )}
      <p className="mt-1 border-t border-border pt-1 text-muted-foreground/70">
        La mitad de las ofertas pagan más que este valor y la otra mitad menos.
      </p>
    </div>
  );
}

// SalaryChart
// Salario mediano anual por rol y país.
// Filtros que aplican: país, periodo, contrato, jornada, remote.
// Categoría de skill NO aplica: el salario no depende de qué skill se busca.
function SalaryChart({ filters }) {
  const {
    data: response,
    loading,
    isInitialLoad,
    error,
  } = useChartData(
    () => getSalaryByRoleAndCountry(filters),
    [
      filters.pais,
      filters.periodo,
      filters.contrato,
      filters.jornada,
      filters.remote,
    ],
  );

  const rows = response?.rows ?? [];
  const totalJobs = response?.total_matching_jobs ?? null;
  const allRoles = extractRoles(rows);

  // null → inicial (5 primeros) | [] → Ninguno | [...] → selección manual
  const [selectedRoles, setSelectedRoles] = useState(null);
  const effectiveSelected =
    selectedRoles === null
      ? allRoles.slice(0, 5)
      : selectedRoles.filter((r) => allRoles.includes(r));

  // Color semántico por rol: Backend siempre índigo, Data Science siempre
  // esmeralda, independientemente del orden en que lleguen de la API.
  const chartConfig = Object.fromEntries(
    allRoles.map((role) => [
      role,
      { label: getRoleLabel(role), color: getRoleColor(role) },
    ]),
  );

  // Ticks blancos en dark mode para legibilidad.
  // Recharts renderiza los ticks como SVG <text> sin acceso a CSS variables.
  const isDark = document.documentElement.classList.contains("dark");
  const tickColor = isDark ? "#ffffff" : undefined;

  return (
    <ChartCard
      title="Salario mediano anual por rol y país"
      loading={loading}
      isInitialLoad={isInitialLoad}
      error={error}
    >
      <ChartDescription
        description="Salario mediano anual en euros por tipo de rol y país. Cada grupo de barras es un país y cada barra es un rol. Solo se incluyen ofertas con salario declarado y verificado mayor de 1.000 €/año."
        filters={filters}
        totalJobs={totalJobs}
        excludeFilters={["skillCategoria"]}
        nota={
          filters.contrato !== "Todos"
            ? `Mostrando solo contratos "${filters.contrato.toLowerCase()}". Los salarios varían entre contrato permanente y temporal.`
            : null
        }
      />

      <RoleSelector
        allRoles={allRoles}
        selected={effectiveSelected}
        onSelect={setSelectedRoles}
        chartColors={allRoles.map(getRoleColor)}
        getRoleLabel={getRoleLabel}
      />

      {effectiveSelected.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Selecciona al menos un rol para ver los salarios.
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <BarChart
            data={pivotData(rows)}
            margin={{ left: 8, right: 8, top: 16 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="country" tick={{ fontSize: 12, fill: tickColor }} />
            <YAxis
              tick={{ fontSize: 11, fill: tickColor }}
              width={56}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`}
            />
            <Tooltip content={<TooltipSalario chartConfig={chartConfig} />} />
            {allRoles
              .filter((role) => effectiveSelected.includes(role))
              .map((role) => (
                <Bar
                  key={role}
                  dataKey={role}
                  fill={getRoleColor(role)}
                  radius={[4, 4, 0, 0]}
                />
              ))}
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

export default SalaryChart;
