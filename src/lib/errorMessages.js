// errorMessages.js
// Traduce mensajes de error crudos del backend (texto de PostgreSQL en
// inglés, ver errorHandler en api/src/index.js) a mensajes en español
// comprensibles. Centralizado aquí porque ChartCard es el único punto de
// render de error de todas las gráficas. Patrones confirmados con errores
// reales de esta sesión: "canceling statement due to statement timeout"
// (statement_timeout) y "unable to check out connection from the pool
// after 15000ms" (pool de pg agotado).
//
// Devuelve null si no reconoce el mensaje — ChartCard usa null como señal
// de "sin traducción, muestra el mensaje crudo con el prefijo 'Error:'".
const TIMEOUT_PATTERNS = [/statement timeout/i, /canceling statement/i];
const POOL_PATTERNS = [/pool/i];

export function describeError(rawMessage) {
  if (!rawMessage) return null;
  if (TIMEOUT_PATTERNS.some((re) => re.test(rawMessage))) {
    return "Esta consulta está tardando demasiado y el servidor la ha cancelado. Prueba a acotar los filtros (por ejemplo, un periodo más corto) o inténtalo de nuevo en unos segundos.";
  }
  if (POOL_PATTERNS.some((re) => re.test(rawMessage))) {
    return "El servidor está recibiendo muchas peticiones a la vez. Espera unos segundos y vuelve a intentarlo.";
  }
  return null;
}
