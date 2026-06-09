import { useState, useEffect } from "react";
import { useFilters } from "@/hooks/useFilters";
import { useTheme } from "@/hooks/useTheme";
import MainContent from "@/components/MainContent";
import BottomNav from "@/components/BottomNav";
import FilterSheet from "@/components/Filters/FilterSheet";
import FilterDrawer, { FilterFAB } from "@/components/FilterDrawer";

// App
// Componente raíz. Gestiona filtros, tema, sección activa y visibilidad
// de los paneles de filtros según el tamaño de pantalla:
//
//   Móvil (<768px):   bottom nav + FilterSheet (bottom sheet desde abajo)
//   Tablet/Desktop (≥768px): FilterFAB flotante + FilterDrawer (desde la izquierda)
//
// El Sidebar lateral ha sido eliminado — en todos los tamaños los filtros
// se acceden mediante el FAB para no robar espacio a las gráficas.
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
    <div className="min-h-screen bg-background">
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
    </div>
  );
}

export default App;
