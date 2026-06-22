import { useState } from "react";
import { PERIODO_DEFAULT } from "@/lib/filterUtils";

// Valores iniciales de todos los filtros del dashboard.
// PERIODO_DEFAULT se importa de filterUtils para que useFilters y
// describeFiltros estén siempre sincronizados: si cambia el default,
// solo hay que tocarlo en filterUtils.js.
const initialFilters = {
  pais: "Todos",
  periodo: PERIODO_DEFAULT,
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

// Clave de localStorage donde se persisten los filtros seleccionados.
// Si el usuario cierra o recarga la página, recupera su selección.
const STORAGE_KEY = "dashboard_filters";

// loadFilters
// Lee los filtros guardados en localStorage y los fusiona con los iniciales.
// La fusión garantiza que si añadimos un nuevo filtro en el futuro,
// el valor guardado incompleto no rompa la aplicación.
function loadFilters() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialFilters;
    return { ...initialFilters, ...JSON.parse(saved) };
  } catch {
    return initialFilters;
  }
}

// saveFilters
// Persiste los filtros actuales en localStorage.
function saveFilters(filters) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Si localStorage no está disponible (modo privado, cuota llena), ignoramos
  }
}

export function useFilters() {
  // Inicializamos con los filtros guardados — si no hay nada guardado,
  // usa initialFilters como fallback
  const [filters, setFilters] = useState(loadFilters);

  function handleFilterChange(key, value) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      saveFilters(next);
      return next;
    });
  }

  function resetFilters() {
    saveFilters(initialFilters);
    setFilters(initialFilters);
  }

  return { filters, handleFilterChange, resetFilters };
}
