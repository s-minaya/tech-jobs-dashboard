import { lazy, Suspense } from "react";
import ChartFallback from "@/components/ui/ChartFallback";
import ChartPageLayout from "@/components/layout/ChartPageLayout";

// Code-splitting (fase 016, bloque B): la gráfica se descarga en un
// chunk aparte, no en el bundle principal — solo se pide de red al
// visitar "/top-skills". <Suspense> con ChartFallback como fallback
// evita que la página quede en blanco mientras se descarga.
const TopSkillsChart = lazy(
  () => import("@/components/Charts/TopSkillsChart"),
);

// TopSkillsPage
// Ruta "/top-skills" — skills más demandadas.
// Sidebar de filtros (desktop/tablet) vía ChartPageLayout
// (DesktopFilterSidebar).
function TopSkillsPage({ filters, onFilterChange, onReset }) {
  return (
    <ChartPageLayout
      filters={filters}
      onFilterChange={onFilterChange}
      onReset={onReset}
    >
      <Suspense fallback={<ChartFallback />}>
        <TopSkillsChart filters={filters} />
      </Suspense>
    </ChartPageLayout>
  );
}

export default TopSkillsPage;
