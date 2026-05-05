import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";

// Estado inicial de los filtros. Cada key coincide con la propiedad
// key definida en config/filters.js, lo que permite conectarlos dinámicamente

const initialFilters = {
  pais: "Todos",
  periodo: "Últimos 30 días",
  contrato: "Todos",
  jornada: "Todos",
  remote: "Todos",
  skillCategoria: "Todas",
};

// Componente raíz. Gestiona el estado global de los filtros y lo
// distribuye hacia abajo: Sidebar los muestra y MainContent los consume.
function App() {
  const [filters, setFilters] = useState(initialFilters);

  // Actualiza un único filtro sin tocar el resto del estado.
  // key → qué filtro cambiar (ej: "pais"), value → nuevo valor (ej: "ES")
  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar filters={filters} onFilterChange={handleFilterChange} />
      <MainContent filters={filters} />
    </div>
  );
}

export default App;
