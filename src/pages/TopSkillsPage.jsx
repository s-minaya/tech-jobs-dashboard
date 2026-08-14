import { lazy, Suspense } from "react";
import ChartFallback from "@/components/ui/ChartFallback";

// Code-splitting (fase 016, bloque B): la gráfica se descarga en un
// chunk aparte, no en el bundle principal — solo se pide de red al
// visitar "/top-skills". <Suspense> con ChartFallback como fallback
// evita que la página quede en blanco mientras se descarga.
const TopSkillsChart = lazy(
  () => import("@/components/Charts/TopSkillsChart"),
);

// TopSkillsPage
// Ruta "/top-skills" — skills más demandadas.
// Sidebar de filtros (desktop/tablet) llega en el bloque D de la fase
// 016 (`DesktopFilterSidebar`) — de momento solo la gráfica.
function TopSkillsPage({ filters }) {
  return (
    <main className="w-full min-w-0 flex-1 pb-20 md:pb-0">
      <div className="grid grid-cols-1 gap-4 px-6 pt-6 pb-6">
        <Suspense fallback={<ChartFallback />}>
          <TopSkillsChart filters={filters} />
        </Suspense>
      </div>
    </main>
  );
}

export default TopSkillsPage;
