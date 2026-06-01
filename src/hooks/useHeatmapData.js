/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { getSkillCoOccurrence, getTopSkills } from "@/services/jobServices";

export const DEFAULT_MAX_SKILLS = 15;
export const FILTERED_MAX = 50;

// useHeatmapData
// Gestiona las dos cargas del SkillHeatmap:
//   1. Pares de co-ocurrencia: se recargan solo cuando cambia el periodo.
//   2. Skills de la categoría activa: se recargan cuando cambia la categoría.
//
// Solo periodo afecta a los pares. País, contrato, jornada y remote
// no aplican a las co-ocurrencias (ver getSkillCoOccurrence en jobServices).
//
// getTopSkills recibe los mismos filtros reducidos que getSkillCoOccurrence
// para que ambos usen el mismo periodo y los porcentajes sean coherentes.
// Si usaran periodos distintos, co_count podría superar job_count y los
// porcentajes resultarían mayores del 100%.
export function useHeatmapData(categoria, filters = {}) {
  const [pairs, setPairs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(null);
  const [skillsData, setSkillsData] = useState([]);
  const [allSkillsData, setAllSkillsData] = useState([]);
  const [loadingPairs, setLoadingPairs] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [error, setError] = useState(null);

  // Solo el periodo afecta a los pares de co-ocurrencia.
  // Cuando cambia, recargamos todo.
  const filterKey = filters.periodo ?? "";

  useEffect(() => {
    setLoadingPairs(true);
    // Pasamos filters a getTopSkills para que use el mismo periodo
    // que getSkillCoOccurrence, garantizando porcentajes <= 100%.
    // getSkillCoOccurrence internamente descarta todo menos el periodo.
    // getTopSkills internamente descarta jornada.
    Promise.all([getSkillCoOccurrence(filters), getTopSkills(filters)])
      .then(([coData, skillsResponse]) => {
        setPairs(coData.pairs);
        setTotalJobs(coData.total_matching_jobs);
        const globalSkills = skillsResponse?.rows ?? [];
        setAllSkillsData(globalSkills);
        setSkillsData(globalSkills);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingPairs(false));
  }, [filterKey]);

  // Recarga de skills al cambiar categoría.
  useEffect(() => {
    if (loadingPairs) return;
    if (categoria === "todas") {
      setSkillsData(allSkillsData);
    } else {
      setLoadingSkills(true);
      getTopSkills({ skillCategoria: categoria, periodo: filters.periodo })
        .then((response) => setSkillsData(response?.rows ?? []))
        .catch((err) => setError(err.message))
        .finally(() => setLoadingSkills(false));
    }
  }, [categoria, loadingPairs]);

  return {
    pairs,
    totalJobs,
    skillsData,
    allSkillsData,
    loadingPairs,
    loadingSkills,
    error,
  };
}
