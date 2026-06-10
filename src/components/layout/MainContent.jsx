import TopSkillsChart from "@/components/Charts/TopSkillsChart";
import DemandByRoleChart from "@/components/Charts/DemandByRoleChart";
import SalaryChart from "@/components/Charts/SalaryChart";
import EuropeMap from "@/components/Charts/EuropeMap";
import SkillHeatmap from "@/components/Charts/SkillHeatmap";
import SummaryStats from "@/components/layout/SummaryStats";
import ThemeToggle from "@/components/ui/ThemeToggle";
import DarkVeil from "@/components/ui/DarkVeil";
import Aurora from "@/components/ui/Aurora";

// MainContent
// Área principal del dashboard.
// El hero tiene fondo animado distinto según el tema:
//   dark  → DarkVeil (CPPN, colores oscuros, hueShift=0 para morado)
//   light → Aurora (simplex noise, alpha transparente sobre fondo blanco)
// overflow-hidden en el div del hero confina ambos canvas a esa área.
// Las cards y gráficas usan bg-card/80 + backdrop-blur para el efecto
// glassmorphism sobre el fondo animado.
// Cada sección tiene un id para que BottomNav pueda hacer scroll hasta ella.
// pb-20 en el wrapper evita que el bottom nav tape el contenido al llegar al final.
function MainContent({ filters, isDark, toggleTheme }) {
  return (
    <main className="w-full min-w-0 flex-1 pb-20 md:pb-0">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div id="inicio">
        {/* overflow-hidden confina el fondo animado a este bloque */}
        <div className="relative w-full overflow-hidden px-6 pt-8 pb-32">
          {/* Fondo animado según tema.
              Ambos son absolute inset-0 z-0 y pointer-events-none.
              DarkVeil pinta píxeles opacos → solo dark mode.
              Aurora usa alpha transparente → solo light mode, sobre bg-white del wrapper. */}
          <div className="pointer-events-none absolute inset-0 z-0">
            {isDark ? (
              <DarkVeil
                hueShift={0}
                speed={1.5}
                warpAmount={1.5}
                noiseIntensity={0.05}
              />
            ) : (
              <Aurora
                colorStops={["#7C3AED", "#B497CF", "#5227FF"]}
                blend={0.5}
                amplitude={0.7}
                speed={0.7}
              />
            )}
          </div>

          <div className="absolute top-6 right-6 z-20">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>

          <div className="relative z-10 mt-2 text-center">
            <p
              className={`mb-1 text-xs font-medium tracking-widest uppercase drop-shadow-black ${isDark ? "text-white" : "text-white"}`}
            >
              Mercado tech europeo
            </p>
            <h1
              className={`text-3xl font-bold drop-shadow-[0_2px_16px_rgba(0,0,0,0.4)] ${isDark ? "text-white" : "text-white"}`}
            >
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
