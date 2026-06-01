// Utilidades compartidas por todos los charts para trabajar con los filtros.

// Nombres de países en español para mostrar al usuario.
export const NOMBRES_PAISES = {
  DE: "Alemania",
  FR: "Francia",
  ES: "España",
  NL: "Países Bajos",
  PL: "Polonia",
  IT: "Italia",
  AT: "Austria",
  BE: "Bélgica",
};

// Convierte el objeto de filtros en un array de strings legibles.
// Solo incluye los filtros que difieren del valor por defecto.
//
// excludeKeys: array de claves a omitir aunque estén activas.
// Lo usan los charts que no aplican ciertos filtros (ej: SalaryChart
// ignora skillCategoria porque el salario no depende de la skill).
export function describeFiltros(filters, excludeKeys = []) {
  const partes = [];

  if (!excludeKeys.includes("pais") && filters.pais && filters.pais !== "Todos")
    partes.push(NOMBRES_PAISES[filters.pais] ?? filters.pais);

  if (
    !excludeKeys.includes("periodo") &&
    filters.periodo &&
    filters.periodo !== "Últimos 30 días"
  )
    partes.push(filters.periodo.toLowerCase());

  if (
    !excludeKeys.includes("contrato") &&
    filters.contrato &&
    filters.contrato !== "Todos"
  )
    partes.push(`contrato ${filters.contrato.toLowerCase()}`);

  if (
    !excludeKeys.includes("jornada") &&
    filters.jornada &&
    filters.jornada !== "Todos"
  )
    partes.push(filters.jornada.toLowerCase().replace("_", " "));

  if (!excludeKeys.includes("remote")) {
    if (filters.remote === "Sí") partes.push("solo remoto");
    if (filters.remote === "No") partes.push("excluye remoto");
  }

  if (
    !excludeKeys.includes("skillCategoria") &&
    filters.skillCategoria &&
    filters.skillCategoria !== "Todas"
  )
    partes.push(`categoría de skill: ${filters.skillCategoria.toLowerCase()}`);

  return partes;
}
