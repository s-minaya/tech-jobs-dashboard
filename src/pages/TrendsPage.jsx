import { lazy, Suspense } from "react";
import ChartFallback from "@/components/ui/ChartFallback";
import ChartPageLayout from "@/components/layout/ChartPageLayout";

// Code-splitting (fase 016, bloque B): la gráfica se descarga en un
// chunk aparte, no en el bundle principal — solo se pide de red al
// visitar "/tendencias". <Suspense> con ChartFallback como fallback
// evita que la página quede en blanco mientras se descarga.
const DemandByRoleChart = lazy(
  () => import("@/components/Charts/DemandByRoleChart"),
);

// TrendsPage
// Ruta "/tendencias" — evolución mensual de ofertas por rol.
// Sidebar de filtros (desktop/tablet) vía ChartPageLayout
// (DesktopFilterSidebar).
function TrendsPage({ filters, onFilterChange, onReset }) {
  return (
    <ChartPageLayout
      filters={filters}
      onFilterChange={onFilterChange}
      onReset={onReset}
    >
      <Suspense fallback={<ChartFallback />}>
        <DemandByRoleChart filters={filters} />
      </Suspense>
    </ChartPageLayout>
  );
}

export default TrendsPage;
