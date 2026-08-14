import { NavLink } from "react-router-dom";
import { RiEqualizerLine } from "react-icons/ri";
import { activeFilterCount } from "@/lib/filterUtils";
import { ROUTE_ITEMS } from "@/config/navigation";

// BottomNav
// Barra de navegación inferior fija, solo visible en móvil (md:hidden).
// Cada ítem de ruta es un <NavLink> real: navega y resuelve el estado
// activo a partir de la URL, sin estado propio. El botón de Filtros no
// es una ruta: abre el `MobileFilterSheet` (onOpenFilters) y muestra un
// badge con el número de filtros activos.
//
// position: fixed bottom-0 garantiza que siempre esté visible
// aunque el usuario haga scroll. pb-safe respeta el área segura
// de iPhones con notch inferior.
//
// 7 ítems: apretado en pantallas muy estrechas — padding horizontal
// reducido (px-1.5) a propósito para que quepan sin desbordar; es un
// ajuste de tamaño, no de diseño final (ver 016-plan.md, "Riesgos").
function BottomNav({ onOpenFilters, filters }) {
  const filterCount = activeFilterCount(filters);
  const itemClass =
    "relative flex flex-col items-center gap-0.5 px-1.5 py-1 transition-transform duration-150 outline-none active:scale-90";

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 md:hidden">
      {/* Fondo con blur para separar visualmente del contenido */}
      <div className="border-t border-border bg-elevated/95 backdrop-blur-md">
        <div className="pb-safe flex items-center justify-around px-1 py-2">
          {ROUTE_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end} className={itemClass}>
              {({ isActive }) => {
                const Icon = isActive ? item.iconActive : item.icon;
                return (
                  <>
                    <span className={`relative ${isActive ? "aurora-icon" : ""}`}>
                      <Icon
                        className={`h-5 w-5 transition-colors ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </span>
                    {isActive ? (
                      <span className="aurora-text text-[10px] font-semibold">
                        {item.label}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {item.label}
                      </span>
                    )}
                  </>
                );
              }}
            </NavLink>
          ))}

          {/* Filtros: no es una ruta, abre MobileFilterSheet */}
          <button onClick={onOpenFilters} className={itemClass}>
            <span className="relative">
              <RiEqualizerLine className="h-5 w-5 text-muted-foreground transition-colors" />
              {filterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-md">
                  {filterCount}
                </span>
              )}
            </span>
            <span className="text-[10px] text-muted-foreground">Filtros</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default BottomNav;
