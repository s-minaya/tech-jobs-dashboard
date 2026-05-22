// ─────────────────────────────────────────────────────────────────────────────
// Hook genérico para cargar datos de cualquier endpoint de la API.
// Lo usarán TopSkillsChart, DemandByRoleChart, SalaryChart y SkillHeatmap
// para no repetir el mismo patrón useState + useEffect + try/catch en cada uno.
//
// Uso:
//   const { data, loading, error } = useChartData(
//     () => getTopSkills(filters),  // función que devuelve una Promise
//     [filters.skillCategoria]       // dependencias: cuándo volver a cargar
//   );
//
// Ventajas de centralizarlo aquí:
//   - Un solo lugar donde arreglar bugs de carga
//   - Consistencia: todos los charts muestran "Cargando..." y errores igual
//   - Fácil de extender (por ejemplo, añadir cancelación de requests con AbortController)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

/**
 * useChartData
 * Ejecuta una función async y gestiona los estados de carga, datos y error.
 *
 * @param {Function} fetchFn   - Función que devuelve una Promise con los datos.
 *                               Se re-ejecuta cuando cambian las dependencias.
 *                               Ejemplo: () => getTopSkills(filters)
 * @param {Array}    deps      - Array de dependencias (igual que useEffect).
 *                               El hook vuelve a llamar fetchFn cuando cambia alguna.
 * @param {*}        initialData - Valor inicial de `data` antes de que cargue.
 *                               Por defecto [] (array vacío) para gráficas de listas.
 *
 * @returns {{ data, loading, error }}
 *   data    → los datos devueltos por fetchFn (o initialData si aún no cargó)
 *   loading → true mientras la petición está en curso
 *   error   → string con el mensaje de error, o null si todo fue bien
 */
export function useChartData(fetchFn, deps, initialData = []) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Marcamos como loading cada vez que se re-ejecuta (por cambio de deps)
    setLoading(true);
    setError(null); // limpiamos errores anteriores

    fetchFn()
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        // Guardamos solo el mensaje de texto para mostrarlo al usuario
        setError(err.message ?? "Error desconocido");
      })
      .finally(() => {
        setLoading(false);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps); // deps viene del caller, igual que en useEffect estándar

  return { data, loading, error };
}
