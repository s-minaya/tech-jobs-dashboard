import { useState, useEffect } from "react";
import { useFilters } from "@/hooks/useFilters";
import { useTheme } from "@/hooks/useTheme";
import MainContent from "@/components/layout/MainContent";
import BottomNav from "@/components/layout/BottomNav";
import FilterSheet from "@/components/Filters/FilterSheet";
import FilterDrawer, { FilterFAB } from "@/components/Filters/FilterDrawer";
import LandingPage from "@/components/landing/LandingPage";
import PageLoader from "@/components/ui/PageLoader";

// App
// Componente raíz. Gestiona filtros, tema, sección activa y visibilidad
// de los paneles de filtros según el tamaño de pantalla:
//
//   Móvil (<768px):   bottom nav + FilterSheet (bottom sheet desde abajo)
//   Tablet/Desktop (≥768px): FilterFAB flotante + FilterDrawer (desde la izquierda)
//
// El Sidebar lateral ha sido eliminado — en todos los tamaños los filtros
// se acceden mediante el FAB para no robar espacio a las gráficas.
//
// La LandingPage bloquea el acceso al dashboard hasta que el usuario
// pulsa "Comenzar". Se persiste en sessionStorage para no mostrarla
// en cada recarga durante la misma sesión.
// El dashboard no se monta en el DOM mientras la landing está activa —
// evita el flash de contenido y que se lancen peticiones a la API antes de tiempo.
function App() {
  const { filters, handleFilterChange, resetFilters } = useFilters();
  const { isDark, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("inicio");
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

  function handleEnter() {
    sessionStorage.setItem("landed", "1");
    setIsLoading(true);
    // Damos un frame para que el loader se pinte antes de montar el dashboard
    requestAnimationFrame(() => {
      setShowLanding(false);
      // El loader se oculta tras un breve delay para que el dashboard
      // haya tenido tiempo de renderizar su primer frame
      setTimeout(() => setIsLoading(false), 1500);
    });
  }

  // IntersectionObserver: detecta qué sección ocupa más espacio en el viewport
  // y actualiza activeSection. threshold: 0.3 = sección visible al 30%.
  useEffect(() => {
    const sectionIds = ["inicio", "tendencias", "mapa", "skills"];
    const observers = [];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.3 },
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    // bg-white en light, bg-black en dark — fondo base de toda la página.
    // El DarkVeil vive ahora solo dentro del hero en MainContent.
    <div className="relative min-h-screen bg-white dark:bg-black">
      <div className="relative z-10">
        {/* Loader de transición — visible durante los 800ms entre landing y dashboard */}
        {isLoading && <PageLoader />}

        {showLanding ? (
          /* Landing page — mientras está activa el dashboard no existe en el DOM,
             evitando el flash de contenido y peticiones prematuras a la API. */
          <LandingPage onEnter={handleEnter} />
        ) : (
          <>
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

            {/* Contenido principal — ahora ocupa todo el ancho sin sidebar */}
            <MainContent
              filters={filters}
              isDark={isDark}
              toggleTheme={toggleTheme}
            />

            {/* Bottom nav: solo visible en móvil (md:hidden interno al componente) */}
            <BottomNav
              activeSection={activeSection}
              onOpenFilters={() => setFiltersOpen(true)}
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
