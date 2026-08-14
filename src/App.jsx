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
import MobileFilterSheet from "@/components/Filters/MobileFilterSheet";
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
//   Móvil (<768px):   BottomNav + MobileFilterSheet (bottom sheet desde abajo) + ThemeToggle flotante
//   Tablet/Desktop (≥768px): Header (arriba) + DesktopFilterSidebar (dentro de cada página de gráfica)
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
  // transitioning: true durante la transición landing → dashboard, desde
  // que se pulsa "Comenzar" hasta que el temporizador techo (MAX_LOADER_MS)
  // lo apaga como red de seguridad. `isLoading` (más abajo) es la
  // condición real para mostrar el loader — se deriva de este flag +
  // minElapsed + statsLoading en cada render, no se sincroniza aparte
  // con un efecto: antes había un segundo useEffect que llamaba
  // setIsLoading(false) al cumplirse esas condiciones (detectado por
  // eslint como "setState síncrono dentro de un efecto", con el coste
  // real de forzar un render extra en cada actualización) — innecesario
  // aquí porque isLoading siempre pudo calcularse en el propio render.
  const [transitioning, setTransitioning] = useState(false);
  // true una vez transcurrido MIN_LOADER_MS desde que empezó la transición.
  const [minElapsed, setMinElapsed] = useState(false);

  // useSummaryStats aquí también (fase 014): gracias a la deduplicación
  // del hook (ver src/hooks/useSummaryStats.js) esto NO dispara una
  // petición nueva — comparte la misma promesa en vuelo que ya arrancó
  // LandingPage al montar. Solo se usa `loading` para saber cuándo
  // ocultar el loader de transición.
  const { loading: statsLoading } = useSummaryStats();

  // Se oculta en cuanto se cumplen las dos condiciones: pasó el mínimo Y
  // los datos reales ya están listos (o transitioning se apagó por el
  // techo de seguridad).
  const isLoading = transitioning && !(minElapsed && !statsLoading);

  function handleEnter() {
    sessionStorage.setItem("landed", "1");
    setTransitioning(true);
    setMinElapsed(false);
    // Damos un frame para que el loader se pinte antes de montar el dashboard
    requestAnimationFrame(() => setShowLanding(false));
  }

  // Temporizadores del loader: mínimo (evita un parpadeo demasiado
  // rápido en caché caliente) y techo (red de seguridad si la petición
  // tarda de verdad). No dependen de statsLoading — si dependieran,
  // cada cambio de statsLoading los reiniciaría.
  useEffect(() => {
    if (!transitioning) return;
    const minTimer = setTimeout(() => setMinElapsed(true), MIN_LOADER_MS);
    const maxTimer = setTimeout(() => setTransitioning(false), MAX_LOADER_MS);
    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [transitioning]);

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

            {/* Rutas del dashboard — cada gráfica vive en su propia
                página, con code-splitting por ruta (`React.lazy` +
                `Suspense`). Las 5 páginas de gráfica reciben también
                onFilterChange/onReset para su propio
                DesktopFilterSidebar (md+, vive dentro de cada página
                vía ChartPageLayout, no aquí). */}
            <Routes>
              <Route path="/" element={<HomePage isDark={isDark} />} />
              <Route
                path="/top-skills"
                element={
                  <TopSkillsPage
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={resetFilters}
                  />
                }
              />
              <Route
                path="/tendencias"
                element={
                  <TrendsPage
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={resetFilters}
                  />
                }
              />
              <Route
                path="/salarios"
                element={
                  <SalaryPage
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={resetFilters}
                  />
                }
              />
              <Route
                path="/mapa"
                element={
                  <MapPage
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={resetFilters}
                  />
                }
              />
              <Route
                path="/skills"
                element={
                  <SkillsPage
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={resetFilters}
                  />
                }
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
            <MobileFilterSheet
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
