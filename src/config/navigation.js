import {
  RiHome5Line,
  RiHome5Fill,
  RiLineChartLine,
  RiLineChartFill,
  RiMoneyEuroCircleLine,
  RiMoneyEuroCircleFill,
  RiMapLine,
  RiMapFill,
  RiGridLine,
  RiGridFill,
  RiBarChartLine,
  RiBarChartFill,
} from "react-icons/ri";

// ROUTE_ITEMS
// Configuración compartida de las 6 rutas navegables del dashboard
// (fase 016, bloque C) — una sola fuente de verdad para `BottomNav.jsx`
// (móvil) y `Header.jsx` (md+), que renderizan el mismo conjunto de
// enlaces con presentación distinta. "Filtros" no está aquí: no es una
// ruta, cada chrome la resuelve a su manera (MobileFilterSheet vía
// BottomNav; sin filtros propios en Header, ver DesktopFilterSidebar).
//
// `end: true` en Inicio: sin él, NavLink marca "/" como activo en
// cualquier ruta — por defecto compara con startsWith y todo path
// empieza por "/". No es un problema de rutas anidadas, pasa igual con
// rutas hermanas sueltas como las de este proyecto.
export const ROUTE_ITEMS = [
  {
    path: "/",
    end: true,
    label: "Inicio",
    icon: RiHome5Line,
    iconActive: RiHome5Fill,
  },
  {
    path: "/tendencias",
    label: "Tendencias",
    icon: RiLineChartLine,
    iconActive: RiLineChartFill,
  },
  {
    path: "/salarios",
    label: "Salarios",
    icon: RiMoneyEuroCircleLine,
    iconActive: RiMoneyEuroCircleFill,
  },
  { path: "/mapa", label: "Mapa", icon: RiMapLine, iconActive: RiMapFill },
  {
    path: "/skills",
    label: "Skills",
    icon: RiGridLine,
    iconActive: RiGridFill,
  },
  {
    path: "/top-skills",
    label: "Top Skills",
    icon: RiBarChartLine,
    iconActive: RiBarChartFill,
  },
];
