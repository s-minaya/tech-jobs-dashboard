import { useState } from "react";
import { RiEqualizerLine, RiMenuFoldLine, RiMenuUnfoldLine } from "react-icons/ri";
import FilterSection from "@/components/Filters/FilterSection";
import { FILTERS } from "@/config/filters";
import { activeFilterCount } from "@/lib/filterUtils";

// DesktopFilterSidebar
// Columna de filtros para tablet/desktop (md+), montada siempre en el
// layout de cada página de gráfica (vía ChartPageLayout) — no flota
// sobre el contenido ni tiene overlay, a diferencia del FilterFAB +
// FilterDrawer que sustituye. Abierta por defecto, colapsable a un
// carril estrecho con un icono.
//
// Sin `position: sticky`: fluye con la página. Header también es
// `sticky top-0` sin altura fija medible — si el sidebar también
// apuntara a `top-0` competirían por la misma coordenada al hacer
// scroll. Cambiarlo a sticky después es un ajuste de una clase.
//
// Estado de colapso local (no elevado a ChartPageLayout/App.jsx): las
// rutas de este proyecto no comparten un layout persistente (sin
// `<Outlet/>`), cada página monta una instancia nueva al navegar — local
// y elevado se comportan igual en persistencia entre rutas. Local
// cumple "abierta por defecto" sin prop drilling adicional.
//
// Reutiliza FilterSection.jsx tal cual (fase 004) y el mismo bucle sobre
// FILTERS que usaba FilterDrawer.jsx, sin su mecánica de overlay/slide-in
// (no aplica a un panel que vive en el layout normal) ni su botón "Ver
// resultados" (existía para cerrar un panel que tapaba contenido; este
// sidebar nunca tapa nada, así que no hay nada que "ver" al cerrarlo).
function DesktopFilterSidebar({ filters, onFilterChange, onReset }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const count = activeFilterCount(filters);

  return (
    <aside
      aria-label="Filtros de la gráfica"
      className={`hidden shrink-0 flex-col border-r border-border bg-elevated transition-[width] duration-300 ease-in-out md:flex ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      {/* Cabecera — mismo lenguaje visual que tenía FilterDrawer.jsx
          (icono + título + badge a la izquierda, acciones a la
          derecha), con el botón de colapsar sustituyendo al de cerrar. */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <RiEqualizerLine className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Filtros</h2>
            {count > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </div>
        )}
        <div
          className={`flex items-center gap-3 ${isCollapsed ? "w-full justify-center" : ""}`}
        >
          {!isCollapsed && (
            <button
              onClick={onReset}
              className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Resetear
            </button>
          )}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
            aria-controls="desktop-filter-sidebar-content"
            aria-label={isCollapsed ? "Expandir filtros" : "Colapsar filtros"}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            {isCollapsed ? (
              <RiMenuUnfoldLine className="h-4 w-4" />
            ) : (
              <RiMenuFoldLine className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Contenido — se desmonta (no solo se oculta con CSS) al
          colapsar: evita mantener 6 secciones de filtro fuera de
          pantalla sin necesidad. */}
      {!isCollapsed && (
        <div
          id="desktop-filter-sidebar-content"
          className="flex-1 overflow-y-auto px-5 py-4"
        >
          {FILTERS.map(({ key, ...rest }) => (
            <FilterSection
              key={key}
              {...rest}
              selected={filters[key]}
              onSelect={(value) => onFilterChange(key, value)}
            />
          ))}
        </div>
      )}

      {/* Carril colapsado — mini badge del nº de filtros activos, para
          que se sepa que hay filtros aplicados sin tener que expandir. */}
      {isCollapsed && count > 0 && (
        <div className="flex justify-center pt-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {count}
          </span>
        </div>
      )}
    </aside>
  );
}

export default DesktopFilterSidebar;
