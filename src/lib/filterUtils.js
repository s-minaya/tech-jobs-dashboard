// filterUtils.js
// Utilidades compartidas por todos los charts para trabajar con los filtros.

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

// PERIODO_DEFAULT
// El periodo que useFilters usa como estado inicial.
// describeFiltros lo trata como "sin filtro activo": si el usuario
// no ha cambiado el periodo, no tiene sentido mostrarlo como filtro activo.
// Centralizado aquí para que si cambia el default, solo haya que tocarlo
// en un sitio y tanto useFilters como describeFiltros queden sincronizados.
export const PERIODO_DEFAULT = "Últimos 90 días";

// describeFiltros
// Convierte el objeto de filtros en un array de strings legibles.
// Solo incluye los filtros que difieren de su valor neutro.
// excludeKeys: array de claves a omitir aunque estén activas.
export function describeFiltros(filters, excludeKeys = []) {
  const partes = [];

  if (!excludeKeys.includes("pais") && filters.pais && filters.pais !== "Todos")
    partes.push(NOMBRES_PAISES[filters.pais] ?? filters.pais);

  // El periodo solo se omite si coincide con el default o no está definido.
  if (
    !excludeKeys.includes("periodo") &&
    filters.periodo &&
    filters.periodo !== PERIODO_DEFAULT
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
