import { useState } from "react";
import { ChartContainer } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getDemandByRole } from "@/services/jobServices";
import { getRoleLabel } from "@/lib/roleLabels";
import { useChartData } from "@/hooks/useChartData";
import ChartCard from "@/components/ui/ChartCard";
import ChartDescription from "@/components/ui/ChartDescription";
import RoleSelector from "@/components/ui/RoleSelector";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const MESES_POR_PERIODO = {
  "Últimos 30 días": 1,
  "Últimos 90 días": 3,
  "Últimos 6 meses": 6,
  "Todo el histórico": null,
};

// generarMesesRango
// Genera etiquetas de mes para el rango seleccionado, para que el eje X
// muestre todos los meses aunque algunos no tengan datos en la BD.
function generarMesesRango(nMeses) {
  if (!nMeses) return null;
  const meses = [];
  const ahora = new Date();
  for (let i = nMeses - 1; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push(
      d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" }),
    );
  }
  return meses;
}

// pivotData
// Transforma [{ month, role_category, job_count }] en [{ month, backend: 150, ... }].
// Si se pasa un rango de meses, inicializa todos para que aparezcan en el eje X.
function pivotData(rows, mesesRango) {
  const byMonth = {};
  if (mesesRango) {
    for (const mes of mesesRango) byMonth[mes] = { month: mes };
  }
  for (const { month, role_category, job_count } of rows) {
    const label = new Date(month).toLocaleDateString("es-ES", {
      month: "short",
      year: "2-digit",
    });
    if (!byMonth[label]) byMonth[label] = { month: label };
    byMonth[label][role_category] = Number(job_count);
  }
  return Object.values(byMonth);
}

function extractRoles(rows) {
  return [...new Set(rows.map((r) => r.role_category))];
}

// TooltipDemanda
// Muestra "175 ofertas" en vez de solo "175".
function TooltipDemanda({ active, payload, label, chartConfig }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="grid min-w-40 gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {chartConfig[entry.dataKey]?.label ?? entry.dataKey}
            </span>
          </div>
          <span className="font-medium tabular-nums">
            {entry.value != null
              ? `${entry.value.toLocaleString("es-ES")} ofertas`
              : "Sin datos"}
          </span>
        </div>
      ))}
    </div>
  );
}

// DemandByRoleChart
// Evolución mensual de ofertas por rol.
// Filtros que aplican: país, periodo, contrato, remote.
// Jornada y categoría de skill NO aplican.
function DemandByRoleChart({ filters }) {
  // Solo se recarga cuando cambian los filtros que aplican.
  const {
    data: response,
    loading,
    isInitialLoad,
    error,
  } = useChartData(
    () => getDemandByRole(filters),
    [filters.pais, filters.periodo, filters.contrato, filters.remote],
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

  const chartConfig = Object.fromEntries(
    allRoles.map((role, i) => [
      role,
      {
        label: getRoleLabel(role),
        color: CHART_COLORS[i % CHART_COLORS.length],
      },
    ]),
  );

  const nMeses = MESES_POR_PERIODO[filters.periodo] ?? null;
  const mesesRango = generarMesesRango(nMeses);

  return (
    <ChartCard
      title="Evolución mensual de ofertas por rol"
      loading={loading}
      isInitialLoad={isInitialLoad}
      error={error}
    >
      <ChartDescription
        description="Número de ofertas publicadas cada mes por tipo de rol. Permite ver qué perfiles están creciendo en demanda y cuáles pierden fuerza."
        filters={filters}
        totalJobs={totalJobs}
        nota="Por defecto se muestran los 5 roles más demandados."
        excludeFilters={["jornada", "skillCategoria"]}
      />

      <RoleSelector
        allRoles={allRoles}
        selected={effectiveSelected}
        onSelect={setSelectedRoles}
        chartColors={CHART_COLORS}
        getRoleLabel={getRoleLabel}
      />

      {effectiveSelected.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Selecciona al menos un rol para ver la evolución mensual.
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <LineChart
            data={pivotData(rows, mesesRango)}
            margin={{ left: 8, right: 8 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} width={40} />
            <Tooltip content={<TooltipDemanda chartConfig={chartConfig} />} />
            {allRoles
              .filter((role) => effectiveSelected.includes(role))
              .map((role) => (
                <Line
                  key={role}
                  type="monotone"
                  dataKey={role}
                  stroke={chartConfig[role].color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              ))}
          </LineChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

export default DemandByRoleChart;
