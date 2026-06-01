// URL del dataset mundial en formato TopoJSON.
// 110m = baja resolución, suficiente para este nivel de zoom en Europa.
export const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Códigos numéricos ISO 3166-1 de los países que queremos colorear.
// El TopoJSON identifica cada país por su código numérico, no por el nombre ni ISO-2.
export const INCLUDED_ISO_NUMERIC = new Set([
  "276", // DE
  "250", // FR
  "724", // ES
  "528", // NL
  "616", // PL
  "380", // IT
  "040", // AT
  "056", // BE
]);

// Conversión de country_code de la BD (2 letras, minúsculas) al código
// numérico que usa el TopoJSON. Necesario para cruzar ambas fuentes de datos.
export const COUNTRY_CODE_TO_NUMERIC = {
  de: "276",
  fr: "250",
  es: "724",
  nl: "528",
  pl: "616",
  it: "380",
  at: "040",
  be: "056",
};

// Conversión inversa: de código numérico a country_code de dos letras.
// La usamos para saber qué país corresponde a un path del SVG al hacer hover.
export const NUMERIC_TO_COUNTRY_CODE = Object.fromEntries(
  Object.entries(COUNTRY_CODE_TO_NUMERIC).map(([code, num]) => [num, code]),
);

// Nombre legible de cada país para mostrarlo en el tooltip del mapa.
export const COUNTRY_NAMES = {
  de: "Alemania",
  fr: "Francia",
  es: "España",
  nl: "Países Bajos",
  pl: "Polonia",
  it: "Italia",
  at: "Austria",
  be: "Bélgica",
};

// Colores para la escala del mapa coroplético.
// Usamos d3.interpolateYlGn (amarillo → verde oscuro), que es un subconjunto
// de la misma familia RdYlGn que usa el heatmap de skills.
// Esto da consistencia visual: ambas gráficas usan la misma paleta D3.
// No usamos rojo en el extremo inferior porque pocas ofertas no es "malo",
// solo significa menos datos. Amarillo transmite "hay algo" sin negatividad.
export const MAP_COLOR_INTERPOLATOR = "YlGn"; // nombre de la paleta D3

// Color de resaltado para el país seleccionado en el sidebar.
// Usamos la variable CSS del sistema de diseño para que respete el tema.
export const SELECTED_COUNTRY_STROKE = "var(--primary)";
export const SELECTED_COUNTRY_STROKE_WIDTH = 2.5;
export const UNSELECTED_OPACITY_WHEN_FILTERED = 0.45;
