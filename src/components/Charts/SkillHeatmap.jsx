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
import HeatmapSvg from "@/components/Charts/HeatmapSvg";
import HeatmapLeyenda from "@/components/Charts/HeatmapLeyenda";

// SkillHeatmap
// Componente principal del heatmap. Ensambla las piezas:
//   Datos      → useHeatmapData
//   Datos→SVG  → heatmapUtils (selectSkills, buildLookup, buildJobCountMap, calcMaxPct)
//   SVG D3     → HeatmapSvg
//   Leyenda    → HeatmapLeyenda
//   Marco      → ChartCard
function SkillHeatmap({ filters }) {
  // Convertimos el valor del sidebar a minúsculas directamente como valor derivado,
  // sin useState ni useEffect. Esto evita el render intermedio que causaba que
  // skills.length fuera 0 y HeatmapSvg se desmontara, lo que movía el scroll.
  // "Database" → "database", "Todas" o undefined → "todas"
  const raw = filters?.skillCategoria ?? "Todas";
  const categoria = raw === "Todas" ? "todas" : raw.toLowerCase();

  const {
    pairs,
    skillsData,
    allSkillsData,
    loadingPairs,
    loadingSkills,
    error,
  } = useHeatmapData(categoria);

  // Número máximo de skills a mostrar según si hay filtro activo o no.
  const maxN = categoria === "todas" ? DEFAULT_MAX_SKILLS : FILTERED_MAX;

  // Lista de nombres de skills a mostrar en los ejes del heatmap.
  const skills = selectSkills(skillsData, categoria, maxN);

  // Combinamos los datos globales con los de la categoría activa para que
  // jobCountMap tenga el job_count correcto de cualquier skill que aparezca,
  // independientemente de si está en el conjunto filtrado o no.
  const combinedSkillsData = [...allSkillsData, ...skillsData];
  const jobCountMap = buildJobCountMap(combinedSkillsData);

  // lookup: pares de co-ocurrencia entre las skills visibles.
  // maxPct: porcentaje máximo real, usado como extremo de la escala de color.
  const lookup = buildLookup(pairs, skills);
  const maxPct = calcMaxPct(skills, lookup, jobCountMap);

  // hasPairs: true en cuanto tenemos pares cargados, aunque skillsData aún esté actualizando.
  // Permite mantener HeatmapSvg en el DOM desde la primera carga en adelante,
  // evitando que el componente se monte y desmonte al cambiar de categoría.
  const hasPairs = pairs.length > 0;

  return (
    <ChartCard
      title="Co-ocurrencia de skills en ofertas de empleo"
      loading={loadingPairs}
      error={error}
    >
      {/* Bloque explicativo fijo — no depende de ningún estado de carga */}
      <div className="mb-4 space-y-1.5 rounded-md bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          <strong className="font-semibold text-foreground">
            Cómo leer la tabla:
          </strong>{" "}
          Cada celda muestra el porcentaje de ofertas que piden la skill de la{" "}
          <strong className="font-medium text-foreground">fila</strong> y que
          también piden la skill de la{" "}
          <strong className="font-medium text-foreground">columna</strong>. Pasa
          el ratón sobre cualquier celda para ver el porcentaje en ambas
          direcciones.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Nota:</strong> Los
          filtros de país y periodo no afectan a esta gráfica (datos globales).
          Usa el filtro <em>Categoría de skills</em> del panel lateral para
          explorar por tipo de tecnología.
        </p>
      </div>

      {/* Línea de estado: cuántas skills se muestran o que está actualizando */}
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
            </>
          )}
        </p>
      )}

      {/* Mensaje cuando no hay skills para la categoría seleccionada */}
      {!loadingSkills && skills.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay skills para esta categoría.
        </p>
      )}

      {/*
        HeatmapSvg se renderiza en cuanto hasPairs es true y se mantiene
        en el DOM durante todos los cambios de categoría posteriores.
        El prop `loading` reduce su opacidad mientras se actualizan los datos,
        pero nunca lo desmonta, evitando que el layout cambie de tamaño
        y el browser suba el scroll al mapa de Europa.
      */}
      {hasPairs && (
        <HeatmapSvg
          skills={skills}
          lookup={lookup}
          jobCountMap={jobCountMap}
          loading={loadingSkills}
        />
      )}

      {/* Leyenda de colores, solo visible cuando los datos están listos */}
      {skills.length > 0 && !loadingSkills && (
        <HeatmapLeyenda maxPct={maxPct} />
      )}
    </ChartCard>
  );
}

export default SkillHeatmap;
