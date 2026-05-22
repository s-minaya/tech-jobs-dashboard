// ─────────────────────────────────────────────────────────────────────────────
// Funciones puras de transformación de datos para el SkillHeatmap.
// "Puras" significa que no tienen efectos secundarios: dado el mismo input,
// siempre devuelven el mismo output. Eso las hace fáciles de entender y testear.
//
// Las separamos del componente para que SkillHeatmap.jsx sea más corto y legible,
// y para que estas utilidades sean importables desde otros sitios si hiciera falta.
// ─────────────────────────────────────────────────────────────────────────────

import * as d3 from "d3";

/**
 * selectSkills
 * Filtra el array de skills por categoría y devuelve los primeros N nombres.
 *
 * @param {Array}  skillsData - Datos de /api/skills/top: [{ skill, skill_category, ... }]
 * @param {string} categoria  - "todas" | "database" | "language" | ...
 * @param {number} maxN       - Cuántas skills devolver como máximo
 * @returns {string[]}        - Ej: ["SQL", "Python", "Java"]
 */
export function selectSkills(skillsData, categoria, maxN) {
  const filtered =
    categoria === "todas"
      ? skillsData
      : skillsData.filter((s) => s.skill_category === categoria);

  return filtered.slice(0, maxN).map((s) => s.skill);
}

/**
 * buildLookup
 * Diccionario de co-ocurrencias para acceso O(1).
 * Clave: "skillA|skillB". Guardamos ambas direcciones porque la
 * co-ocurrencia en valor absoluto es simétrica.
 *
 * @param {Array}    pairs  - [{ skill, co_skill, co_count }]
 * @param {string[]} skills - Skills visibles (filtramos pares fuera de esta lista)
 * @returns {Object}        - { "Java|Spring": 294, "Spring|Java": 294, ... }
 */
export function buildLookup(pairs, skills) {
  const skillSet = new Set(skills);
  const lookup = {};

  for (const { skill, co_skill, co_count } of pairs) {
    if (!skillSet.has(skill) || !skillSet.has(co_skill)) continue;
    const count = Number(co_count);
    lookup[`${skill}|${co_skill}`] = count;
    lookup[`${co_skill}|${skill}`] = count;
  }

  return lookup;
}

/**
 * buildJobCountMap
 * Diccionario con el total de ofertas por skill.
 * Se usa como denominador: pct(A→B) = co_count(A,B) / job_count(A) × 100
 *
 * @param {Array} skillsData - [{ skill, job_count }]
 * @returns {Object}         - { "Java": 1790, "Python": 2065, ... }
 */
export function buildJobCountMap(skillsData) {
  const map = {};
  for (const { skill, job_count } of skillsData) {
    map[skill] = Number(job_count);
  }
  return map;
}

/**
 * formatPct
 * Calcula y formatea el porcentaje como string.
 * Devuelve "—" si no hay datos o el denominador es 0.
 *
 * @param {number} coCount   - Co-ocurrencias de las dos skills
 * @param {number} jobCountA - Total de ofertas con la skill A (denominador)
 * @returns {string}         - "16.4%" | "—"
 */
export function formatPct(coCount, jobCountA) {
  if (!jobCountA || coCount === 0) return "—";
  return ((coCount / jobCountA) * 100).toFixed(1) + "%";
}

/**
 * calcMaxPct
 * Porcentaje más alto entre todos los pares visibles del triángulo inferior.
 * Lo usa D3 como extremo superior del dominio de la escala de color.
 * Escalamos al máximo real (no 100%) para que las diferencias sean visibles.
 *
 * @param {string[]} skills      - Skills visibles
 * @param {Object}   lookup      - Diccionario de co-ocurrencias
 * @param {Object}   jobCountMap - Total de ofertas por skill
 * @returns {number}             - Mínimo 1 para evitar dominio [0, 0]
 */
export function calcMaxPct(skills, lookup, jobCountMap) {
  let maxPct = 0;
  const n = skills.length;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      const co = lookup[`${skills[i]}|${skills[j]}`] ?? 0;
      const jc = jobCountMap[skills[i]] ?? 1;
      const pct = (co / jc) * 100;
      if (pct > maxPct) maxPct = pct;
    }
  }

  return maxPct === 0 ? 1 : maxPct;
}

/**
 * getHeatmapTextColor
 * Devuelve "#1e293b" (oscuro) o "#ffffff" (claro) según la luminancia
 * del color de fondo, para que el texto sea siempre legible.
 *
 * Fórmula estándar de luminancia relativa WCAG:
 *   L = 0.2126·R + 0.7152·G + 0.0722·B   (valores normalizados 0-1)
 *
 * @param {string} bgColorHex - Color hexadecimal o cualquier string que entienda d3.color
 * @returns {string}          - "#1e293b" | "#ffffff"
 */
export function getHeatmapTextColor(bgColorHex) {
  const rgb = d3.color(bgColorHex);
  if (!rgb) return "#1e293b"; // fallback seguro si d3 no parsea el color

  const lum =
    0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);

  return lum > 0.55 ? "#1e293b" : "#ffffff";
}
