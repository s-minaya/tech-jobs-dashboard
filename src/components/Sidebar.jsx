import FilterSection from "@/components/Filters/FilterSection";
import { FILTERS } from "../config/filters";

// Barra lateral fija que contiene todos los filtros del dashboard.
// Recibe el estado actual de los filtros (filters) y una función para modificarlos (onFilterChange).
// Por cada entrada en FILTERS renderiza una FilterSection, pasándole:
//   - selected   → el valor actualmente activo para ese filtro
//   - onSelect   → callback que dispara handleFilterChange en App con la key correcta

// onReset restaura todos los filtros a su valor inicial.
function Sidebar({ filters, onFilterChange, onReset }) {
  return (
    <aside className="w-64 shrink-0 border-r border-border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Resetear
        </button>
      </div>
      {FILTERS.map(({ key, ...rest }) => (
        <FilterSection
          key={rest.title}
          {...rest}
          selected={filters[key]}
          onSelect={(value) => onFilterChange(key, value)}
        />
      ))}
    </aside>
  );
}

export default Sidebar;
