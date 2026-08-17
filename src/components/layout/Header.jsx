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
// (hidden md:flex — en móvil la navegación es BottomNav). Sin fondo
// propio, a propósito: los enlaces flotan directamente sobre lo que
// haya detrás (el fondo animado del hero en "/", el fondo normal de la
// página en el resto de rutas) — sigue siendo semánticamente un
// <header>, pero no se comporta como una barra opaca.
//
// `sticky top-0` en vez de `fixed`: al ser flujo normal, el navegador
// reserva su espacio solo, sin tener que añadir padding-top a cada
// página como sí hace falta con el `fixed bottom-0` de BottomNav.
// `sticky` también sirve de referencia de posición para el
// `ThemeToggle` (`absolute` dentro de este `header`).
//
// Reutiliza `ROUTE_ITEMS` de `src/config/navigation.js`, la misma
// fuente que usa `BottomNav` — un solo sitio donde añadir/quitar una
// ruta navegable. El estado activo lo resuelve `NavLink` a partir de
// la URL, igual que en móvil; el estilo activo reutiliza `aurora-text`
// (mismo acento que ya usa BottomNav para su ítem activo).
//
// No lleva filtros propios — DesktopFilterSidebar (bloque D) vive
// dentro de cada página de gráfica, no en este chrome global.
//
// Prefetch en hover (bloque E, opcional): al pasar el ratón por un
// link se dispara el mismo `import()` dinámico que usa `React.lazy()`
// para esa gráfica (`item.prefetch`, definido en `navigation.js`), así
// el chunk ya está descargado (o en vuelo) cuando el usuario pulsa de
// verdad. "/" no tiene `prefetch` (sin gráfica que precargar).
function Header({ isDark, toggleTheme }) {
  return (
    <header className="sticky top-0 z-40 hidden md:flex md:items-center md:justify-center md:px-8 md:py-3">
      <nav className="flex items-center gap-1">
        {ROUTE_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onMouseEnter={item.prefetch}
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

      <div className="absolute top-1/2 right-8 -translate-y-1/2">
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>
    </header>
  );
}

export default Header;
