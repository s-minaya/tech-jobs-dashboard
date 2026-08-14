import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useFilters } from "@/hooks/useFilters";
import { useTheme } from "@/hooks/useTheme";
import { useSummaryStats } from "@/hooks/useSummaryStats";
import HomePage from "@/pages/HomePage";
import TopSkillsPage from "@/pages/TopSkillsPage";
import TrendsPage from "@/pages/TrendsPage";
import SalaryPage from "@/pages/SalaryPage";
import MapPage from "@/pages/MapPage";
import SkillsPage from "@/pages/SkillsPage";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import FilterSheet from "@/components/Filters/FilterSheet";
import FilterDrawer, { FilterFAB } from "@/components/Filters/FilterDrawer";
import LandingPage from "@/components/landing/LandingPage";
import PageLoader from "@/components/ui/PageLoader";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Duración del loader de transición landing→dashboard (fase 014):
// antes era un setTimeout fijo de 800ms sin ninguna relación con si los
// datos reales ya habían cargado — con GET /api/stats/summary pudiendo
// tardar 22-56s+ (ver spec/features/014-summary-stats-quality/), el
// loader desaparecía mucho antes de tiempo y el usuario caía sobre KPI
// cards todavía en skeleton, dando la sensación de que "algo se quedaba
// cargando". Ahora espera un mínimo (evita un parpadeo demasiado
// rápido) Y a que los datos estén listos — con un techo duro por si la
// petición tarda de verdad, para no depender al 100% de que siempre
// resuelva rápido.
const MIN_LOADER_MS = 500;
// Subido de 4s a 10s en la ronda 3 de la fase 014, mismo motivo que
// LANDING_LOADER_MAX_MS en LandingPage.jsx: defensa en profundidad por
// si el usuario entra al dashboard justo en el margen frío entre el
// arranque del servidor y que su calentamiento de caché termine.
const MAX_LOADER_MS = 10000;

// App
// Componente raíz. Gestiona filtros, tema y visibilidad de los paneles
// de filtros/navegación según el tamaño de pantalla. La ruta activa la
// resuelve `NavLink` a partir de la URL, sin estado propio para eso:
//
//   Móvil (<768px):   BottomNav + FilterSheet (bottom sheet desde abajo) + ThemeToggle flotante
//   Tablet/Desktop (≥768px): Header (arriba) + FilterFAB flotante + FilterDrawer (desde la izquierda)
//
//
// La LandingPage bloquea el acceso al dashboard hasta que el usuario
// pulsa "Comenzar". Se persiste en sessionStorage para no mostrarla
// en cada recarga durante la misma sesión.
// El dashboard no se monta en el DOM mientras la landing está activa —
// evita el flash de contenido y que se lancen peticiones a la API antes de tiempo.
function App() {
  const { filters, handleFilterChange, resetFilters } = useFilters();
  const { isDark, toggleTheme } = useTheme();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // showLanding: true mientras el usuario no ha pulsado "Comenzar".
  // sessionStorage evita que la landing aparezca en cada recarga.
  const [showLanding, setShowLanding] = useState(
    () => sessionStorage.getItem("landed") !== "1",
  );
  // isLoading: true durante la transición landing → dashboard.
  // Se activa al pulsar Comenzar y se desactiva cuando el dashboard
  // está montado y listo — evita mostrar el dashboard a medio renderizar.
  const [isLoading, setIsLoading] = useState(false);
  // true una vez transcurrido MIN_LOADER_MS desde que isLoading se activó.
  const [minElapsed, setMinElapsed] = useState(false);

  // useSummaryStats aquí también (fase 014): gracias a la deduplicación
  // del hook (ver src/hooks/useSummaryStats.js) esto NO dispara una
  // petición nueva — comparte la misma promesa en vuelo que ya arrancó
  // LandingPage al montar. Solo se usa `loading` para saber cuándo
  // ocultar el loader de transición.
  const { loading: statsLoading } = useSummaryStats();

  function handleEnter() {
    sessionStorage.setItem("landed", "1");
    setIsLoading(true);
    setMinElapsed(false);
    // Damos un frame para que el loader se pinte antes de montar el dashboard
    requestAnimationFrame(() => setShowLanding(false));
  }

  // Temporizadores del loader: mínimo (evita un parpadeo demasiado
  // rápido en caché caliente) y techo (red de seguridad si la petición
  // tarda de verdad). No dependen de statsLoading — si dependieran,
  // cada cambio de statsLoading los reiniciaría.
  useEffect(() => {
    if (!isLoading) return;
    const minTimer = setTimeout(() => setMinElapsed(true), MIN_LOADER_MS);
    const maxTimer = setTimeout(() => setIsLoading(false), MAX_LOADER_MS);
    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [isLoading]);

  // Oculta el loader en cuanto se cumplen las dos condiciones: pasó el
  // mínimo Y los datos reales ya están listos.
  useEffect(() => {
    if (isLoading && minElapsed && !statsLoading) setIsLoading(false);
  }, [isLoading, minElapsed, statsLoading]);

  return (
    // bg-white en light, bg-black en dark — fondo base de toda la página.
    // El DarkVeil vive dentro del hero en HomePage.
    <div className="relative min-h-screen bg-white dark:bg-black">
      <div className="relative z-10">
        {/* Loader de transición — visible hasta que pasa MIN_LOADER_MS
            y los datos reales están listos, con techo MAX_LOADER_MS */}
        {isLoading && <PageLoader />}

        {showLanding ? (
          /* Landing page — mientras está activa el dashboard no existe en el DOM,
             evitando el flash de contenido y peticiones prematuras a la API. */
          <LandingPage onEnter={handleEnter} />
        ) : (
          <>
            {/* Header: solo visible en tablet/desktop (hidden md:flex
                interno al componente) — navegación por rutas + ThemeToggle */}
            <Header isDark={isDark} toggleTheme={toggleTheme} />

            {/* ThemeToggle flotante — solo móvil (md:hidden), position
                fixed para verse en cualquier ruta y con cualquier
                scroll. En md+ ya lo aloja Header, de ahí md:hidden
                aquí. */}
            <div className="fixed top-6 right-6 z-30 md:hidden">
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            </div>

            {/* FAB de filtros — visible solo en md+, oculto en móvil */}
            <FilterFAB filters={filters} onClick={() => setFiltersOpen(true)} />

            {/* Drawer de filtros — tablet y desktop */}
            <FilterDrawer
              isOpen={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
            />

            {/* Rutas del dashboard — cada gráfica vive en su propia
                página, con code-splitting por ruta (`React.lazy` +
                `Suspense`). Sidebar de filtros en las 5 páginas de
                gráfica todavía pendiente (bloque D). */}
            <Routes>
              <Route path="/" element={<HomePage isDark={isDark} />} />
              <Route
                path="/top-skills"
                element={<TopSkillsPage filters={filters} />}
              />
              <Route
                path="/tendencias"
                element={<TrendsPage filters={filters} />}
              />
              <Route
                path="/salarios"
                element={<SalaryPage filters={filters} />}
              />
              <Route path="/mapa" element={<MapPage filters={filters} />} />
              <Route
                path="/skills"
                element={<SkillsPage filters={filters} />}
              />
            </Routes>

            {/* Bottom nav: solo visible en móvil (md:hidden interno al
                componente). NavLink resuelve el ítem activo a partir de
                la URL. */}
            <BottomNav
              onOpenFilters={() => setFiltersOpen(true)}
              filters={filters}
            />

            {/* Panel de filtros móvil: bottom sheet desde abajo */}
            <FilterSheet
              isOpen={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
