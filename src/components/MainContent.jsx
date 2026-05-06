// Área principal del dashboard.
// Recibe los filtros activos para pasárselos a las gráficas cuando estén conectadas a datos reales.
import TopSkillsChart from "./Charts/TopSkillsChart";
import DemandByRoleChart from "./Charts/DemandByRoleChart";
import SalaryChart from "./Charts/SalaryChart";
import EuropeMap from "./Charts/EuropeMap";
import SkillCoOccurrenceTable from "./Charts/SkillCoOccurrenceTable";

function MainContent({ filters }) {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold">Tech Jobs Dashboard</h1>
      <TopSkillsChart />
      <DemandByRoleChart />
      <SalaryChart />
      <EuropeMap />
      <SkillCoOccurrenceTable />
    </main>
  );
}

export default MainContent;
