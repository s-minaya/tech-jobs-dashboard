import * as d3 from "d3";
import { skillCoOccurrence, coOccurrenceSkills } from "@/data/mockData";

// Lookup { "Python|SQL": 2341 } para acceso O(1) al pintar cada celda.
// La clave es "skill|coSkill" para evitar colisiones con nombres compuestos.
export const coOccurrenceLookup = Object.fromEntries(
  skillCoOccurrence.map(({ skill, coSkill, count }) => [
    `${skill}|${coSkill}`,
    count,
  ]),
);

const maxCount = Math.max(...skillCoOccurrence.map((d) => d.count));

// Escala de color: 0 co-ocurrencias → gris neutro, máximo → azul oscuro.
// Usamos scaleSequential con un umbral en 0 para distinguir
// "nunca aparecen juntas" de "pocas veces juntas".
export const heatmapColorScale = d3
  .scaleSequential()
  .domain([0, maxCount])
  .interpolator(d3.interpolate("#e2e8f0", "#1d4ed8"));

export { coOccurrenceSkills, maxCount };
