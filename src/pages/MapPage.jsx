import { lazy, Suspense } from "react";
import ChartFallback from "@/components/ui/ChartFallback";
import ChartPageLayout from "@/components/layout/ChartPageLayout";

// Code-splitting (fase 016, bloque B): la gráfica se descarga en un
// chunk aparte, no en el bundle principal — solo se pide de red al
// visitar "/mapa". <Suspense> con ChartFallback como fallback evita que
// la página quede en blanco mientras se descarga.
const EuropeMap = lazy(() => import("@/components/Charts/EuropeMap"));

// MapPage
// Ruta "/mapa" — ofertas por país (mapa de Europa).
// Sidebar de filtros (desktop/tablet) vía ChartPageLayout
// (DesktopFilterSidebar).
function MapPage({ filters, onFilterChange, onReset }) {
  return (
    <ChartPageLayout
      filters={filters}
      onFilterChange={onFilterChange}
      onReset={onReset}
    >
      <Suspense fallback={<ChartFallback />}>
        <EuropeMap filters={filters} />
      </Suspense>
    </ChartPageLayout>
  );
}

export default MapPage;
