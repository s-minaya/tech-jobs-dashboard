import { lazy, Suspense } from "react";
import ChartFallback from "@/components/ui/ChartFallback";
import ChartPageLayout from "@/components/layout/ChartPageLayout";

// Code-splitting (fase 016, bloque B): la gráfica se descarga en un
// chunk aparte, no en el bundle principal — solo se pide de red al
// visitar "/skills". <Suspense> con ChartFallback como fallback evita
// que la página quede en blanco mientras se descarga.
const SkillHeatmap = lazy(() => import("@/components/Charts/SkillHeatmap"));

// SkillsPage
// Ruta "/skills" — heatmap de co-ocurrencia de skills.
// Sidebar de filtros (desktop/tablet) vía ChartPageLayout
// (DesktopFilterSidebar).
function SkillsPage({ filters, onFilterChange, onReset }) {
  return (
    <ChartPageLayout
      filters={filters}
      onFilterChange={onFilterChange}
      onReset={onReset}
    >
      <Suspense fallback={<ChartFallback />}>
        <SkillHeatmap filters={filters} />
      </Suspense>
    </ChartPageLayout>
  );
}

export default SkillsPage;
