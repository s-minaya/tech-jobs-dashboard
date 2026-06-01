import { useState } from "react";

// Valores por defecto de todos los filtros del dashboard.
// Coinciden con las keys definidas en src/components/config/filters.js
//
// periodo: "Últimos 90 días" en lugar de "Últimos 30 días" porque:
//   - Es el periodo que usan las vistas de la BD por defecto
//   - Con 30 días la gráfica de evolución mensual solo muestra 1 mes,
//     lo que no permite ver tendencias
//   - Las ofertas más recientes pueden no tener role_category asignado
//     todavía si el pipeline de NLP no las ha procesado
const initialFilters = {
  pais: "Todos",
  periodo: "Últimos 90 días",
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

// useFilters
// Encapsula el estado y la lógica de los filtros del dashboard.
// Separa la gestión del estado de la capa de presentación en App.jsx.
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
