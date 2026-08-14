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
// Ruta "/top-skills" — skills más demandadas. Vivía en "/" en el
// diseño original de esta feature; se movió aquí porque "/" no lleva
// sidebar de filtros en tablet/desktop (decisión ya tomada, ver
// 016-spec.md), así que se quedaba como la única gráfica sin ningún
// control de filtro propio ahí. Con ruta propia recibe el mismo
// tratamiento que el resto: `DesktopFilterSidebar` llega en el
// bloque D.
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
