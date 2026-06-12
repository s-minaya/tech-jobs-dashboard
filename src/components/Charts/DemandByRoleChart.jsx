import { useState } from "react";
import { ChartContainer } from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getDemandByRole } from "@/services/jobServices";
import { getRoleLabel, getRoleColor } from "@/lib/roleLabels";
import { useChartData } from "@/hooks/useChartData";
import ChartCard from "@/components/ui/ChartCard";
import ChartDescription, {
  getWarningNodes,
} from "@/components/ui/ChartDescription";
import RoleSelector from "@/components/ui/RoleSelector";

// Periodos que tienen suficientes meses para mostrar tendencias en una
// gráfica de líneas. "Últimos 30 días" queda fuera porque 1-2 puntos
// en una línea no transmiten ninguna tendencia significativa.
const PERIODOS_CON_TENDENCIA = [
  "Últimos 90 días",
  "Últimos 6 meses",
  "Todo el histórico",
];

const MESES_POR_PERIODO = {
  "Últimos 90 días": 3,
  "Últimos 6 meses": 6,
  "Todo el histórico": null,
};

// Genera etiquetas de mes para el rango seleccionado para que el eje X
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

// Tooltip personalizado que muestra "175 ofertas" en vez de solo "175".
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
// Gráfica de áreas con la evolución mensual de ofertas por tipo de rol.
// Al hacer hover sobre un rol, su área se rellena con gradiente y el resto
// se atenúa — efecto conseguido con fillOpacity dinámico por rol.
// Requiere al menos 3 meses de datos para que la tendencia sea visible.
// Con "Últimos 30 días" muestra un aviso en lugar de la gráfica.
function DemandByRoleChart({ filters }) {
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
  // activeRole: rol sobre el que está el cursor — null = ninguno en hover
  const [activeRole, setActiveRole] = useState(null);

  const effectiveSelected =
    selectedRoles === null
      ? allRoles.slice(0, 5)
      : selectedRoles.filter((r) => allRoles.includes(r));

  // Cada rol recibe su color semántico (Backend=índigo, Data Science=esmeralda...)
  // en lugar de un color por posición. Así el color es consistente
  // independientemente del orden en que lleguen los roles de la API.
  const chartConfig = Object.fromEntries(
    allRoles.map((role) => [
      role,
      { label: getRoleLabel(role), color: getRoleColor(role) },
    ]),
  );

  const nMeses = MESES_POR_PERIODO[filters.periodo] ?? null;
  const mesesRango = generarMesesRango(nMeses);

  // Comprobamos si el periodo seleccionado tiene suficientes meses
  // para que una gráfica de áreas sea informativa.
  const periodoInsuficiente = !PERIODOS_CON_TENDENCIA.includes(filters.periodo);

  // Color de los ticks de los ejes: blanco en dark, heredado en light.
  // Recharts renderiza los ticks como SVG <text> y no hereda CSS variables,
  // así que necesitamos el valor resuelto en el momento del render.
  const isDark = document.documentElement.classList.contains("dark");
  const tickColor = isDark ? "#ffffff" : undefined;

  return (
    <ChartCard
      title="Evolución mensual de ofertas por rol"
      warning={getWarningNodes(
        filters,
        ["jornada", "skillCategoria"],
        "demanda",
      )}
      loading={loading}
      isInitialLoad={isInitialLoad}
      error={error}
    >
      <ChartDescription
        description="Número de ofertas publicadas cada mes por tipo de rol. Permite ver qué perfiles están creciendo en demanda y cuáles pierden fuerza a lo largo del tiempo."
        filters={filters}
        totalJobs={totalJobs}
        nota="Por defecto se muestran los 5 roles más demandados."
        excludeFilters={["jornada", "skillCategoria"]}
      />

      {/* Aviso cuando el periodo es demasiado corto para ver tendencias */}
      {periodoInsuficiente ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">
            Periodo insuficiente para ver tendencias
          </p>
          <p className="mt-1">
            Con "Últimos 30 días" solo hay 1-2 puntos en la línea, lo que no
            permite ver si la demanda de un rol está subiendo o bajando.
            Selecciona <strong>90 días, 6 meses o todo el histórico</strong>{" "}
            para ver la evolución real por rol.
          </p>
        </div>
      ) : (
        <>
          <RoleSelector
            allRoles={allRoles}
            selected={effectiveSelected}
            onSelect={setSelectedRoles}
            // Pasamos los colores semánticos al selector para que los botones
            // de cada rol tengan el mismo color que su línea en la gráfica
            chartColors={allRoles.map(getRoleColor)}
            getRoleLabel={getRoleLabel}
          />

          {effectiveSelected.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Selecciona al menos un rol para ver la evolución mensual.
            </p>
          ) : (
            <div className="chart-graph-area">
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <AreaChart
                  data={pivotData(rows, mesesRango)}
                  margin={{ left: 8, right: 8, top: 20 }}
                  onMouseLeave={() => setActiveRole(null)}
                >
                  {/* Gradientes: uno por rol, de su color al transparente. */}
                  <defs>
                    {effectiveSelected.map((role) => {
                      const color = getRoleColor(role);
                      const id = `gradient-${role.replace(/[^a-z0-9]/gi, "-")}`;
                      return (
                        <linearGradient
                          key={role}
                          id={id}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={color}
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor={color}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      );
                    })}
                  </defs>

                  <CartesianGrid vertical={false} />
                  {/* tickColor blanco en dark para que los labels sean legibles */}
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: tickColor }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: tickColor }}
                    width={52}
                    tickFormatter={(v) =>
                      `${v.toLocaleString("es-ES")} ofertas`
                    }
                  />
                  <Tooltip
                    content={<TooltipDemanda chartConfig={chartConfig} />}
                  />

                  {allRoles
                    .filter((role) => effectiveSelected.includes(role))
                    .map((role) => {
                      const color = getRoleColor(role);
                      const gradId = `gradient-${role.replace(/[^a-z0-9]/gi, "-")}`;
                      const isActive = activeRole === role;
                      const isOther = activeRole !== null && !isActive;
                      const lineOpacity = isOther ? 0.15 : 1;
                      const fillOpacity = isActive ? 1 : 0;

                      return (
                        <Area
                          key={role}
                          type="monotone"
                          dataKey={role}
                          stroke={color}
                          strokeWidth={isActive ? 2.5 : 1.5}
                          strokeOpacity={lineOpacity}
                          fill={`url(#${gradId})`}
                          fillOpacity={fillOpacity}
                          dot={false}
                          connectNulls={false}
                          activeDot={{
                            r: 4,
                            fill: color,
                            onMouseEnter: () => setActiveRole(role),
                          }}
                          onMouseEnter={() => setActiveRole(role)}
                        />
                      );
                    })}
                </AreaChart>
              </ChartContainer>
            </div>
          )}
        </>
      )}
    </ChartCard>
  );
}

export default DemandByRoleChart;
