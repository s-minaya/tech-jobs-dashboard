import { useState } from "react";

// Estado inicial de todos los filtros del dashboard.
// Coincide con las keys definidas en src/components/config/filters.js
const initialFilters = {
  pais: "Todos",
  periodo: "Últimos 30 días",
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

// Hook que encapsula el estado y la lógica de los filtros del dashboard.
// Separa la gestión del estado de la capa de presentación en App.jsx.
// Devuelve:
//   filters       → objeto con el valor activo de cada filtro
//   handleFilterChange → función para actualizar un filtro concreto por key
//   resetFilters  → restaura todos los filtros a su valor inicial
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
