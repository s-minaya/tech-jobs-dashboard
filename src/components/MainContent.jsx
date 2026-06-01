import TopSkillsChart from "./Charts/TopSkillsChart";
import DemandByRoleChart from "./Charts/DemandByRoleChart";
import SalaryChart from "./Charts/SalaryChart";
import EuropeMap from "./Charts/EuropeMap";
import SkillHeatmap from "./Charts/SkillHeatmap";
import SummaryStats from "./SummaryStats";

// Área principal del dashboard. Distribuye los filtros activos a cada
// visualización y muestra los KPI cards en la cabecera.
function MainContent({ filters }) {
  return (
    <main className="flex-1 p-6">
      <h1 className="mb-4 text-2xl font-bold">Tech Jobs Dashboard</h1>

      {/* KPI cards: indicadores globales del dataset, independientes de los filtros */}
      <SummaryStats />

      <div className="grid grid-cols-1 gap-4">
        <TopSkillsChart filters={filters} />
        <DemandByRoleChart filters={filters} />
        <SalaryChart filters={filters} />
        <EuropeMap filters={filters} />
        <SkillHeatmap filters={filters} />
      </div>
    </main>
  );
}

export default MainContent;
