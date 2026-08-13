import { useState, useEffect } from "react";
import Lightfall from "@/components/ui/Lightfall";
import GlowButton from "@/components/ui/GlowButton";
import PageLoader from "@/components/ui/PageLoader";
import { useSummaryStats } from "@/hooks/useSummaryStats";
import { useCountUp } from "@/hooks/useCountUp";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  RiArrowRightLine,
  RiEarthLine,
  RiMoneyEuroCircleLine,
  RiFireLine,
} from "react-icons/ri";

// Tope de espera del loader inicial (ver comentario de LandingPage más
// abajo): si getSummaryStats() nunca resuelve (red caída, petición
// colgada), la landing se revela igualmente pasado este tiempo en vez
// de bloquear al usuario indefinidamente sin poder ni pulsar "Comenzar".
// Subido de 8s a 20s en la ronda 3 de esta fase: 8s se disparaba en la
// práctica en cada arranque frío del servidor (la query real puede
// tardar 37-90s sin caché, ver 014-tasks.md) — el loader se rendía y
// revelaba la landing sin datos mucho antes de que la petición
// resolviera. El fix real es calentar la caché al arrancar el servidor
// (api/src/index.js) para que este camino frío deje de ser el caso
// habitual; este techo más generoso es la red de seguridad para el
// margen breve entre "servidor arrancado" y "caché ya caliente".
const LANDING_LOADER_MAX_MS = 20000;

// Calcula el número de streaks según el ancho de pantalla.
// Móvil: pocas (rendimiento), tablet: medio, desktop: más para que no quede vacío.
function getStreakCount() {
  const w = window.innerWidth;
  if (w < 768) return 3;
  if (w < 1024) return 4;
  return 8;
}

// Formatea números enteros con separador de miles: 39678 → "39.678".
// Redondea explícitamente porque useCountUp devuelve el valor crudo de
// la animación (puede tener decimales a medio camino) — para contadores
// enteros (países, ofertas, salario) siempre se muestra un entero.
function fmt(n) {
  return n != null ? Math.round(n).toLocaleString("es-ES") : "…";
}

// StatCard
// Card de stat de la landing (fase 014) — título + icono a modo de
// mini-CTA hacia una gráfica concreta del dashboard, con 1-3 métricas
// reales debajo. Reusa el mismo lenguaje visual que tenía el badge
// superior ya eliminado (pill de cristal: border-white/20 bg-white/10
// backdrop-blur-sm) en vez de inventar un patrón nuevo.
function StatCard({ icon: Icon, title, children }) {
  return (
    <div className="flex w-64 flex-col gap-2.5 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium text-white/85">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {title}
      </div>
      {children}
    </div>
  );
}

// LandingPage
// Pantalla de entrada que bloquea el acceso al dashboard hasta que el
// usuario pulsa "Comenzar". Usa el efecto Lightfall (WebGL) como fondo.
// Los colores del efecto coinciden con la paleta del proyecto.
//
// Al pulsar el botón, la landing se desvanece antes de mostrar el dashboard.
// pointer-events-none en overlay y wrapper de contenido para que el mouse
// llegue al canvas de Lightfall y la interacción funcione.
//
// Los stats se cargan desde la API vía useSummaryStats (fase 014, hook
// compartido con SummaryStats — antes cada uno hacía su propio fetch, ver
// spec/features/014-summary-stats-quality/014-spec.md hallazgo 2) para
// mostrar datos reales en lugar de valores hardcodeados. Cada card tira
// de una gráfica concreta del dashboard en vez de repetir los mismos 3
// números de "volumen" que ya muestran las KPI cards.
//
// Revisión post-plan (fase 014): la landing tiene bastante que cargar
// (Lightfall en WebGL, los propios stats) — en vez de dejar que el
// usuario vea el hero completo mientras las cards de stats todavía
// muestran "…", se usa PageLoader como pantalla de espera hasta que
// TODO esté listo, y solo entonces se revela la landing entera de golpe
// (Lightfall montando y los contadores animando desde 0 en ese mismo
// instante). Lightfall no tiene ninguna carga asíncrona propia —lee su
// shader inline, sin texturas ni fetch de red (ver Lightfall.jsx)— así
// que lo único que de verdad hay que esperar es useSummaryStats().
// LANDING_LOADER_MAX_MS evita que un fallo de red deje al usuario
// atrapado sin poder ni pulsar "Comenzar".
function LandingPage({ onEnter }) {
  const [leaving, setLeaving] = useState(false);
  const [streakCount, setStreakCount] = useState(getStreakCount);
  const { stats, loading } = useSummaryStats();
  const [forceReveal, setForceReveal] = useState(false);

  // Actualiza streakCount al redimensionar la ventana
  useEffect(() => {
    const handler = () => setStreakCount(getStreakCount());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setForceReveal(true), LANDING_LOADER_MAX_MS);
    return () => clearTimeout(timer);
  }, []);

  // Contadores animados (cuentan hacia arriba al llegar el dato real) —
  // useCountUp no anima nada mientras target es null/undefined, así que
  // es seguro llamarlo ya con stats?.campo antes de que stats cargue.
  // Los hooks se llaman siempre, en el mismo orden, aunque el early
  // return de abajo (mientras carga) no los use todavía — no se puede
  // condicionar la llamada a un hook a un if.
  const countriesCount = useCountUp(stats?.total_countries);
  const activeJobsCount = useCountUp(stats?.total_active_jobs);
  const salaryCount = useCountUp(stats?.median_salary_90d);

  function handleEnter() {
    setLeaving(true);
    setTimeout(onEnter, 600);
  }

  // Pantalla de espera: cubre Lightfall montando + la petición de stats.
  // No se revela nada del hero/CTA hasta que hay algo real que mostrar.
  if (loading && !forceReveal) {
    return <PageLoader />;
  }

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center transition-opacity duration-600 ease-in-out ${leaving ? "pointer-events-none opacity-0" : "opacity-100"} `}
    >
      {/* Fondo Lightfall — colores de la marca */}
      <div className="absolute inset-0">
        <Lightfall
          colors={["#7860ff", "#a78bfa", "#c4b5fd", "#4f46e5"]}
          backgroundColor="#1e1040"
          speed={0.6}
          streakCount={streakCount}
          streakWidth={1.2}
          streakLength={1.4}
          glow={1.2}
          density={0.15}
          twinkle={0.8}
          zoom={2.5}
          backgroundGlow={0.6}
          opacity={1}
          mouseInteraction={true}
          mouseStrength={0.6}
          mouseRadius={0.8}
        />
      </div>

      {/* Overlay — pointer-events-none para que el mouse llegue al canvas */}
      <div className="pointer-events-none absolute inset-0 bg-black/20" />

      {/* Contenido — pointer-events-none en el wrapper, el botón recupera los eventos */}
      <div className="pointer-events-none relative z-10 flex max-w-3xl flex-col items-center px-6 text-center">
        {/* Título */}
        <h1 className="mb-4 font-heading text-5xl leading-tight font-bold tracking-tight text-white md:text-6xl">
          Tech Jobs
          <span
            className="block bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #c4b5fd, #a78bfa, #7860ff)",
            }}
          >
            Dashboard
          </span>
        </h1>

        {/* Descripción */}
        <p className="mb-8 max-w-lg text-base leading-relaxed text-white/70">
          Explora las tendencias del mercado laboral tech en Europa. Descubre
          qué skills se demandan, cómo evolucionan los salarios y qué roles
          están creciendo en cada país.
        </p>

        {/* Stats — datos reales de la API, cada card tira de una gráfica del dashboard */}
        <div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <StatCard icon={RiEarthLine} title="Explora el mercado por país">
            <div className="flex items-baseline gap-4">
              <div>
                <span className="font-mono text-xl font-bold text-white">
                  {stats ? fmt(countriesCount) : "…"}
                </span>
                <p className="text-[10px] tracking-wide text-white/50 uppercase">
                  países
                </p>
              </div>
              <div>
                <span className="font-mono text-xl font-bold text-white">
                  {stats ? fmt(activeJobsCount) : "…"}
                </span>
                <p className="text-[10px] tracking-wide text-white/50 uppercase">
                  ofertas activas
                </p>
              </div>
            </div>
            <p className="text-[10px] text-white/40">
              Actualizado {stats ? formatRelativeTime(stats.last_updated) : "…"}
            </p>
          </StatCard>

          <StatCard icon={RiMoneyEuroCircleLine} title="Compara salarios en Europa">
            <div>
              <span className="font-mono text-xl font-bold text-white">
                {stats ? `${fmt(salaryCount)} €` : "…"}
              </span>
              <p className="text-[10px] tracking-wide text-white/50 uppercase">
                salario mediano
              </p>
            </div>
            <p className="text-[10px] text-white/40">Últimos 90 días</p>
          </StatCard>

          <StatCard icon={RiFireLine} title="Descubre dónde está la demanda">
            <ol className="flex flex-col gap-1">
              {stats?.top_skills_30d ? (
                stats.top_skills_30d.map((skill, i) => (
                  <li
                    key={skill.name}
                    className="flex items-center gap-2 text-sm text-white"
                  >
                    <span className="font-mono text-[10px] text-white/40">
                      {i + 1}
                    </span>
                    {skill.name}
                  </li>
                ))
              ) : (
                <li className="text-sm text-white/50">…</li>
              )}
            </ol>
            <p className="text-[10px] text-white/40">Últimos 30 días</p>
          </StatCard>
        </div>

        {/* CTA — GlowButton con borde aurora animado.
            pointer-events-auto recupera los eventos sobre el wrapper pointer-events-none. */}
        <div className="pointer-events-auto">
          <GlowButton
            onClick={handleEnter}
            variant="solid"
            className="group shadow-lg shadow-black/20"
          >
            Explorar el dashboard
            <RiArrowRightLine className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </GlowButton>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
