import { useFilters } from "@/hooks/useFilters";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";

// Componente raíz de la aplicación.
// Delega la gestión de filtros al hook useFilters y distribuye
// el estado a Sidebar (para mostrar/cambiar) y MainContent (para filtrar datos).
function App() {
  const { filters, handleFilterChange, resetFilters } = useFilters();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
      />
      <MainContent filters={filters} />
    </div>
  );
}

export default App;
