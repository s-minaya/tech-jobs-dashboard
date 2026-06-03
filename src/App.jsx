import { useFilters } from "@/hooks/useFilters";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import BottomNav from "@/components/BottomNav";

// Componente raíz de la aplicación.
// Gestiona filtros, tema y sección activa del bottom nav.
// En desktop: sidebar lateral visible.
// En móvil: sidebar oculto, bottom nav fijo con anclas a cada sección.
// Delega la gestión de filtros al hook useFilters y distribuye
// el estado a Sidebar (para mostrar/cambiar) y MainContent (para filtrar datos).
// El toggle de tema se pasa a MainContent para que lo coloque
// dentro del hero, evitando que un div extra rompa el layout.

function App() {
  const { filters, handleFilterChange, resetFilters } = useFilters();
  const { isDark, toggleTheme } = useTheme();

  // Sección activa para resaltar el icono correspondiente en el bottom nav.
  // Por defecto "inicio" al cargar la página.
  const [activeSection, setActiveSection] = useState("inicio");

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

      {/* Bottom nav: solo visible en móvil (md:hidden interno al componente)
          onOpenFilters se implementará en el siguiente commit */}
      <BottomNav activeSection={activeSection} onOpenFilters={() => {}} />
    </div>
  );
}

export default App;
