import { useFilters } from "@/hooks/useFilters";
import { useTheme } from "@/hooks/useTheme";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import { RiSunLine, RiMoonLine } from "react-icons/ri";

// Componente raíz de la aplicación.
// Delega la gestión de filtros al hook useFilters y distribuye
// el estado a Sidebar (para mostrar/cambiar) y MainContent (para filtrar datos).
// El toggle de tema vive aquí arriba a la derecha para que sea
// accesible desde cualquier parte del dashboard.

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

      <div className="flex flex-1 flex-col">
        {/* Barra superior con el toggle de tema */}
        <div className="flex justify-end px-6 pt-4">
          <button
            onClick={toggleTheme}
            aria-label={
              isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
            }
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {isDark ? (
              <RiSunLine className="h-4 w-4" />
            ) : (
              <RiMoonLine className="h-4 w-4" />
            )}
          </button>
        </div>

        <MainContent filters={filters} />
      </div>
    </div>
  );
}

export default App;
