import { useEffect } from "react";
import FilterSection from "@/components/Filters/FilterSection";
import { FILTERS } from "@/config/filters";
import { RiCloseLine } from "react-icons/ri";

// FilterSheet
// Panel de filtros móvil que se desliza desde la parte inferior.
// Solo visible en móvil (md:hidden en el overlay y el panel).
//
// Comportamiento:
//   - Al abrirse: el panel sube con translateY(0), el overlay oscurece el fondo
//   - Al cerrarse: el panel baja con translateY(100%)
//   - Tocar el overlay o pulsar X cierra el panel
//   - Mientras está abierto, el scroll del body se bloquea (overflow-hidden)
//
// El handle superior (barra gris) es solo visual — indica que el panel
// es deslizable, aunque el drag no está implementado (cierre con X u overlay).
function FilterSheet({ isOpen, onClose, filters, onFilterChange, onReset }) {
  // Bloquear scroll del body cuando el panel está abierto
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
      {/* Overlay oscuro — toca para cerrar */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"} `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel deslizante desde abajo
          max-h-[85vh] limita la altura al 85% de la pantalla.
          overflow-y-auto permite scroll interno si hay muchos filtros.
          rounded-t-2xl da el efecto de "hoja" redondeada arriba. */}
      <div
        className={`fixed right-0 bottom-0 left-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background shadow-2xl shadow-black/40 transition-transform duration-300 ease-out md:hidden ${isOpen ? "translate-y-0" : "translate-y-full"} `}
      >
        {/* Handle visual */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-semibold">Filtros</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
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

        {/* Divisor */}
        <div className="mx-4 h-px bg-border" />

        {/* Contenido de filtros — mismo componente que el sidebar */}
        <div className="px-4 py-4">
          {FILTERS.map(({ key, ...rest }) => (
            <FilterSection
              key={key}
              {...rest}
              selected={filters[key]}
              onSelect={(value) => {
                onFilterChange(key, value);
              }}
            />
          ))}
        </div>

        {/* Botón de aplicar — cierra el panel y aplica los filtros */}
        <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </>
  );
}

export default FilterSheet;
