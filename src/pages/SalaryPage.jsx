import SalaryChart from "@/components/Charts/SalaryChart";

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
        <SalaryChart filters={filters} />
      </div>
    </main>
  );
}

export default SalaryPage;
