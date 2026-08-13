import { useEffect, useState } from "react";
import { getSummaryStats } from "@/services/jobServices";

// useSummaryStats
// Hook compartido por SummaryStats (KPI cards del dashboard) y
// LandingPage (bloque de stats de la landing) — fase 014.
//
// Antes cada uno llamaba a getSummaryStats() de forma independiente en
// su propio useEffect. Como la transición landing→dashboard tarda
// ~600ms y GET /api/stats/summary podía tardar 22-56s (ver
// spec/features/014-summary-stats-quality/014-spec.md, hallazgo 1),
// casi cualquier usuario disparaba las dos: la de la landing quedaba en
// vuelo, se desmontaba, y SummaryStats lanzaba una segunda idéntica al
// montar — trabajo de BD duplicado, uno de los dos totalmente
// desperdiciado (y un "setState sobre componente desmontado" en
// LandingPage, que no tenía ningún guard).
//
// inFlightPromise vive a nivel de MÓDULO (no por instancia del hook): si
// un componente monta mientras otro ya tiene una petición en curso,
// ambos comparten la misma promesa en vez de arrancar una segunda. No
// sustituye a la caché del backend (statsCache.js) — esto solo evita
// peticiones duplicadas *simultáneas*; la frescura entre recargas ya la
// resuelve el backend.
let inFlightPromise = null;

export function useSummaryStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!inFlightPromise) {
      inFlightPromise = getSummaryStats().finally(() => {
        inFlightPromise = null;
      });
    }

    inFlightPromise
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Error desconocido");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading, error };
}

// Solo para tests — evita que un test reutilice la promesa en vuelo de
// otro (inFlightPromise vive a nivel de módulo, compartido entre todos
// los render() de un mismo archivo de test).
export function _resetInFlightForTests() {
  inFlightPromise = null;
}
