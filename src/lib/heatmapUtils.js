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

// Con conjuntos muy pequeños (categorías con pocas skills populares),
// exigir grado >= 2 sería desproporcionado: con n<=4 candidatas el grado
// máximo posible es 3, y pedir >=2 exige conectar con la mayoría del
// conjunto sin margen para distinguir señal de ruido.
const SMALL_SET_THRESHOLD = 4;

// filterSkillsWithCoOccurrence
// A partir de un array de skills candidatas y los pares de co-ocurrencia,
// devuelve solo las skills con conectividad mínima real dentro del propio
// conjunto ("k-core"): cada skill superviviente debe co-ocurrir con al
// menos `minDegree` otras skills del conjunto, y cada una de esas
// conexiones debe estar respaldada por al menos `minEdgeCount` ofertas
// reales (para no contar como "conexión" una coincidencia de una sola
// oferta compartida). Antes solo exigíamos "al menos 1" co-ocurrencia sin
// piso de conteo (k=1), lo que dejaba pasar filas casi vacías con una
// única coincidencia residual — ej. una skill de nicho que aparece junto
// a otra en 1 sola oferta de mil.
//
// El algoritmo es un "peeling" de k-core: eliminamos skills que no
// alcanzan el umbral y repetimos, porque al quitar una skill otras
// pueden perder conexiones y caer también por debajo.
//
// Con conjuntos de candidatas pequeños (<= SMALL_SET_THRESHOLD) usamos el
// criterio original (>=1 conexión, sin piso de conteo) para no vaciar
// categorías donde ya hay poco margen — ver SMALL_SET_THRESHOLD arriba.
export function filterSkillsWithCoOccurrence(
  skills,
  pairs,
  { minDegree = 2, minEdgeCount = 2 } = {},
) {
  // Mapa de magnitud (no solo existencia) — necesario para poder
  // descartar conexiones respaldadas por muy pocas ofertas.
  const countMap = new Map();
  for (const { skill, co_skill, co_count } of pairs) {
    const count = Number(co_count);
    countMap.set(`${skill}|${co_skill}`, count);
    countMap.set(`${co_skill}|${skill}`, count);
  }

  // El umbral efectivo se calcula UNA sola vez sobre el tamaño del
  // conjunto candidato inicial, no en cada pasada — así el peeling
  // converge de forma monótona y ninguna skill "revive" a mitad de la
  // iteración por un cambio de umbral.
  const isSmallSet = skills.length <= SMALL_SET_THRESHOLD;
  const effectiveMinDegree = isSmallSet ? 1 : minDegree;
  const effectiveMinEdgeCount = isSmallSet ? 1 : minEdgeCount;

  let current = [...skills];
  let changed = true;

  // Iteramos hasta estabilidad — normalmente 1-2 pasadas
  while (changed) {
    changed = false;
    const next = current.filter((skill) => {
      let degree = 0;
      for (const other of current) {
        if (other === skill) continue;
        const count = countMap.get(`${skill}|${other}`) ?? 0;
        if (count >= effectiveMinEdgeCount) degree++;
      }
      return degree >= effectiveMinDegree;
    });
    if (next.length !== current.length) {
      current = next;
      changed = true;
    }
  }

  return current;
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
