import FilterSection from "@/components/Filters/FilterSection";
import { FILTERS } from "../config/filters";

// Barra lateral fija que contiene todos los filtros del dashboard.
// Recorre el array FILTERS y renderiza una sección por cada filtro.

function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-border p-4">
      <h2 className="mb-4 text-lg font-semibold">Filtros</h2>
      {FILTERS.map((filter) => (
        // key={filter.title} porque los títulos son únicos en FILTERS
        <FilterSection key={filter.title} {...filter} />
      ))}
    </aside>
  );
}

export default Sidebar;
