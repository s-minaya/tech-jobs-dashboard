import FilterSection from "@/components/Filters/FilterSection";
import { FILTERS } from "../config/filters";

// Barra lateral fija que contiene todos los filtros del dashboard.
// Recibe el estado actual de los filtros (filters) y una función para modificarlos (onFilterChange).
// Por cada entrada en FILTERS renderiza una FilterSection, pasándole:
//   - selected   → el valor actualmente activo para ese filtro
//   - onSelect   → callback que dispara handleFilterChange en App con la key correcta
function Sidebar({ filters, onFilterChange }) {
  return (
    <aside className="w-64 shrink-0 border-r border-border p-4">
      <h2 className="mb-4 text-lg font-semibold">Filtros</h2>
      {FILTERS.map(({ key, ...rest }) => (
        <FilterSection
          key={rest.title}
          {...rest} // rest ya no contiene key
          selected={filters[key]}
          onSelect={(value) => onFilterChange(key, value)}
        />
      ))}
    </aside>
  );
}

export default Sidebar;
