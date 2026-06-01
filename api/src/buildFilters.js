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
