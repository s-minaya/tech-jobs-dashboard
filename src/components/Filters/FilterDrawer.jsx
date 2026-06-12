import { useEffect } from "react";
import { RiCloseLine, RiEqualizerLine } from "react-icons/ri";
import FilterSection from "@/components/Filters/FilterSection";
import { FILTERS } from "@/config/filters";
import GlowButton from "@/components/ui/GlowButton";

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
// Usa GlowButton con el mismo efecto aurora que el botón de la landing.
// Muestra un badge con el número de filtros activos.
// Cuando hay filtros activos, el anillo exterior pulsa para llamar la atención.
function FilterFAB({ filters, onClick }) {
  const count = activeFilterCount(filters);

  return (
    <div className="fixed top-4 left-4 z-40 hidden md:block">
      <div className="relative">
        <GlowButton
          onClick={onClick}
          variant="solid"
          className="glow-button-sm"
        >
          <RiEqualizerLine className="h-4 w-4" />
          Filtros
        </GlowButton>
        {/* Badge con número de filtros activos */}
        {count > 0 && (
          <>
            <span className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary shadow-md">
              {count}
            </span>
            {/* Anillo pulsante */}
            <span className="absolute -top-1 -right-1 h-5 w-5 animate-ping rounded-full bg-white/40" />
          </>
        )}
      </div>
    </div>
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
        className={`fixed inset-0 z-40 hidden bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:block ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer desde la izquierda — solo md+ */}
      <div
        className={`fixed top-0 left-0 z-50 flex hidden h-full w-72 flex-col border-r border-border bg-background shadow-2xl shadow-black/20 transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] md:flex dark:shadow-black/60 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
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

        {/* Footer con GlowButton centrado — mismo efecto que la landing */}
        <div className="flex justify-center border-t border-border px-5 py-4">
          <GlowButton
            onClick={onClose}
            variant="solid"
            className="glow-button-sm"
          >
            Ver resultados
          </GlowButton>
        </div>
      </div>
    </>
  );
}

export { FilterFAB };
export default FilterDrawer;
