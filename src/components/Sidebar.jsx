import FilterSection from "@/components/Filters/FilterSection";
import { FILTERS } from "../config/filters";

/**
 * Sidebar
 * Panel lateral de filtros en desktop. Se oculta completamente en móvil
 * (hidden md:flex) porque en móvil los filtros se acceden desde el
 * bottom navbar como un panel deslizante.
 *
 * @param {Object}   filters          - Estado actual de todos los filtros
 * @param {Function} onFilterChange   - Callback para cambiar un filtro: (key, value) => void
 * @param {Function} onReset          - Callback para resetear todos los filtros
 */
function Sidebar({ filters, onFilterChange, onReset }) {
  return (
    /*
      hidden md:block      → oculto en móvil, visible desde md (768px)
      sticky top-0         → se "pega" al top del viewport al hacer scroll
      h-screen             → la altura del aside es exactamente la pantalla
      overflow-y-auto      → si los filtros no caben, scroll interno en el aside
      shrink-0             → evita que flexbox encoja el aside al ajustar tamaños
    */
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-border p-4 md:block">
      {/* Cabecera del panel: título + botón de resetear */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Resetear
        </button>
      </div>
      {/*
        Renderizamos una FilterSection por cada filtro definido en config/filters.js.
        La key es el campo `key` del filtro (ej: "pais", "skillCategoria").
        Le pasamos:
          selected  → el valor activo de ese filtro en el estado global
          onSelect  → callback que llama a handleFilterChange con la key correcta
      */}
      {FILTERS.map(({ key, ...rest }) => (
        <FilterSection
          key={key}
          {...rest}
          selected={filters[key]}
          onSelect={(value) => onFilterChange(key, value)}
        />
      ))}
    </aside>
  );
}

export default Sidebar;
