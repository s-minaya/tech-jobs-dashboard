import { useState, useEffect, useRef } from "react";
import { RiInformationLine, RiCloseLine } from "react-icons/ri";

// DISMISSED_KEY
// Clave de localStorage donde guardamos qué avisos el usuario ya ha descartado.
// Formato: Set serializado de strings "filtroKey:contexto"
const DISMISSED_KEY = "chart_filter_warnings_dismissed";

function getDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveDismissed(set) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}

// FilterWarningPopover
// Icono ⓘ que al pulsar muestra un popover con el aviso del filtro ignorado.
// El usuario puede cerrarlo con "Entendido" — y no vuelve a aparecer
// en futuras sesiones gracias a localStorage.
//
// Props:
//   filterKey → key del filtro (ej: "pais", "jornada")
//   contexto  → identificador de la gráfica (ej: "mapa", "heatmap")
//   texto     → mensaje explicativo del aviso
function FilterWarningPopover({ filterKey, contexto, texto }) {
  const id = `${filterKey}:${contexto}`;
  const [dismissed, setDismissed] = useState(() => getDismissed().has(id));
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);

  // Cierra el popover al hacer click fuera
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Si el usuario ya descartó este aviso, no renderizamos nada
  if (dismissed) return null;

  function handleDismiss() {
    const set = getDismissed();
    set.add(id);
    saveDismissed(set);
    setDismissed(true);
    setOpen(false);
  }

  return (
    <div className="relative inline-flex" ref={popoverRef}>
      {/* Icono disparador */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Ver aviso sobre este filtro"
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-amber-500 transition-colors hover:bg-amber-500/10"
      >
        <RiInformationLine className="h-4 w-4" />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute top-7 left-0 z-50 w-72 rounded-xl border border-border bg-card/95 p-4 text-xs leading-relaxed shadow-xl shadow-black/20 backdrop-blur-md">
          {/* Cabecera */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-amber-500">
              <RiInformationLine className="h-3.5 w-3.5 shrink-0" />
              Filtro no aplicado
            </span>
            <button
              onClick={() => setOpen(false)}
              className="cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <RiCloseLine className="h-4 w-4" />
            </button>
          </div>

          {/* Texto del aviso */}
          <p className="text-muted-foreground">{texto}</p>

          {/* Botón de confirmar — no vuelve a aparecer */}
          <button
            onClick={handleDismiss}
            className="mt-3 w-full cursor-pointer rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Entendido, no mostrar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}

export default FilterWarningPopover;
