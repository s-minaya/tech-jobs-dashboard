import { useState, useEffect } from "react";
import Lightfall from "@/components/ui/Lightfall";
import GlowButton from "@/components/ui/GlowButton";
import { getSummaryStats } from "@/services/jobServices";
import {
  RiArrowRightLine,
  RiBriefcaseLine,
  RiMapPinLine,
  RiBarChartLine,
} from "react-icons/ri";

// Calcula el número de streaks según el ancho de pantalla.
// Móvil: pocas (rendimiento), tablet: medio, desktop: más para que no quede vacío.
function getStreakCount() {
  const w = window.innerWidth;
  if (w < 768) return 3;
  if (w < 1024) return 4;
  return 8;
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
// Los stats (ofertas, países, skills) se cargan desde la API al montar
// para mostrar datos reales en lugar de valores hardcodeados.
function LandingPage({ onEnter }) {
  const [leaving, setLeaving] = useState(false);
  const [streakCount, setStreakCount] = useState(getStreakCount);
  const [stats, setStats] = useState(null);

  // Actualiza streakCount al redimensionar la ventana
  useEffect(() => {
    const handler = () => setStreakCount(getStreakCount());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Carga los stats reales de la API — mismos datos que las KPI cards
  useEffect(() => {
    getSummaryStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  function handleEnter() {
    setLeaving(true);
    setTimeout(onEnter, 600);
  }

  // Formatea números con separador de miles: 39678 → "39.678"
  function fmt(n) {
    return n != null ? Number(n).toLocaleString("es-ES") : "—";
  }

  // Stats dinámicos con fallback mientras cargan
  const statItems = [
    {
      icon: RiBriefcaseLine,
      label: "Ofertas activas",
      value: stats ? fmt(stats.total_active_jobs) : "…",
    },
    {
      icon: RiMapPinLine,
      label: "Países cubiertos",
      value: stats ? fmt(stats.total_countries) : "…",
    },
    {
      icon: RiBarChartLine,
      label: "Skills rastreadas",
      value: stats ? fmt(stats.total_skills) : "…",
    },
  ];

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
      <div className="pointer-events-none relative z-10 flex max-w-2xl flex-col items-center px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
          <RiBriefcaseLine className="h-3.5 w-3.5" />
          Mercado tech europeo · 8 países · Datos en tiempo real
        </div>

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

        {/* Stats — datos reales de la API */}
        <div className="mb-10 flex flex-wrap justify-center gap-6">
          {statItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <span className="text-2xl font-bold text-white">{value}</span>
            </div>
          ))}
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
