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
//   dark  → DarkVeil (CPPN, hueShift=0 para morado de la marca)
//   light → Aurora (simplex noise, degradado blanco-morado)
// overflow-hidden en el div del hero confina ambos canvas a esa área.
// El título usa font-sans (Inter, tamaño display) y tokens Halo de color
// en ambos temas: --color-text-primary para "Tech Jobs", --color-primary
// para "Dashboard", --color-text-secondary para el subtítulo — ya no hay
// lógica isDark en los estilos del texto (isDark solo decide qué fondo
// animado renderizar, DarkVeil o Aurora).
// Las cards usan bg-card/60 backdrop-blur para glassmorphism sobre el fondo.
// Cada sección tiene un id para que BottomNav pueda hacer scroll hasta ella.
// pb-20 en el wrapper evita que el bottom nav tape el contenido al llegar al final.
function MainContent({ filters, isDark, toggleTheme }) {
  return (
    <main className="w-full min-w-0 flex-1 pb-20 md:pb-0">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div id="inicio">
        {/* Hero más alto para dar más presencia al título.
            pt-20 pb-48 en móvil, pt-28 pb-56 en desktop. */}
        <div className="relative w-full overflow-hidden px-6 pt-20 pb-48 md:pt-28 md:pb-56">
          {/* Fondo animado según tema — confinado por overflow-hidden */}
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

          <div className="relative z-10 text-center">
            {/* Subtítulo — pequeño y con mucho tracking para no competir con el h1 */}
            <p className="mb-3 text-xs font-medium tracking-[0.3em] text-(--color-text-secondary) uppercase">
              Mercado tech europeo
            </p>
            {/* Título grande con presencia — más grande en desktop */}
            <h1 className="font-sans text-5xl leading-tight font-bold drop-shadow-lg md:text-6xl lg:text-7xl">
              {/* Tech Jobs — mismo token en ambos temas: casi blanco en dark,
                  oscuro y legible sobre Aurora en light */}
              <span style={{ color: "var(--color-text-primary)" }}>
                Tech Jobs
              </span>
              {/* Dashboard — siempre el primary de la marca, en ambos temas */}
              <span className="block text-primary">Dashboard</span>
            </h1>
          </div>
        </div>

        {/* KPI cards: indicadores globales, independientes de los filtros */}
        <div className="relative z-20 -mt-32 px-6 md:-mt-36">
          <SummaryStats />
        </div>
      </div>

      {/* ── Gráficas ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 px-6 pt-2 pb-6">
        {/* Sección Inicio: Top Skills */}
        <div id="inicio-skills" className="scroll-mt-16">
          <TopSkillsChart filters={filters} />
        </div>
        {/* Sección Tendencias: evolución mensual + salario */}
        <section
          id="tendencias"
          className="grid scroll-mt-16 grid-cols-1 gap-4"
        >
          <DemandByRoleChart filters={filters} />
          <SalaryChart filters={filters} />
        </section>
        {/* Sección Mapa */}
        <section id="mapa" className="scroll-mt-16">
          <EuropeMap filters={filters} />
        </section>
        {/* Sección Skills: heatmap */}
        <section id="skills" className="scroll-mt-16">
          <SkillHeatmap filters={filters} />
        </section>
      </div>
    </main>
  );
}

export default MainContent;
