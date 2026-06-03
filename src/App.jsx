import { useFilters } from "@/hooks/useFilters";
import { useTheme } from "@/hooks/useTheme";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";

// Componente raíz de la aplicación.
// Delega la gestión de filtros al hook useFilters y distribuye
// el estado a Sidebar (para mostrar/cambiar) y MainContent (para filtrar datos).
// El toggle de tema se pasa a MainContent para que lo coloque
// dentro del hero, evitando que un div extra rompa el layout.

function App() {
  const { filters, handleFilterChange, resetFilters } = useFilters();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
      />
      <MainContent
        filters={filters}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
    </div>
  );
}

export default App;
