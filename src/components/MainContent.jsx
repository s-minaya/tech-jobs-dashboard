// Área principal del dashboard.
// Distribuye los filtros activos a cada visualización para que
// cada chart los envíe como query params a la API.
import TopSkillsChart from "./Charts/TopSkillsChart";
import DemandByRoleChart from "./Charts/DemandByRoleChart";
import SalaryChart from "./Charts/SalaryChart";
import EuropeMap from "./Charts/EuropeMap";
import SkillHeatmap from "./Charts/SkillHeatmap";

function MainContent({ filters }) {
  return (
    <main className="flex-1 p-6">
      <h1 className="mb-6 text-2xl font-bold">Tech Jobs Dashboard</h1>
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
