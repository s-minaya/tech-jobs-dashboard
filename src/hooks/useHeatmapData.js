import { useState, useEffect } from "react";
import { getSkillCoOccurrence, getTopSkills } from "@/services/jobServices";

// Número de skills a mostrar cuando no hay filtro de categoría activo.
export const DEFAULT_MAX_SKILLS = 15;

// Número de skills a mostrar cuando hay filtro de categoría activo.
// Más alto para mostrar todas las skills de esa categoría en lugar de
// las top 15 globales, que excluirían skills menos populares como bases de datos.
export const FILTERED_MAX = 50;

// useHeatmapData
// Gestiona las dos cargas de datos independientes que necesita el SkillHeatmap:
//   1. Pares de co-ocurrencia: se cargan una sola vez al montar, son datos globales.
//   2. Skills de la categoría activa: se recargan cada vez que cambia `categoria`.
//
// El motivo de separar ambas cargas es que tienen ciclos de vida distintos:
// los pares no dependen de ningún filtro, las skills sí.
export function useHeatmapData(categoria) {
  // Pares de co-ocurrencia: [{ skill, co_skill, co_count }]
  // Se cargan una vez y no cambian con los filtros.
  const [pairs, setPairs] = useState([]);

  // Skills de la categoría seleccionada actualmente.
  // Se reemplaza completo al cambiar de categoría.
  const [skillsData, setSkillsData] = useState([]);

  // Top skills sin filtro de categoría.
  // Se mantiene siempre disponible para poder calcular el job_count correcto
  // de cualquier skill, incluso cuando skillsData está filtrada por categoría.
  const [allSkillsData, setAllSkillsData] = useState([]);

  // true solo durante la primera carga al montar el componente.
  // Mientras es true, el componente muestra el estado de carga global.
  const [loadingPairs, setLoadingPairs] = useState(true);

  // true cuando cambia la categoría y se está recargando skillsData.
  // Se usa para reducir la opacidad del SVG sin desmontarlo.
  const [loadingSkills, setLoadingSkills] = useState(false);

  const [error, setError] = useState(null);

  // Carga inicial: pares de co-ocurrencia + top skills globales en paralelo.
  // Se ejecuta una sola vez al montar el componente.
  useEffect(() => {
    Promise.all([getSkillCoOccurrence(), getTopSkills({})])
      .then(([coData, globalSkills]) => {
        setPairs(coData.pairs);
        setAllSkillsData(globalSkills);
        // En el arranque la categoría es "todas", usamos las skills globales directamente.
        setSkillsData(globalSkills);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingPairs(false));
  }, []);

  // Recarga de skills al cambiar categoría.
  // Espera a que la carga inicial haya terminado antes de reaccionar.
  //
  // Cuando hay categoría activa, llamamos a la API con el filtro para obtener
  // TODAS las skills de esa categoría (hasta FILTERED_MAX), no solo las que
  // aparecen entre las top 20 globales. Sin esto, "database" solo mostraría
  // PostgreSQL porque es la única base de datos en las top 20 globales.
  useEffect(() => {
    if (loadingPairs) return;

    if (categoria === "todas") {
      // Sin filtro: reutilizamos los datos globales sin hacer una nueva petición.
      setSkillsData(allSkillsData);
    } else {
      setLoadingSkills(true);
      getTopSkills({ skillCategoria: categoria })
        .then((data) => setSkillsData(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoadingSkills(false));
    }
  }, [categoria, loadingPairs]);

  return {
    pairs,
    skillsData,
    allSkillsData,
    loadingPairs,
    loadingSkills,
    error,
  };
}
