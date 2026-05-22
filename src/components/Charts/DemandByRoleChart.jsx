import { useState, useEffect } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { getDemandByRole } from "@/services/jobServices";
import { getRoleLabel } from "@/lib/roleLabels";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function pivotData(rows) {
  const byMonth = {};
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

// Gráfica de líneas con la evolución mensual de ofertas por rol.
// El usuario puede seleccionar qué roles mostrar mediante botones toggle.
// Por defecto muestra los 5 primeros para no saturar la gráfica.
function DemandByRoleChart({ filters }) {
  const [data, setData] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  // Roles actualmente visibles — se inicializan con los 5 primeros al cargar
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getDemandByRole(filters)
      .then((rows) => {
        const roles = extractRoles(rows);
        setAllRoles(roles);
        // Seleccionamos los 5 primeros por defecto
        setSelectedRoles(roles.slice(0, 5));
        setData(pivotData(rows));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters.pais]);

  // Alterna la visibilidad de un rol al hacer clic en su botón
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
        Evolución mensual de demanda por rol
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

      {/* Selector de roles — botones toggle uno por rol disponible */}
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
              // El color de fondo activo coincide con el color de la línea
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
        <LineChart data={data} margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={40} />
          <ChartTooltip content={<ChartTooltipContent />} />

          {/* Solo renderizamos las líneas de los roles seleccionados */}
          {allRoles
            .filter((role) => selectedRoles.includes(role))
            .map((role, i) => (
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
