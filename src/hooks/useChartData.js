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
export function useChartData(fetchFn, deps, initialData = []) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  // Guarda los últimos datos válidos para devolverlos durante recargas.
  const staleDataRef = useRef(initialData);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Durante recargas por cambio de filtro, mantenemos los datos anteriores
    // visibles. Durante la carga inicial staleDataRef tiene initialData (array
    // vacío) así que data queda en [] hasta que llegue la respuesta.
    setData(staleDataRef.current);

    fetchFn()
      .then((result) => {
        staleDataRef.current = result;
        setData(result);
        // Una vez llega la primera respuesta, ya no es la carga inicial.
        setIsInitialLoad(false);
      })
      .catch((err) => {
        setError(err.message ?? "Error desconocido");
      })
      .finally(() => {
        setLoading(false);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, isInitialLoad, error };
}
