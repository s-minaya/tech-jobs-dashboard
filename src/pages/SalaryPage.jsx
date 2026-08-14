import { lazy, Suspense } from "react";
import ChartFallback from "@/components/ui/ChartFallback";
import ChartPageLayout from "@/components/layout/ChartPageLayout";

// Code-splitting (fase 016, bloque B): la gráfica se descarga en un
// chunk aparte, no en el bundle principal — solo se pide de red al
// visitar "/salarios". <Suspense> con ChartFallback como fallback evita
// que la página quede en blanco mientras se descarga.
const SalaryChart = lazy(() => import("@/components/Charts/SalaryChart"));

// SalaryPage
// Ruta "/salarios" — salario por rol y país.
// Sidebar de filtros (desktop/tablet) vía ChartPageLayout
// (DesktopFilterSidebar).
function SalaryPage({ filters, onFilterChange, onReset }) {
  return (
    <ChartPageLayout
      filters={filters}
      onFilterChange={onFilterChange}
      onReset={onReset}
    >
      <Suspense fallback={<ChartFallback />}>
        <SalaryChart filters={filters} />
      </Suspense>
    </ChartPageLayout>
  );
}

export default SalaryPage;
