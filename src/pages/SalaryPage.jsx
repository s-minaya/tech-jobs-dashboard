import { lazy, Suspense } from "react";
import ChartFallback from "@/components/ui/ChartFallback";

// Code-splitting (fase 016, bloque B): la gráfica se descarga en un
// chunk aparte, no en el bundle principal — solo se pide de red al
// visitar "/salarios". <Suspense> con ChartFallback como fallback evita
// que la página quede en blanco mientras se descarga.
const SalaryChart = lazy(() => import("@/components/Charts/SalaryChart"));

// SalaryPage
// Ruta "/salarios" — salario por rol y país. Antes vivía junto a
// DemandByRoleChart en la sección "tendencias" de MainContent.jsx; la
// fase 016 le da ruta propia (ver 016-spec.md, "Qué hace").
// Sidebar de filtros (desktop/tablet) llega en el bloque D
// (`DesktopFilterSidebar`) — de momento solo la gráfica.
function SalaryPage({ filters }) {
  return (
    <main className="w-full min-w-0 flex-1 pb-20 md:pb-0">
      <div className="grid grid-cols-1 gap-4 px-6 pt-6 pb-6">
        <Suspense fallback={<ChartFallback />}>
          <SalaryChart filters={filters} />
        </Suspense>
      </div>
    </main>
  );
}

export default SalaryPage;
