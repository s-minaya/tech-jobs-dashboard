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
