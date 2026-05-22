import FilterSection from "@/components/Filters/FilterSection";
import { FILTERS } from "../config/filters";

/**
 * Sidebar
 * Panel lateral de filtros. Se queda fijo mientras el usuario hace scroll.
 *
 * @param {Object}   filters          - Estado actual de todos los filtros
 * @param {Function} onFilterChange   - Callback para cambiar un filtro: (key, value) => void
 * @param {Function} onReset          - Callback para resetear todos los filtros
 */
function Sidebar({ filters, onFilterChange, onReset }) {
  return (
    /*
      sticky top-0         → se "pega" al top del viewport al hacer scroll
      h-screen             → la altura del aside es exactamente la pantalla
      overflow-y-auto      → si los filtros no caben, scroll interno en el aside
      shrink-0             → evita que flexbox encoja el aside al ajustar tamaños

      Nota: el aside tiene su propio scroll (overflow-y-auto) separado del
      scroll principal de la página. Así, si hay muchos filtros, el usuario
      puede scrollear dentro del panel sin perder la posición en las gráficas.
    */
    <aside className="sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r border-border p-4">
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
