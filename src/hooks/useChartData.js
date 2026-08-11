/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from "react";

// useChartData
// Hook genérico para cargar datos de cualquier endpoint de la API.
//
// Implementa stale-while-revalidate: cuando se está recargando por un cambio
// de filtro, devuelve los datos anteriores en lugar de un array vacío.
// Esto evita que el chart desaparezca durante la recarga y el layout cambie
// de tamaño, lo que haría que el browser subiera el scroll.
//
// isInitialLoad distingue la primera carga (sin datos previos) de las
// recargas por cambio de filtro (con datos previos disponibles).
// Los componentes pueden usarlo para mostrar un estado distinto en cada caso:
// en la carga inicial ChartCard muestra "Cargando...", en recargas muestra
// el badge "Actualizando..." sobre los datos anteriores.
//
// AbortController (fase 010): cada cambio de deps cancela la petición
// anterior en vez de dejarla viva. Antes, cambiar de filtro rápido (ej.
// dos veces seguidas) acumulaba varias queries vivas contra la misma BD —
// confirmado en esta sesión como una causa real de agotamiento del pool de
// conexiones ("unable to check out connection from the pool after
// 15000ms") con queries lentas como la de SalaryChart.
export function useChartData(fetchFn, deps, initialData = []) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  // Guarda los últimos datos válidos para devolverlos durante recargas.
  const staleDataRef = useRef(initialData);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    // Durante recargas por cambio de filtro, mantenemos los datos anteriores
    // visibles. Durante la carga inicial staleDataRef tiene initialData (array
    // vacío) así que data queda en [] hasta que llegue la respuesta.
    setData(staleDataRef.current);

    fetchFn(controller.signal)
      .then((result) => {
        staleDataRef.current = result;
        setData(result);
        // Una vez llega la primera respuesta, ya no es la carga inicial.
        setIsInitialLoad(false);
      })
      .catch((err) => {
        // fetch rechaza con DOMException name="AbortError" al cancelar —
        // no es un error real, el próximo efecto ya dispara la petición
        // nueva con los deps actualizados.
        if (err.name === "AbortError") return;
        setError(err.message ?? "Error desconocido");
      })
      .finally(() => {
        // Si ESTA petición fue la cancelada, no toques loading — la
        // petición nueva ya puso loading=true y su propio finally se
        // encargará de bajarlo cuando termine.
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, isInitialLoad, error };
}
