import { NavLink } from "react-router-dom";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { ROUTE_ITEMS } from "@/config/navigation";

const linkBase =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150";
// Mismo lenguaje visual que FilterChip (chip redondeado, borde sutil,
// hover con borde primary) — no se inventa un estilo de nav nuevo.
const linkInactive =
  "border-transparent text-muted-foreground hover:border-border hover:text-foreground";
const linkActive = "border-primary/30 bg-primary/10";

// Header
// Barra superior de navegación, solo visible en tablet/desktop
// (hidden md:flex — en móvil la navegación es BottomNav). `sticky
// top-0` en vez de `fixed`: al ser flujo normal, el navegador reserva
// su espacio solo, sin tener que añadir padding-top a cada página como
// sí hace falta con el `fixed bottom-0` de BottomNav.
//
// Reutiliza `ROUTE_ITEMS` de `src/config/navigation.js`, la misma
// fuente que usa `BottomNav` — un solo sitio donde añadir/quitar una
// ruta navegable. El estado activo lo resuelve `NavLink` a partir de
// la URL, igual que en móvil; el estilo activo reutiliza `aurora-text`
// (mismo acento que ya usa BottomNav para su ítem activo).
//
// No lleva filtros propios — DesktopFilterSidebar (bloque D) vive
// dentro de cada página de gráfica, no en este chrome global.
function Header({ isDark, toggleTheme }) {
  return (
    <header className="sticky top-0 z-40 hidden border-b border-border bg-elevated/95 backdrop-blur-md md:flex md:items-center md:justify-between md:gap-6 md:px-8 md:py-3">
      <NavLink
        to="/"
        end
        className="shrink-0 font-heading text-base font-bold tracking-tight text-foreground"
      >
        Tech Jobs <span className="text-primary">Dashboard</span>
      </NavLink>

      <nav className="flex flex-1 items-center justify-center gap-1">
        {ROUTE_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            {({ isActive }) => {
              const Icon = isActive ? item.iconActive : item.icon;
              return (
                <>
                  <Icon
                    className={`h-4 w-4 ${isActive ? "aurora-icon" : ""}`}
                  />
                  <span className={isActive ? "aurora-text" : ""}>
                    {item.label}
                  </span>
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0">
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>
    </header>
  );
}

export default Header;
