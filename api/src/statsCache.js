// statsCache.js
// Caché en memoria (del propio proceso Express) con TTL, específica de
// /api/stats/summary — fase 014.
//
// Distinta de devCache.js (herramienta TEMPORAL de desarrollo, en disco,
// pensada para sobrevivir a los reinicios de `node --watch` mientras
// trabajamos contra una BD real lenta — ver ese archivo): esta caché es
// una decisión de diseño PERMANENTE. /api/stats/summary no recibe
// ningún filtro — representa el estado global del dataset, que solo
// cambia cuando corre el pipeline de ingesta (~1 vez/día, verificado en
// vivo: nada se había ingerido/visto "hoy" en el momento de la
// auditoría — ver 014-spec.md). Antes de esta caché, la query más cara
// del proyecto (22-56s, ver 014-spec.md hallazgo 1) se repetía en cada
// carga del dashboard Y de la landing.
//
// TTL_MS muy por debajo de la cadencia real de cambio del dato, para no
// esconder cambios genuinos más de la cuenta. Subido de 10 a 30 minutos
// en la ronda 3 de esta fase: con el warmup al arrancar (index.js) más
// este TTL más largo, cualquier visita real cae casi siempre dentro de
// una ventana caliente — 30 min sigue siendo imperceptible frente a la
// cadencia real de ~1 vez/día del pipeline.
const TTL_MS = 30 * 60 * 1000; // 30 minutos

let cachedValue = null;
let cachedAt = 0;
// Promesa compartida mientras computeFn() está en curso — sin esto, dos
// llamadas a getCached() que lleguen antes de que la primera resuelva
// (ej. el calentamiento al arrancar el servidor + la primera visita
// real, index.js) ven cachedValue===null las dos y lanzan la query cara
// DOS VECES en paralelo, compitiendo por los mismos recursos de la BD —
// bug real encontrado al verificar en vivo el calentamiento de la fase
// 014 ronda 3: la petición de verificación tardó MÁS (87s) que sin
// calentamiento (66-88s), no menos, porque coincidió con el propio
// calentamiento todavía en curso. Mismo patrón que inFlightPromise en
// src/hooks/useSummaryStats.js (frontend), aplicado aquí en el backend.
let inFlightPromise = null;

// getCached
// Devuelve el valor cacheado si sigue dentro del TTL; si no, reusa la
// computación en curso si ya hay una, o arranca computeFn(). No cachea
// rechazos: si computeFn() falla, cachedValue/cachedAt quedan igual que
// antes de la llamada (el siguiente request lo vuelve a intentar en vez
// de servir un error durante el TTL completo).
export async function getCached(computeFn) {
  const now = Date.now();
  if (cachedValue !== null && now - cachedAt < TTL_MS) {
    return cachedValue;
  }
  if (!inFlightPromise) {
    inFlightPromise = computeFn()
      .then((value) => {
        cachedValue = value;
        cachedAt = Date.now();
        return value;
      })
      .finally(() => {
        inFlightPromise = null;
      });
  }
  return inFlightPromise;
}

// Solo para tests — resetea el estado del módulo entre casos, ya que
// cachedValue/cachedAt/inFlightPromise viven a nivel de módulo
// (compartidos entre todas las llamadas a getCached).
export function _resetCacheForTests() {
  cachedValue = null;
  cachedAt = 0;
  inFlightPromise = null;
}
