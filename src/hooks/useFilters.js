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

export function useFilters() {
  const [filters, setFilters] = useState(initialFilters);

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  return { filters, handleFilterChange, resetFilters };
}
