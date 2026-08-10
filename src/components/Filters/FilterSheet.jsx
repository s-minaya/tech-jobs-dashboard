import { useEffect, useRef, useState, useCallback } from "react";
import FilterSection from "@/components/Filters/FilterSection";
import { FILTERS } from "@/config/filters";
import { RiCloseLine } from "react-icons/ri";
import GlowButton from "@/components/ui/GlowButton";

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
// Drag para cerrar:
//   - El usuario puede arrastrar el panel hacia abajo desde el handle o la cabecera
//   - Si arrastra más del 30% de la altura del panel, se cierra automáticamente
//   - Si arrastra menos, el panel vuelve a su posición original con spring
//   - Durante el drag se registra un touchmove en document con passive:false
//     para poder llamar preventDefault() y evitar el scroll de página
//   - Sin blur en el overlay durante el drag para ver las gráficas de fondo
function FilterSheet({ isOpen, onClose, filters, onFilterChange, onReset }) {
  const panelRef = useRef(null);
  const handleRef = useRef(null);
  const dragState = useRef(null);
  const isDraggingRef = useRef(false); // ref para acceder en listeners del DOM
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Bloquear scroll de página mientras el panel está abierto.
  // La técnica más robusta en iOS Safari es interceptar touchmove
  // en document con passive:false y llamar preventDefault().
  // Esto evita que cualquier gesto de scroll llegue a la página,
  // independientemente de dónde empiece el toque.
  useEffect(() => {
    if (!isOpen) return;

    const preventScroll = (e) => {
      // Permitir scroll dentro del panel (panelRef) pero no en la página
      if (panelRef.current && panelRef.current.contains(e.target)) {
        // Si el panel puede scrollear internamente y no estamos haciendo drag, dejar pasar
        const panel = panelRef.current;
        const atTop = panel.scrollTop === 0;
        const atBottom =
          panel.scrollTop + panel.clientHeight >= panel.scrollHeight;
        const movingDown =
          e.touches[0].clientY <
          (dragState.current?.startY ?? e.touches[0].clientY);
        const movingUp =
          e.touches[0].clientY >
          (dragState.current?.startY ?? e.touches[0].clientY);

        if (isDraggingRef.current) {
          e.preventDefault(); // durante drag siempre bloqueamos
          return;
        }
        if (atTop && movingUp) {
          e.preventDefault();
          return;
        } // evita bounce arriba
        if (atBottom && movingDown) {
          e.preventDefault();
          return;
        } // evita bounce abajo
        return; // scroll interno normal
      }
      // Fuera del panel (overlay, etc.) siempre bloqueamos
      e.preventDefault();
    };

    setDragY(0);
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.removeEventListener("touchmove", preventScroll);
  }, [isOpen]);

  // ── Lógica de drag ──────────────────────────────────────────────────────────

  const startDrag = useCallback((clientY) => {
    if (!panelRef.current) return;
    dragState.current = {
      startY: clientY,
      startScrollTop: panelRef.current.scrollTop,
    };
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragY(0);
  }, []);

  const moveDrag = useCallback((clientY) => {
    if (!dragState.current || !isDraggingRef.current) return;
    const delta = clientY - dragState.current.startY;
    if (delta < 0 || dragState.current.startScrollTop > 0) return;
    setDragY(delta);
  }, []);

  const endDrag = useCallback(() => {
    if (!dragState.current) return;
    const panelHeight = panelRef.current?.offsetHeight ?? 300;
    const currentDragY = dragState.current
      ? isDraggingRef.current
        ? undefined
        : 0
      : 0;

    setDragY((prev) => {
      if (prev > panelHeight * 0.3) {
        setTimeout(() => onClose(), 0);
      }
      return 0;
    });
    isDraggingRef.current = false;
    setIsDragging(false);
    dragState.current = null;
  }, [onClose]);

  // Registrar listeners en el handle con passive:false para touchmove
  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;

    const onTouchStart = (e) => startDrag(e.touches[0].clientY);
    const onTouchEnd = () => endDrag();

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [startDrag, endDrag]);

  // Registrar touchmove en document con passive:false mientras el panel está abierto.
  // Esto permite llamar preventDefault() en cualquier punto del drag,
  // no solo en el handle, evitando que el navegador haga scroll de página.
  useEffect(() => {
    if (!isOpen) return;

    const onTouchMove = (e) => {
      if (!isDraggingRef.current) return;
      e.preventDefault(); // cancela el scroll nativo del navegador
      moveDrag(e.touches[0].clientY);
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => document.removeEventListener("touchmove", onTouchMove);
  }, [isOpen, moveDrag]);

  // Mouse handlers para testing en desktop
  const handleMouseDown = (e) => startDrag(e.clientY);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => moveDrag(e.clientY);
    const onMouseUp = () => endDrag();
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, moveDrag, endDrag]);

  // ── Estilos del panel ───────────────────────────────────────────────────────
  const panelStyle = isOpen
    ? {
        transform: `translateY(${dragY}px)`,
        transition: isDragging ? "none" : "transform 300ms ease-out",
      }
    : { transform: "translateY(100%)", transition: "transform 300ms ease-out" };

  const byKey = Object.fromEntries(FILTERS.map((f) => [f.key, f]));

  // filterRest
  // Devuelve las props de un filtro sin la propiedad "key" — spreadear un
  // objeto que contiene "key" directamente en JSX genera un warning en
  // React 19 ("A props object containing a key prop is being spread...").
  // El key= se pasa aparte, explícito, en cada <FilterSection>.
  function filterRest(key) {
    const { key: _k, ...rest } = byKey[key];
    return rest;
  }

  return (
    <>
      {/* Overlay — sin blur durante el drag para ver las gráficas de fondo */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${isDragging ? "" : "backdrop-blur-sm"} ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"} `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel deslizante */}
      <div
        ref={panelRef}
        className="fixed right-0 bottom-0 left-0 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl bg-elevated shadow-2xl shadow-black/40 md:hidden"
        style={panelStyle}
      >
        {/* Área de agarre — handle + cabecera inician el drag */}
        <div ref={handleRef}>
          {/* Handle visual */}
          <div className="flex cursor-grab justify-center pt-3 pb-1 active:cursor-grabbing">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Cabecera */}
          <div
            className="flex cursor-grab items-center justify-between px-4 py-3 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <h2 className="text-base font-semibold">Filtros</h2>
            <div className="flex items-center gap-3">
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={onReset}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Resetear
              </button>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={onClose}
                aria-label="Cerrar filtros"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                <RiCloseLine className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="mx-4 h-px bg-border" />
        {/* Filtros con layout fijo para móvil — scrolleable internamente */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2 px-4 py-4">
            {/* Fila 1: País — ancho completo */}
            <FilterSection
              key="pais"
              {...filterRest("pais")}
              selected={filters.pais}
              onSelect={(v) => onFilterChange("pais", v)}
            />

            {/* Filas 2 y 3: dos columnas, botones en columna (fullWidth) dentro de cada una */}
            <div className="grid grid-cols-2 gap-3">
              <FilterSection
                key="periodo"
                {...filterRest("periodo")}
                fullWidth
                selected={filters.periodo}
                onSelect={(v) => onFilterChange("periodo", v)}
              />
              <FilterSection
                key="contrato"
                {...filterRest("contrato")}
                fullWidth
                selected={filters.contrato}
                onSelect={(v) => onFilterChange("contrato", v)}
              />
              <FilterSection
                key="jornada"
                {...filterRest("jornada")}
                fullWidth
                selected={filters.jornada}
                onSelect={(v) => onFilterChange("jornada", v)}
              />
              <FilterSection
                key="remote"
                {...filterRest("remote")}
                fullWidth
                selected={filters.remote}
                onSelect={(v) => onFilterChange("remote", v)}
              />
            </div>

            {/* Fila 4: Categoría — ancho completo */}
            <FilterSection
              key="skillCategoria"
              {...filterRest("skillCategoria")}
              selected={filters.skillCategoria}
              onSelect={(v) => onFilterChange("skillCategoria", v)}
            />
          </div>
        </div>{" "}
        {/* fin scroll area */}
        <div className="flex justify-center border-t border-border bg-transparent px-4 py-4">
          <GlowButton onClick={onClose} variant="solid">
            Ver resultados
          </GlowButton>
        </div>
      </div>
    </>
  );
}

export default FilterSheet;
