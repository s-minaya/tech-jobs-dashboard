import { useState, useEffect } from "react";
import { useFilters } from "@/hooks/useFilters";
import { useTheme } from "@/hooks/useTheme";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import BottomNav from "@/components/BottomNav";
import FilterSheet from "@/components/Filters/FilterSheet";

// App
// Componente raíz. Gestiona filtros, tema, sección activa del bottom nav
// y visibilidad del panel de filtros móvil (FilterSheet).
//
// En desktop: sidebar lateral visible, FilterSheet nunca se muestra.
// En móvil: sidebar oculto, bottom nav fijo, FilterSheet se abre al
// pulsar el icono de filtros del navbar.
function App() {
  const { filters, handleFilterChange, resetFilters } = useFilters();
  const { isDark, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("inicio");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar: visible en md+, oculto en móvil */}
      <Sidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
      />

      {/* Contenido principal */}
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

      {/* Panel de filtros móvil: se desliza desde abajo al pulsar el icono */}
      <FilterSheet
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
      />
    </div>
  );
}

export default App;
