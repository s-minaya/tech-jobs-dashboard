import {
  useHeatmapData,
  DEFAULT_MAX_SKILLS,
  FILTERED_MAX,
} from "@/hooks/useHeatmapData";
import {
  selectSkills,
  buildLookup,
  buildJobCountMap,
  calcMaxPct,
} from "@/lib/heatmapUtils";
import ChartCard from "@/components/ui/ChartCard";
import ChartDescription from "@/components/ui/ChartDescription";
import HeatmapSvg from "@/components/Charts/HeatmapSvg";
import HeatmapLeyenda from "@/components/Charts/HeatmapLeyenda";

// Filtros que esta gráfica ignora.
// Se pasan a ChartDescription para dos cosas:
//   1. No mostrarlos en "Filtros activos"
//   2. Mostrar un aviso ⚠ si el usuario los tiene activos, explicando por qué no tienen efecto
const FILTROS_IGNORADOS = ["pais", "contrato", "jornada", "remote"];

// SkillHeatmap
// Heatmap de co-ocurrencia de skills en ofertas de empleo.
// Muestra qué tecnologías aparecen juntas frecuentemente en las mismas ofertas.
//
// Filtros que aplican: periodo, categoría de skill.
// El resto no aplican porque las co-ocurrencias se calculan sobre el conjunto
// global de ofertas para tener suficiente masa estadística. Con filtros
// restrictivos (un país, un tipo de contrato) quedarían tan pocas ofertas
// que los porcentajes dejarían de ser representativos.
function SkillHeatmap({ filters }) {
  const raw = filters?.skillCategoria ?? "Todas";
  const categoria = raw === "Todas" ? "todas" : raw.toLowerCase();

  // Solo pasamos periodo al hook porque es el único filtro que afecta
  // a los pares de co-ocurrencia. País, contrato, jornada y remote
  // se descartan en jobServices antes de llegar al backend.
  const filtrosHeatmap = { periodo: filters.periodo };

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
  const skills = selectSkills(skillsData, categoria, maxN);
  const combinedSkills = [...allSkillsData, ...skillsData];
  const jobCountMap = buildJobCountMap(combinedSkills);
  const lookup = buildLookup(pairs, skills);
  const maxPct = calcMaxPct(skills, lookup, jobCountMap);
  const hasPairs = pairs.length > 0;

  return (
    <ChartCard
      title="Co-ocurrencia de skills en ofertas de empleo"
      loading={loadingPairs}
      isInitialLoad={loadingPairs}
      error={error}
    >
      <ChartDescription
        description="Muestra qué skills aparecen juntas en las mismas ofertas. Cada celda indica el porcentaje de ofertas que piden la skill de la fila y también piden la skill de la columna. Verde = aparecen juntas frecuentemente, rojo = raramente. Pasa el ratón sobre cualquier celda para ver el porcentaje en ambas direcciones."
        // Pasamos filters completo para que ChartDescription pueda detectar
        // qué filtros ignorados están activos y mostrar el aviso ⚠ correspondiente.
        filters={filters}
        totalJobs={totalJobs}
        excludeFilters={FILTROS_IGNORADOS}
      />

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
        <HeatmapSvg
          skills={skills}
          lookup={lookup}
          jobCountMap={jobCountMap}
          loading={loadingSkills}
        />
      )}

      {skills.length > 0 && !loadingSkills && (
        <HeatmapLeyenda maxPct={maxPct} />
      )}
    </ChartCard>
  );
}

export default SkillHeatmap;
