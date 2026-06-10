import { useEffect, useRef } from "react";
import { RiCloseLine, RiEqualizerLine } from "react-icons/ri";
import FilterSection from "@/components/Filters/FilterSection";
import { FILTERS } from "@/config/filters";

// activeFilterCount
// Cuenta cuántos filtros están en un valor distinto al neutro.
// Sirve para mostrar el badge en el FAB y darle feedback al usuario.
const NEUTRAL = {
  pais: "Todos",
  periodo: "Últimos 90 días",
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};
function activeFilterCount(filters) {
  return Object.entries(filters).filter(([k, v]) => v !== NEUTRAL[k]).length;
}

// FilterFAB
// Botón flotante fijo en la esquina superior izquierda.
// Visible solo en md+ (en móvil los filtros van en el bottom nav).
// Muestra un badge con el número de filtros activos.
// Cuando hay filtros activos, el anillo exterior pulsa para llamar la atención.
function FilterFAB({ filters, onClick }) {
  const count = activeFilterCount(filters);

  return (
    <button
      onClick={onClick}
      aria-label="Abrir filtros"
      className="group fixed top-4 left-4 z-40 hidden items-center gap-2 rounded-full border border-border bg-card py-2 pr-4 pl-3 shadow-lg shadow-black/15 transition-all duration-200 hover:scale-105 hover:shadow-xl md:flex dark:shadow-black/40"
    >
      {/* Icono con anillo pulsante cuando hay filtros activos */}
      <div className="relative">
        <RiEqualizerLine className="h-4 w-4 text-primary" />
        {count > 0 && (
          <>
            {/* Anillo pulsante */}
            <span className="absolute -inset-1 animate-ping rounded-full bg-primary/20" />
            {/* Badge con número */}
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          </>
        )}
      </div>
      <span className="text-sm font-medium text-foreground">Filtros</span>
    </button>
  );
}

// FilterDrawer
// Panel lateral de filtros para tablet y desktop.
// Se desliza desde la izquierda con cubic-bezier para una animación más viva.
// El overlay tiene backdrop-blur para dar profundidad.
// Solo visible en md+ (en móvil se usa FilterSheet).
//
// Comportamiento:
//   - FAB fijo arriba izquierda abre el drawer
//   - Overlay o botón X cierran el drawer
//   - El scroll del body se bloquea mientras está abierto
function FilterDrawer({ isOpen, onClose, filters, onFilterChange, onReset }) {
  const count = activeFilterCount(filters);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay con backdrop-blur — solo md+ */}
      <div
        className={`fixed inset-0 z-40 hidden bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:block ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"} `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer desde la izquierda — solo md+ */}
      <div
        className={`fixed top-0 left-0 z-50 flex hidden h-full w-72 flex-col border-r border-border bg-background shadow-2xl shadow-black/20 transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] md:flex dark:shadow-black/60 ${isOpen ? "translate-x-0" : "-translate-x-full"} `}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <RiEqualizerLine className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Filtros</h2>
            {/* Badge inline de filtros activos */}
            {count > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Resetear
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar filtros"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              <RiCloseLine className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filtros con scroll interno */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {FILTERS.map(({ key, ...rest }) => (
            <FilterSection
              key={key}
              {...rest}
              selected={filters[key]}
              onSelect={(value) => onFilterChange(key, value)}
            />
          ))}
        </div>

        {/* Footer con botón de aplicar */}
        <div className="border-t border-border px-5 py-4">
          <button
            onClick={onClose}
            className="w-full cursor-pointer rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </>
  );
}

export { FilterFAB };
export default FilterDrawer;
