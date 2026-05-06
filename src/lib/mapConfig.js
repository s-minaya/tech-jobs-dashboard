import * as d3 from "d3";
import { offersByCountry } from "@/data/mockData";

// URL del dataset mundial en formato TopoJSON (110m = baja resolución, suficiente para este zoom)
export const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Códigos numéricos ISO 3166-1 de los países que queremos mostrar con color.
// El TopoJSON identifica cada país por su código numérico, no por el nombre ni el ISO-3.
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

// Conversión de ISO-3 (el que usa nuestra BD) a numérico (el que usa el TopoJSON).
// Necesario para cruzar los datos de ofertas con los datos geográficos.
export const ISO3_TO_NUMERIC = {
  DEU: "276",
  FRA: "250",
  ESP: "724",
  NLD: "528",
  POL: "616",
  ITA: "380",
  AUT: "040",
  BEL: "056",
};

// Lookup { codigoNumerico: nOfertas } para acceso O(1) al pintar cada país.
// Se calcula una vez aquí para no recalcularlo en cada render del componente.
export const offersByNumeric = Object.fromEntries(
  offersByCountry.map(({ iso, offers }) => [ISO3_TO_NUMERIC[iso], offers]),
);

// Valor máximo de ofertas, usado como techo de la escala de color.
export const maxOffers = Math.max(...offersByCountry.map((d) => d.offers));

// Escala de color continua: países con pocas ofertas → azul claro, muchas → azul oscuro.
// d3.scaleSequential mapea un valor numérico [0, maxOffers] a un color interpolado.
export const colorScale = d3
  .scaleSequential()
  .domain([0, maxOffers])
  .interpolator(d3.interpolate("#dbeafe", "#1d4ed8"));
