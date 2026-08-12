import { useState, useEffect } from "react";
import {
  useHeatmapData,
  DEFAULT_MAX_SKILLS,
  FILTERED_MAX,
} from "@/hooks/useHeatmapData";
import {
  selectSkills,
  filterSkillsWithCoOccurrence,
  buildLookup,
  buildJobCountMap,
  calcMaxPct,
} from "@/lib/heatmapUtils";
import ChartCard from "@/components/ui/ChartCard";
import ChartDescription, {
  getWarningNodes,
} from "@/components/ui/ChartDescription";
import HeatmapSvg from "@/components/Charts/HeatmapSvg";
import HeatmapLegend from "@/components/Charts/HeatmapLegend";
import { RiSmartphoneLine } from "react-icons/ri";

const FILTROS_IGNORADOS = ["pais", "contrato", "jornada", "remote"];

// useOrientation
// Devuelve true si el dispositivo está en landscape.
// Se actualiza automáticamente al girar el dispositivo.
// Solo activo en móvil — en desktop siempre devuelve true.
function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(orientation: landscape)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const handler = (e) => setIsLandscape(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isLandscape;
}

// RotatePrompt
// Mensaje animado que se muestra en móvil portrait.
// El icono del teléfono rota 90° en bucle para indicar al usuario
// que debe girar el dispositivo.
function RotatePrompt() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      {/* Smartphone que rota de vertical (0°) a horizontal (90°) y vuelve.
          RiSmartphoneLine tiene forma de móvil moderno.
          La animación pausada en 90° sugiere claramente el gesto de girar. */}
      <div
        className="text-primary"
        style={{ animation: "rotateMobile 2.5s ease-in-out infinite" }}
      >
        <RiSmartphoneLine className="h-12 w-12" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          Gira tu teléfono para ver la tabla
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Esta tabla necesita más espacio horizontal
        </p>
      </div>

      <style>{`
        @keyframes rotateMobile {
          0%   { transform: rotate(0deg);   }   /* vertical — posición inicial */
          35%  { transform: rotate(-90deg); }   /* horizontal — giro completado */
          65%  { transform: rotate(-90deg); }   /* pausa en horizontal */
          100% { transform: rotate(0deg);   }   /* vuelve a vertical */
        }
      `}</style>
    </div>
  );
}

// SkillHeatmap
// En móvil portrait muestra el mensaje de rotar el dispositivo.
// En landscape (móvil girado) y en desktop muestra la tabla normal.
// El cambio es automático al girar — no hace falta recargar.
function SkillHeatmap({ filters }) {
  const raw = filters?.skillCategoria ?? "Todas";
  const categoria = raw === "Todas" ? "todas" : raw.toLowerCase();
  const filtrosHeatmap = { periodo: filters.periodo };
  const isLandscape = useOrientation();

  const {
    pairs,
    totalJobs,
    skillsData,
    allSkillsData,
    loadingPairs,
    loadingSkills,
    error,
  } = useHeatmapData(categoria, filtrosHeatmap);

  const maxN = categoria === "todas" ? DEFAULT_MAX_SKILLS : FILTERED_MAX;
  // Primero seleccionamos las top N skills por popularidad, luego
  // filtramos para quedarnos solo con las que tienen conectividad mínima
  // real dentro del conjunto (por defecto: al menos 2 skills distintas
  // con co-ocurrencia real, respaldada por al menos 2 ofertas cada una)
  // — evita filas/columnas vacías o con una única coincidencia residual.
  const skillsCandidatas = selectSkills(skillsData, categoria, maxN);
  const skills = filterSkillsWithCoOccurrence(skillsCandidatas, pairs);
  const combinedSkills = [...allSkillsData, ...skillsData];
  const jobCountMap = buildJobCountMap(combinedSkills);
  const lookup = buildLookup(pairs, skills);
  const maxPct = calcMaxPct(skills, lookup, jobCountMap);
  const hasPairs = pairs.length > 0;

  // En móvil portrait mostramos el prompt de rotar.
  // window.innerWidth < 768 es el breakpoint md de Tailwind.
  const isMobilePortrait =
    typeof window !== "undefined" && window.innerWidth < 768 && !isLandscape;

  return (
    <ChartCard
      title="Co-ocurrencia de skills en ofertas de empleo"
      warning={getWarningNodes(
        filters,
        ["pais", "contrato", "jornada", "remote"],
        "heatmap",
      )}
      loading={loadingPairs || loadingSkills}
      isInitialLoad={loadingPairs}
      error={error}
    >
      <ChartDescription
        description="Muestra qué skills aparecen juntas en las mismas ofertas. Cada celda indica el porcentaje de ofertas que piden la skill de la fila y también piden la skill de la columna. Verde = aparecen juntas frecuentemente, rojo = raramente. Pasa el ratón sobre cualquier celda para ver el porcentaje en ambas direcciones."
        filters={filters}
        totalJobs={totalJobs}
        excludeFilters={FILTROS_IGNORADOS}
      />

      {/* En móvil portrait: prompt de rotar */}
      {isMobilePortrait ? (
        <RotatePrompt />
      ) : (
        <>
          {skills.length > 0 && (
            <p className="mb-3 text-xs text-muted-foreground">
              {loadingSkills ? (
                "Actualizando..."
              ) : (
                <>
                  Mostrando{" "}
                  <strong className="font-medium text-foreground">
                    {skills.length}
                  </strong>{" "}
                  skills
                  {categoria !== "todas" ? (
                    <span>
                      {" "}
                      de la categoría <em>{categoria}</em>
                    </span>
                  ) : (
                    <span> (las más populares globalmente)</span>
                  )}
                  .
                </>
              )}
            </p>
          )}

          {!loadingSkills && skills.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay skills para esta categoría con los filtros actuales.
            </p>
          )}

          {hasPairs && (
            <div className="chart-graph-area">
              <HeatmapSvg
                skills={skills}
                lookup={lookup}
                jobCountMap={jobCountMap}
              />
            </div>
          )}

          {skills.length > 0 && !loadingSkills && (
            <HeatmapLegend maxPct={maxPct} />
          )}
        </>
      )}
    </ChartCard>
  );
}

export default SkillHeatmap;
