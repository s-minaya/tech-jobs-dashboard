import TopSkillsChart from "./Charts/TopSkillsChart";
import DemandByRoleChart from "./Charts/DemandByRoleChart";
import SalaryChart from "./Charts/SalaryChart";
import EuropeMap from "./Charts/EuropeMap";
import SkillHeatmap from "./Charts/SkillHeatmap";
import SummaryStats from "./SummaryStats";
import ThemeToggle from "./ui/ThemeToggle";

// Área principal del dashboard. Distribuye los filtros activos a cada
// visualización y muestra los KPI cards en la cabecera.
function MainContent({ filters, isDark, toggleTheme }) {
  return (
    <main className="min-w-0 flex-1">
      <div
        className="relative px-6 pt-8 pb-32"
        style={{
          background:
            "linear-gradient(125deg, #d8b4fe 0%, #a855f7 40%, #8644FE 80%,  #020617 100%)",
          maskImage:
            "radial-gradient(ellipse 85% 90% at 50% 0%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 90% at 50% 0%, black 40%, transparent 100%)",
        }}
      >
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>

        <div className="relative z-10 mt-2 text-center">
          <p className="mb-1 text-xs font-medium text-white uppercase">
            Mercado tech europeo
          </p>
          <h1 className="text-3xl font-bold text-white">Tech Jobs Dashboard</h1>
        </div>
      </div>

      {/* KPI cards: indicadores globales del dataset, independientes de los filtros */}
      <div className="relative z-20 -mt-24 px-6">
        <SummaryStats />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 gap-4 px-6 pt-2 pb-6">
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
