import { describeFiltros } from "@/lib/filterUtils";
import FilterWarningPopover from "@/components/ui/FilterWarningPopover";

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
  pais: (contexto) => {
    if (contexto === "mapa") {
      return "El filtro de país no oculta los demás países del mapa: el mapa siempre muestra todos para que puedas comparar el volumen entre países. El país seleccionado se resalta con un borde blanco.";
    }
    return "El filtro de país no restringe esta gráfica. Los datos se calculan sobre todos los países a la vez para tener suficiente volumen — con un solo país quedarían tan pocas co-ocurrencias que los porcentajes no serían representativos.";
  },
  contrato:
    "El filtro de tipo de contrato no afecta a esta gráfica. Se necesitan datos de todos los contratos para que las co-ocurrencias entre skills sean estadísticamente fiables.",
  remote:
    "El filtro de remoto no afecta a esta gráfica. Separar entre ofertas remotas y presenciales dejaría muy pocos datos y los porcentajes perderían representatividad.",
};

// ChartDescription
// Bloque informativo reutilizable en todos los charts.
// Diseño con pills/badges en lugar de párrafo plano.
//
// Los avisos de filtros ignorados ya no se muestran inline —
// aparecen como un icono ⓘ que abre un popover. El usuario puede
// descartarlos con "Entendido" y no vuelven a aparecer (localStorage).
//
// Props:
//   description    → texto explicando qué muestra la gráfica
//   filters        → objeto completo de filtros del sidebar
//   totalJobs      → número de ofertas que cumplen los filtros, o null
//   nota           → texto adicional opcional
//   excludeFilters → array de keys de filtro que esta gráfica ignora
//   contexto       → string identificador de la gráfica
function ChartDescription({
  description,
  filters,
  totalJobs,
  nota,
  excludeFilters = [],
  contexto = "",
}) {
  const filtrosActivos = describeFiltros(filters, excludeFilters);

  // Avisos: filtros que el usuario tiene activos pero esta gráfica ignora
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
    <div className="mb-4 space-y-2.5 text-xs">
      {/* Descripción principal */}
      <p className="leading-relaxed text-muted-foreground">{description}</p>

      {/* Fila de pills — ofertas + filtros activos + iconos de aviso */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Badge de ofertas — destacado con color primary sutil */}
        {totalJobs != null && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/20">
            {Number(totalJobs).toLocaleString("es-ES")} ofertas
          </span>
        )}

        {/* Pills de filtros activos */}
        {filtrosActivos.map((f) => (
          <span
            key={f}
            className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground ring-1 ring-border"
          >
            {f}
          </span>
        ))}

        {/* Pill de datos globales cuando no hay filtros */}
        {filtrosActivos.length === 0 && totalJobs == null && (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
            Todos los países · todos los periodos
          </span>
        )}

        {/* Iconos de aviso — uno por filtro ignorado activo.
            Cada uno abre su propio popover con la explicación. */}
        {avisosIgnorados.map((key) => {
          const entrada = NOTAS_FILTROS_IGNORADOS[key];
          const texto =
            typeof entrada === "function" ? entrada(contexto) : entrada;
          return texto ? (
            <FilterWarningPopover
              key={key}
              filterKey={key}
              contexto={contexto}
              texto={texto}
            />
          ) : null;
        })}
      </div>

      {nota && <p className="text-muted-foreground/60 italic">{nota}</p>}
    </div>
  );
}

export default ChartDescription;
