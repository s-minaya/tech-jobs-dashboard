import TopSkillsChart from "./Charts/TopSkillsChart";
import DemandByRoleChart from "./Charts/DemandByRoleChart";
import SalaryChart from "./Charts/SalaryChart";
import EuropeMap from "./Charts/EuropeMap";
import SkillHeatmap from "./Charts/SkillHeatmap";
import SummaryStats from "./SummaryStats";
import ThemeToggle from "./ui/ThemeToggle";

// MainContent
// Área principal del dashboard.
// Cada sección tiene un id para que BottomNav pueda hacer scroll hasta ella.
// pb-20 en el wrapper evita que el bottom nav tape el contenido al llegar al final.
function MainContent({ filters, isDark, toggleTheme }) {
  return (
    <main className="min-w-0 flex-1 pb-20 md:pb-0">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div id="inicio">
        <div
          className="relative px-6 pt-8 pb-32"
          style={{
            background:
              "linear-gradient(125deg, #d8b4fe 0%, #a855f7 40%, #8644FE 80%, #020617 100%)",
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
            <h1 className="text-3xl font-bold text-white">
              Tech Jobs Dashboard
            </h1>
          </div>
        </div>

        {/* KPI cards: indicadores globales, independientes de los filtros */}
        <div className="relative z-20 -mt-24 px-6">
          <SummaryStats />
        </div>
      </div>

      {/* ── Gráficas ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 px-6 pt-2 pb-6">
        {/* Sección Inicio: Top Skills */}
        <div id="inicio-skills">
          <TopSkillsChart filters={filters} />
        </div>

        {/* Sección Tendencias: evolución mensual + salario */}
        <section id="tendencias" className="grid grid-cols-1 gap-4">
          <DemandByRoleChart filters={filters} />
          <SalaryChart filters={filters} />
        </section>

        {/* Sección Mapa */}
        <section id="mapa">
          <EuropeMap filters={filters} />
        </section>

        {/* Sección Skills: heatmap */}
        <section id="skills">
          <SkillHeatmap filters={filters} />
        </section>
      </div>
    </main>
  );
}

export default MainContent;
