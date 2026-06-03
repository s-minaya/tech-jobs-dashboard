import {
  RiHome5Line,
  RiHome5Fill,
  RiLineChartLine,
  RiLineChartFill,
  RiMapLine,
  RiMapFill,
  RiGridLine,
  RiGridFill,
  RiEqualizerLine,
  RiEqualizerFill,
} from "react-icons/ri";

// Secciones del dashboard con sus anclas de navegación.
// Cada id debe coincidir con el id del elemento en MainContent.
const NAV_ITEMS = [
  {
    id: "inicio",
    label: "Inicio",
    icon: RiHome5Line,
    iconActive: RiHome5Fill,
  },
  {
    id: "tendencias",
    label: "Tendencias",
    icon: RiLineChartLine,
    iconActive: RiLineChartFill,
  },
  {
    id: "mapa",
    label: "Mapa",
    icon: RiMapLine,
    iconActive: RiMapFill,
  },
  {
    id: "skills",
    label: "Skills",
    icon: RiGridLine,
    iconActive: RiGridFill,
  },
  {
    id: "filtros",
    label: "Filtros",
    icon: RiEqualizerLine,
    iconActive: RiEqualizerFill,
  },
];

// BottomNav
// Barra de navegación inferior fija, solo visible en móvil (md:hidden).
// Cada botón hace scroll suave hasta la sección correspondiente.
// El botón de Filtros abre el panel de filtros (onOpenFilters).
// El item activo se resalta con el color primary.
//
// position: fixed bottom-0 garantiza que siempre esté visible
// aunque el usuario haga scroll. pb-safe respeta el área segura
// de iPhones con notch inferior.
function BottomNav({ activeSection, onOpenFilters }) {
  function handleClick(item) {
    if (item.id === "filtros") {
      onOpenFilters();
      return;
    }
    const el = document.getElementById(item.id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 md:hidden">
      {/* Fondo con blur para separar visualmente del contenido */}
      <div className="border-t border-border bg-background/95 backdrop-blur-md">
        <div className="pb-safe flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = isActive ? item.iconActive : item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className="flex flex-col items-center gap-0.5 px-3 py-1"
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] transition-colors ${
                    isActive
                      ? "font-medium text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default BottomNav;
