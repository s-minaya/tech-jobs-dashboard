// buildFilters.js
// Convierte los query params de filtro en condiciones SQL para el WHERE.
// Separado de index.js para poder testear la función de forma aislada
// sin levantar el servidor Express ni conectar a la BD.
//
// Todas las condiciones generadas usan el alias 'j' (tabla jobs).
// Los endpoints que necesitan condiciones sobre otras tablas (ej: skills 's')
// las añaden por separado, clonando values ANTES de añadir esos valores extra,
// para que el COUNT total no reciba parámetros que su SQL no referencia
// (eso causaría "bind message supplies N parameters, but prepared statement
// requires M" en PostgreSQL).

/**
 * @param {Object} query          - req.query de Express o cualquier objeto plano
 * @param {Array}  existingValues - valores previos si el caller ya tiene alguno
 * @returns {{ conditions: string[], values: any[] }}
 */
export function buildFilters(query, existingValues = []) {
  const conditions = [];
  // Copiamos existingValues para no mutar el array original del caller
  const values = [...existingValues];

  conditions.push("j.is_active = TRUE");

  if (query.country) {
    values.push(query.country.toLowerCase());
    conditions.push(`j.country_code = $${values.length}`);
  }

  // "all" significa histórico completo: no añadimos condición de fecha.
  const periodoMap = {
    "30d": "30 days",
    "90d": "90 days",
    "180d": "180 days",
  };
  const intervalo = periodoMap[query.periodo];
  if (intervalo) {
    values.push(intervalo);
    conditions.push(`j.posted_at >= NOW() - $${values.length}::interval`);
  }

  if (query.contrato) {
    values.push(query.contrato.toLowerCase());
    conditions.push(`j.contract_type = $${values.length}`);
  }

  if (query.jornada) {
    values.push(query.jornada.toLowerCase());
    conditions.push(`j.contract_time = $${values.length}`);
  }

  // remote llega como string desde la URL; lo convertimos a boolean
  // para que PostgreSQL lo reciba como tipo correcto (BOOLEAN, no TEXT).
  if (query.remote === "true" || query.remote === "false") {
    values.push(query.remote === "true");
    conditions.push(`j.remote = $${values.length}`);
  }

  return { conditions, values };
}

// stripKeys
// Devuelve una copia de `query` sin las claves indicadas. La usan los
// endpoints que solo aplican un subconjunto de los filtros habituales
// (ej. /api/skills/cooccurrence, que solo usa periodo) — mantener "qué se
// descarta" como una lista explícita e importable permite testear el
// contrato del endpoint sin levantar Express ni BD, en vez de un
// destructure inline en index.js que no se puede verificar por separado
// (fase 012 — un destructure incompleto de este tipo dejó `contrato`/
// `remote` colándose en /api/skills/cooccurrence sin que ningún test lo
// detectara).
export function stripKeys(query, keys) {
  const result = { ...query };
  for (const key of keys) delete result[key];
  return result;
}

// COOCCURRENCE_IGNORED_FILTERS
// /api/skills/cooccurrence solo debe filtrarse por periodo — país,
// contrato, jornada y remote fragmentarían la muestra hasta dejar pocas
// co-ocurrencias reales, y los porcentajes dejarían de ser fiables.
export const COOCCURRENCE_IGNORED_FILTERS = [
  "country",
  "contrato",
  "jornada",
  "remote",
];

// TOP_SKILLS_IGNORED_FILTERS
// /api/skills/top no aplica jornada: qué tecnologías pide un puesto no
// cambia según si es a tiempo completo o parcial (decisión de diseño
// confirmada en la fase 012, tras descartar la recomendación inicial de
// habilitarlo). Antes se descartaba con un destructure inline en
// index.js sin ningún test que lo protegiera — mismo tipo de "contrato no
// testeado" que dejó pasar el leak real de contrato/remote en
// /api/skills/cooccurrence (fase 012).
export const TOP_SKILLS_IGNORED_FILTERS = ["jornada"];

// applyDefaultPeriodoFallback
// /api/skills/top y /api/skills/cooccurrence prefieren no ejecutar sin
// ningún límite de fecha si un caller se olvida de enviar `periodo` — le
// añaden este fallback de 90 días como protección razonable. Debe saltar
// SOLO cuando periodo está totalmente ausente, nunca cuando vale "all"
// (buildFilters ya no añade ninguna condición de fecha en ese caso, que
// es el comportamiento correcto de "Todo el histórico"). Hasta la fase
// 013 los dos endpoints reimplementaban este `if` por separado, y ambos
// saltaban también con periodo === "all" — "Todo el histórico" era un
// no-op silencioso, confirmado en vivo (mismo total_matching_jobs con
// periodo=90d, periodo=all y sin periodo). Centralizado aquí para que no
// puedan volver a desincronizarse.
export function applyDefaultPeriodoFallback(conditions, query) {
  if (!query.periodo) {
    conditions.push("j.posted_at >= NOW() - INTERVAL '90 days'");
  }
  return conditions;
}
