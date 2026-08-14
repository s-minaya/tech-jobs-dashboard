import DemandByRoleChart from "@/components/Charts/DemandByRoleChart";

// TrendsPage
// Ruta "/tendencias" — evolución mensual de ofertas por rol.
// Sidebar de filtros (desktop/tablet) llega en el bloque D de la fase
// 016 (`DesktopFilterSidebar`) — de momento solo la gráfica, igual que
// hacía `MainContent.jsx` antes de dividirse en páginas.
function TrendsPage({ filters }) {
  return (
    <main className="w-full min-w-0 flex-1 pb-20 md:pb-0">
      <div className="grid grid-cols-1 gap-4 px-6 pt-6 pb-6">
        <DemandByRoleChart filters={filters} />
      </div>
    </main>
  );
}

export default TrendsPage;
