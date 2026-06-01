import { describeFiltros } from "@/lib/filterUtils";

// NOTAS_FILTROS_IGNORADOS
// Explica por qué un filtro no aplica a una gráfica concreta.
// Cada entrada puede ser un string fijo o una función que recibe
// el contexto (nombre de la gráfica) para dar una explicación específica.
//
// Se muestran solo cuando el filtro está activo (distinto del valor por defecto).
const NOTAS_FILTROS_IGNORADOS = {
  jornada:
    "El filtro de jornada no afecta a esta gráfica: los datos no cambian significativamente entre ofertas a tiempo completo o parcial para lo que aquí se muestra.",
  skillCategoria: "El filtro de categoría de skill no afecta a esta gráfica.",
  // pais es una función porque el texto varía según el contexto de la gráfica.
  // El mapa muestra todos los países pero resalta el seleccionado, así que
  // el mensaje debe explicar eso en lugar de hablar de co-ocurrencias.
  pais: (contexto) => {
    if (contexto === "mapa") {
      return "El filtro de país no oculta los demás países del mapa: el mapa siempre muestra todos para que puedas comparar el volumen entre países. El país seleccionado se resalta con un borde blanco.";
    }
    // Contexto por defecto: co-ocurrencia de skills
    return "El filtro de país no restringe esta gráfica. Los datos se calculan sobre todos los países a la vez para tener suficiente volumen — con un solo país quedarían tan pocas co-ocurrencias que los porcentajes no serían representativos.";
  },
  contrato:
    "El filtro de tipo de contrato no afecta a esta gráfica. Se necesitan datos de todos los contratos para que las co-ocurrencias entre skills sean estadísticamente fiables.",
  remote:
    "El filtro de remoto no afecta a esta gráfica. Separar entre ofertas remotas y presenciales dejaría muy pocos datos y los porcentajes perderían representatividad.",
};

// ChartDescription
// Bloque informativo reutilizable en todos los charts.
// Muestra:
//   1. Descripción de qué representa la gráfica y cómo leerla
//   2. Total de ofertas que cumplen los filtros actuales
//   3. Filtros activos (solo los que aplican a esta gráfica)
//   4. Avisos ⚠ de filtros que el usuario tiene activos pero esta gráfica ignora,
//      con una explicación de por qué no tienen efecto aquí
//
// Props:
//   description    → texto explicando qué muestra la gráfica
//   filters        → objeto completo de filtros del sidebar
//   totalJobs      → número de ofertas que cumplen los filtros, o null
//   nota           → texto adicional opcional
//   excludeFilters → array de keys de filtro que esta gráfica ignora
//   contexto       → string identificador de la gráfica, para personalizar
//                    los avisos cuando el mismo filtro se ignora por razones
//                    distintas en gráficas distintas (ej: "mapa", "heatmap")
function ChartDescription({
  description,
  filters,
  totalJobs,
  nota,
  excludeFilters = [],
  contexto = "",
}) {
  const filtrosActivos = describeFiltros(filters, excludeFilters);

  // Detectamos qué filtros excluidos están activos para mostrar el aviso.
  const avisosIgnorados = excludeFilters.filter((key) => {
    if (key === "pais") return filters.pais && filters.pais !== "Todos";
    if (key === "jornada")
      return filters.jornada && filters.jornada !== "Todos";
    if (key === "contrato")
      return filters.contrato && filters.contrato !== "Todos";
    if (key === "remote") return filters.remote && filters.remote !== "Todos";
    if (key === "skillCategoria")
      return filters.skillCategoria && filters.skillCategoria !== "Todas";
    return false;
  });

  return (
    <div className="mb-4 space-y-1.5 rounded-md bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
      <p>{description}</p>

      {totalJobs != null && (
        <p>
          <strong className="font-medium text-foreground">
            {Number(totalJobs).toLocaleString("es-ES")} ofertas
          </strong>{" "}
          cumplen los filtros actuales.
        </p>
      )}

      {filtrosActivos.length > 0 ? (
        <p>
          <strong className="font-medium text-foreground">
            Filtros activos:
          </strong>{" "}
          {filtrosActivos.join(" · ")}
        </p>
      ) : (
        <p>
          Mostrando datos globales — todos los países, contratos y periodos.
        </p>
      )}

      {avisosIgnorados.map((key) => {
        const entrada = NOTAS_FILTROS_IGNORADOS[key];
        // Si la nota es una función, la llamamos con el contexto de la gráfica
        const texto =
          typeof entrada === "function" ? entrada(contexto) : entrada;
        return texto ? (
          <p
            key={key}
            className="flex items-start gap-1.5 text-amber-600 dark:text-amber-500"
          >
            <span className="shrink-0">⚠</span>
            <span>{texto}</span>
          </p>
        ) : null;
      })}

      {nota && <p className="text-muted-foreground/70">{nota}</p>}
    </div>
  );
}

export default ChartDescription;
