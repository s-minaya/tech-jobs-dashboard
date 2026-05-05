// Área principal del dashboard.
// Recibe los filtros activos para pasárselos a las gráficas cuando estén conectadas a datos reales.
import TopSkillsChart from "./Charts/TopSkillsChart";

function MainContent({ filters }) {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold">Tech Jobs Dashboard</h1>
      <TopSkillsChart />
    </main>
  );
}

export default MainContent;
