import SummaryStats from "@/components/layout/SummaryStats";
import DarkVeil from "@/components/ui/DarkVeil";
import Aurora from "@/components/ui/Aurora";

// HomePage
// Ruta "/" — portada: hero + KPIs (`SummaryStats`), sin ninguna
// gráfica. "/" no lleva sidebar de filtros en tablet/desktop, así que
// ninguna gráfica vive aquí — cada una tiene su propia ruta con
// `DesktopFilterSidebar` (`TopSkillsChart` incluida, en
// `TopSkillsPage.jsx`/`/top-skills`). Sin gráfica, esta página no
// necesita `filters`.
//
// El hero tiene fondo animado distinto según el tema:
//   dark  → DarkVeil (CPPN, hueShift=0 para morado de la marca)
//   light → Aurora (simplex noise, degradado blanco-morado)
// overflow-hidden en el div del hero confina ambos canvas a esa área.
//
// `ThemeToggle` vive en `Header` (md+) y como montaje flotante
// independiente en móvil (`App.jsx`), visible en cualquier página — no
// se renderiza aquí.
function HomePage({ isDark }) {
  return (
    <main className="w-full min-w-0 flex-1 pb-20 md:pb-0">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div>
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
    </main>
  );
}

export default HomePage;
