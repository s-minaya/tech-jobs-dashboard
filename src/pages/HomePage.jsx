import SummaryStats from "@/components/layout/SummaryStats";
import ThemeToggle from "@/components/ui/ThemeToggle";
import DarkVeil from "@/components/ui/DarkVeil";
import Aurora from "@/components/ui/Aurora";

// HomePage
// Ruta "/" — portada pura: hero + KPIs (`SummaryStats`), sin ninguna
// gráfica. `TopSkillsChart` vivía aquí en el diseño original de esta
// feature (fase 016); se movió a su propia ruta (`/top-skills`,
// `TopSkillsPage.jsx`) porque "/" no lleva sidebar de filtros en
// tablet/desktop (decisión ya tomada) — se quedaba como la única
// gráfica sin ningún control de filtro propio ahí. Sin gráfica, esta
// página no necesita `filters` en absoluto.
//
// El hero tiene fondo animado distinto según el tema:
//   dark  → DarkVeil (CPPN, hueShift=0 para morado de la marca)
//   light → Aurora (simplex noise, degradado blanco-morado)
// overflow-hidden en el div del hero confina ambos canvas a esa área.
//
// NOTA (fase 016, bloque A): el `ThemeToggle` de aquí todavía es el
// mismo montaje "hardcodeado dentro del hero" de siempre — se retira en
// el bloque C, cuando pasa a vivir en `Header` (md+) y como montaje
// flotante independiente en móvil. No tocarlo antes de tiempo para no
// mezclar cambios de bloques distintos.
//
// Los `id="inicio"`/`id="inicio-skills"` que tenía `MainContent.jsx`
// (anclas para el `scrollIntoView` de `BottomNav` + el
// `IntersectionObserver` de `App.jsx`) no se trasladan aquí: ambos
// mecanismos se sustituyen por navegación real (`NavLink`) en el
// bloque C, así que mantenerlos un bloque más solo para borrarlos
// después no aporta nada. Ningún selector CSS depende de ellos
// (verificado con grep).
function HomePage({ isDark, toggleTheme }) {
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
    </main>
  );
}

export default HomePage;
