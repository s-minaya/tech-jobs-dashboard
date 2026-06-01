import * as d3 from "d3";

// selectSkills
// Filtra el array de skills por categoría, elimina duplicados y devuelve
// los primeros N nombres.
//
// La deduplicación con Set es necesaria porque la API puede devolver
// la misma skill en varias filas (por ejemplo si la vista de BD tiene
// un registro por role_category). Sin deduplicar, el SVG renderizaría
// la misma skill como fila y columna dos veces.
export function selectSkills(skillsData, categoria, maxN) {
  const filtered =
    categoria === "todas"
      ? skillsData
      : skillsData.filter((s) => s.skill_category === categoria);

  // Set para eliminar duplicados manteniendo el orden de aparición.
  const seen = new Set();
  const unique = [];
  for (const s of filtered) {
    if (!seen.has(s.skill)) {
      seen.add(s.skill);
      unique.push(s.skill);
    }
  }

  return unique.slice(0, maxN);
}

// buildLookup
// Diccionario de co-ocurrencias para acceso O(1).
// Clave: "skillA|skillB". Guardamos ambas direcciones porque la
// co-ocurrencia en valor absoluto es simétrica.
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

// buildJobCountMap
// Diccionario con el total de ofertas por skill.
// Se usa como denominador: pct(A→B) = co_count(A,B) / job_count(A) × 100
export function buildJobCountMap(skillsData) {
  const map = {};
  for (const { skill, job_count } of skillsData) {
    map[skill] = Number(job_count);
  }
  return map;
}

// formatPct
// Calcula y formatea el porcentaje como string.
// Devuelve "—" si no hay datos o el denominador es 0.
export function formatPct(coCount, jobCountA) {
  if (!jobCountA || coCount === 0) return "—";
  return ((coCount / jobCountA) * 100).toFixed(1) + "%";
}

// calcMaxPct
// Porcentaje más alto entre todos los pares visibles del triángulo inferior.
// Lo usa D3 como extremo superior del dominio de la escala de color.
// Escalamos al máximo real (no 100%) para que las diferencias entre celdas
// sean visibles en lugar de quedar todas comprimidas en el extremo bajo.
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

// getHeatmapTextColor
// Devuelve "#1e293b" (oscuro) o "#ffffff" (claro) según la luminancia
// del color de fondo, para que el texto sea siempre legible.
//
// Fórmula estándar de luminancia relativa WCAG:
//   L = 0.2126·R + 0.7152·G + 0.0722·B  (valores normalizados 0-1)
export function getHeatmapTextColor(bgColorHex) {
  const rgb = d3.color(bgColorHex);
  if (!rgb) return "#1e293b";

  const lum =
    0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);

  return lum > 0.55 ? "#1e293b" : "#ffffff";
}
