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

// CONTRATO_LABELS
// El backend usa los valores crudos del CHECK de Postgres ('permanent'/
// 'contract'), y el filtro del sidebar expone esos mismos valores en
// inglés (config/filters.js) porque coinciden 1:1 con la API. Mapeo a
// español para pills, notas y sidebar — mismo patrón que NOMBRES_PAISES.
// Antes de esto, la nota de SalaryChart mezclaba idiomas: "contratos
// 'contract'. Los salarios varían entre contrato permanente y temporal."
// Valores en mayúscula inicial (fase 013): antes estaban en minúscula
// porque solo se usaban dentro de la frase de la pill ("contrato
// permanente") — al reutilizar este mismo mapa para los chips del
// sidebar (OPTION_LABELS), necesitan la misma forma "lista para chip"
// que los otros 3 mapas (NOMBRES_PAISES, JORNADA_LABELS,
// SKILL_CATEGORIA_LABELS, todos capitalizados). describeFiltros pasa a
// hacer el .toLowerCase() explícito en el punto de uso, no aquí.
export const CONTRATO_LABELS = {
  Permanent: "Permanente",
  Contract: "Temporal",
};

// SKILL_CATEGORIA_LABELS
// El backend usa los valores crudos de skills.category (CHECK de Postgres,
// en inglés y minúsculas), y el filtro del sidebar expone esas mismas
// opciones en inglés (config/filters.js) porque coinciden 1:1 con la API
// — mismo patrón que NOMBRES_PAISES/CONTRATO_LABELS. Framework/Cloud se
// dejan igual (préstamos ya asentados en español técnico, como
// "backend"/"frontend" en el resto de la app); el resto se traduce.
export const SKILL_CATEGORIA_LABELS = {
  Language: "Lenguaje",
  Framework: "Framework",
  Cloud: "Cloud",
  Database: "Base de datos",
  Tool: "Herramienta",
  Methodology: "Metodología",
};

// JORNADA_LABELS
// Mismo patrón que CONTRATO_LABELS. A diferencia de los otros tres
// mapas, hasta ahora no existía ninguno para jornada — describeFiltros
// se limitaba a un `.toLowerCase()` del valor crudo, así que la pill de
// un filtro de jornada activo decía literalmente "full time" (inglés,
// minúsculas). Corregido a la vez que se añade este mapa.
export const JORNADA_LABELS = {
  "Full time": "Jornada completa",
  "Part time": "Jornada parcial",
};

// OPTION_LABELS
// Unión de los 4 mapas anteriores — pensado para FilterSection.jsx, que
// no sabe de qué filtro se trata (solo recibe `options` genéricas) y
// necesita traducir el texto visible de CUALQUIER opción reconocible sin
// que le digan explícitamente "esto es país" o "esto es jornada". Mismo
// truco que ya usa OPTION_ICONS en FilterSection.jsx (objeto plano
// indexado por el valor crudo). Sin colisiones de claves entre los 4
// mapas — confirmado (códigos de país, "Permanent"/"Contract", "Full
// time"/"Part time" y las categorías de skill no se solapan).
export const OPTION_LABELS = {
  ...NOMBRES_PAISES,
  ...CONTRATO_LABELS,
  ...JORNADA_LABELS,
  ...SKILL_CATEGORIA_LABELS,
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
    partes.push(
      `contrato ${(CONTRATO_LABELS[filters.contrato] ?? filters.contrato).toLowerCase()}`,
    );

  if (
    !excludeKeys.includes("jornada") &&
    filters.jornada &&
    filters.jornada !== "Todos"
  )
    partes.push(
      (JORNADA_LABELS[filters.jornada] ?? filters.jornada).toLowerCase(),
    );

  if (!excludeKeys.includes("remote")) {
    if (filters.remote === "Sí") partes.push("solo remoto");
    if (filters.remote === "No") partes.push("excluye remoto");
  }

  if (
    !excludeKeys.includes("skillCategoria") &&
    filters.skillCategoria &&
    filters.skillCategoria !== "Todas"
  )
    partes.push(
      `categoría de skill: ${(
        SKILL_CATEGORIA_LABELS[filters.skillCategoria] ?? filters.skillCategoria
      ).toLowerCase()}`,
    );

  return partes;
}

// NEUTRAL_FILTERS
// Valores neutros de cada filtro — mismos que initialFilters en useFilters.
// Centralizado aquí (y no repetido en cada componente) para que
// activeFilterCount use siempre PERIODO_DEFAULT y nunca se desincronice
// si cambia el valor por defecto del periodo.
const NEUTRAL_FILTERS = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

// activeFilterCount
// Cuenta cuántos filtros están en un valor distinto al neutro.
// Usado por los badges de DesktopFilterSidebar y BottomNav para
// mostrar cuántos filtros tiene activos el usuario.
export function activeFilterCount(filters) {
  if (!filters) return 0;
  return Object.entries(filters).filter(
    ([key, value]) => value !== NEUTRAL_FILTERS[key],
  ).length;
}
