import { useState } from "react";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { getSalaryByRoleAndCountry } from "@/services/jobServices";
import { getRoleLabel, getRoleColor, rankRolesByVolume } from "@/lib/roleLabels";
import { CONTRATO_LABELS, NOMBRES_PAISES } from "@/lib/filterUtils";
import { useChartData } from "@/hooks/useChartData";
import { useIsDark } from "@/hooks/useIsDark";
import ChartCard from "@/components/ui/ChartCard";
import ChartDescription, {
  getWarningNodes,
} from "@/components/ui/ChartDescription";
import RoleSelector from "@/components/ui/RoleSelector";

// Con n <= 4 ofertas la mediana la determina, como mucho, 1-2 valores
// centrales — un solo dato puede cambiarla por completo. Mismo orden de
// magnitud que SMALL_SET_THRESHOLD=4 ya usado en heatmapUtils.js (fase
// 008) para el mismo razonamiento ("con pocas muestras, no tratar el dato
// como si fuera tan fiable como uno robusto").
const MUESTRA_PEQUEÑA_THRESHOLD = 5;

// pivotData
// Transforma [{ country_code, role_category, median_salary_eur, job_count,
// avg_salary_eur }] en [{ country: "Alemania", backend: 65000,
// backend__meta: { job_count, avg_salary_eur }, ... }] para que Recharts
// agrupe las barras por país.
//
// El nombre de país usa NOMBRES_PAISES (ya usado en el resto de la UI,
// pills de filtros activos) como fuente principal, no country_name del
// backend — ese campo viene en inglés ("Germany", ver seed de la tabla
// countries en api/schema.sql), usarlo tal cual regresionaría el idioma
// del eje X. country_name queda como fallback defensivo por si algún país
// nuevo se añade a la BD antes que a NOMBRES_PAISES.
export function pivotData(rows) {
  const byCountry = {};
  for (const row of rows) {
    const code = row.country_code.toUpperCase();
    const country = NOMBRES_PAISES[code] ?? row.country_name ?? code;
    if (!byCountry[country]) byCountry[country] = { country };
    byCountry[country][row.role_category] = Number(row.median_salary_eur);
    byCountry[country][`${row.role_category}__meta`] = {
      job_count: Number(row.job_count),
      avg_salary_eur: Number(row.avg_salary_eur),
    };
  }
  return Object.values(byCountry);
}

// TooltipSalario
// Muestra el salario mediano (dato principal), el número de ofertas y la
// media como contexto, y un aviso cuando la muestra es pequeña — antes
// job_count y avg_salary_eur se calculaban en el backend y se descartaban
// aquí sin usarse.
export function TooltipSalario({ active, payload, label, chartConfig }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="grid min-w-56 gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">Salario mediano anual en euros</p>
      {payload.map((entry) => {
        if (entry.value == null) return null;
        const meta = entry.payload?.[`${entry.dataKey}__meta`];
        const esMuestraPequeña =
          meta && meta.job_count < MUESTRA_PEQUEÑA_THRESHOLD;
        return (
          <div
            key={entry.dataKey}
            className="flex items-start justify-between gap-4"
          >
            <div className="flex items-center gap-1.5 pt-0.5">
              <div
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-muted-foreground">
                {chartConfig[entry.dataKey]?.label ?? entry.dataKey}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-medium tabular-nums">
                {Number(entry.value).toLocaleString("es-ES")} €/año
              </span>
              {meta && (
                <span className="text-[10px] text-muted-foreground/80">
                  {meta.job_count.toLocaleString("es-ES")}{" "}
                  {meta.job_count === 1 ? "oferta" : "ofertas"}
                  {meta.avg_salary_eur != null &&
                    ` · media ${meta.avg_salary_eur.toLocaleString("es-ES")} €`}
                </span>
              )}
              {esMuestraPequeña && (
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  ⚠ muestra pequeña
                </span>
              )}
            </div>
          </div>
        );
      })}
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
    (signal) => getSalaryByRoleAndCountry(filters, signal),
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
  // Roles ordenados por volumen real (job_count sumado entre países), no
  // por el orden de llegada de la API — ese orden responde al ORDER BY
  // del backend (país alfabético, salario descendente dentro de cada
  // país) y no tiene relación con qué roles son más demandados. Ver
  // rankRolesByVolume en roleLabels.js.
  const allRoles = rankRolesByVolume(rows);
  const data = pivotData(rows);

  // null → inicial (5 primeros por volumen) | [] → Ninguno | [...] → selección manual
  const [selectedRoles, setSelectedRoles] = useState(null);
  // "other" (cajón de sastre del clasificador NLP para títulos que no
  // encajan en ninguna categoría real) puede ser, con datos reales, el
  // rol con más volumen — pero no aporta información accionable como
  // "rol destacado" en la selección automática. Sigue disponible para
  // selección manual vía RoleSelector (allRoles no se filtra), solo deja
  // de ocupar uno de los 5 huecos por defecto.
  const effectiveSelected =
    selectedRoles === null
      ? allRoles.filter((r) => r !== "other").slice(0, 5)
      : selectedRoles.filter((r) => allRoles.includes(r));

  // Color semántico por rol: Backend siempre índigo, Data Science siempre
  // esmeralda, independientemente del orden en que lleguen de la API.
  const chartConfig = Object.fromEntries(
    allRoles.map((role) => [
      role,
      { label: getRoleLabel(role), color: getRoleColor(role) },
    ]),
  );

  // Color de los ticks de los ejes — tokens Halo resueltos con
  // getComputedStyle: Recharts renderiza los ticks como SVG <text> y no
  // puede leer variables CSS directamente, así que necesitamos el valor
  // concreto en el momento del render. El fallback cubre jsdom en tests.
  const isDark = useIsDark();
  const tickColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue(isDark ? "--color-text-primary" : "--color-text-secondary")
      .trim() || (isDark ? "#f5f6f8" : "#4b4b63");

  const notaContrato =
    filters.contrato !== "Todos"
      ? `Mostrando solo contratos "${(CONTRATO_LABELS[filters.contrato] ?? filters.contrato).toLowerCase()}". Los salarios varían entre contrato permanente y temporal.`
      : null;

  return (
    <ChartCard
      title="Salario mediano anual por rol y país"
      warning={getWarningNodes(filters, ["skillCategoria"], "salario")}
      loading={loading}
      isInitialLoad={isInitialLoad}
      error={error}
      slowHint="Esta consulta puede tardar 15-20 segundos incluso sin problemas — gracias por tu paciencia."
    >
      <ChartDescription
        description="Salario mediano anual en euros por tipo de rol y país. Cada grupo de barras es un país y cada barra es un rol. Solo se incluyen ofertas con salario declarado y verificado mayor de 1.000 €/año."
        filters={filters}
        totalJobs={totalJobs}
        excludeFilters={["skillCategoria"]}
        nota={[
          "Por defecto se muestran los 5 roles con más ofertas (sumando todos los países).",
          notaContrato,
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {rows.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground">
          No hay datos para los filtros seleccionados. Prueba a ampliar el
          periodo o quitar algún filtro.
        </p>
      ) : (
        <>
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
            <div className="chart-graph-area">
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <BarChart data={data} margin={{ left: 8, right: 8, top: 16 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="country"
                    tick={{ fontSize: 12, fill: tickColor }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: tickColor }}
                    width={56}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`}
                  />
                  <Tooltip
                    content={<TooltipSalario chartConfig={chartConfig} />}
                  />
                  {allRoles
                    .filter((role) => effectiveSelected.includes(role))
                    .map((role) => (
                      <Bar
                        key={role}
                        dataKey={role}
                        fill={getRoleColor(role)}
                        radius={[4, 4, 0, 0]}
                      >
                        {data.map((entry) => (
                          <Cell
                            key={`${role}-${entry.country}`}
                            fillOpacity={
                              (entry[`${role}__meta`]?.job_count ??
                                Infinity) < MUESTRA_PEQUEÑA_THRESHOLD
                                ? 0.45
                                : 1
                            }
                          />
                        ))}
                      </Bar>
                    ))}
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </>
      )}
    </ChartCard>
  );
}

export default SalaryChart;
