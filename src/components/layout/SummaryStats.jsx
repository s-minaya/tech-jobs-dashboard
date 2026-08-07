import { useEffect, useState } from "react";
import { getSummaryStats } from "@/services/jobServices";
import { RiCalendarLine } from "react-icons/ri";

// Formatea un número grande con separador de miles: 26023 → "26.023"
function formatNumber(n) {
  return Number(n).toLocaleString("es-ES");
}

// Formatea una fecha ISO a "15 ene 2025"
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// KpiCard
// Tarjeta individual flotante sobre el hero.
// Por defecto fondo transparente + backdrop-blur para dejar ver el fondo animado.
// Al hacer hover: relleno oscuro (#0A0B0F) + borde aurora animado
// con el mismo efecto que GlowButton — mismas clases CSS definidas en index.css.
// La prop fullWidth permite que una card ocupe dos columnas en el grid.
// La prop icon permite añadir un icono decorativo centrado a la derecha.
function KpiCard({ label, value, description, fullWidth = false, icon: Icon }) {
  return (
    <div
      className={`glow-kpi-wrapper group ${fullWidth ? "col-span-2 sm:col-span-1" : ""}`}
    >
      <div className="glow-kpi-inner h-full w-full rounded-xl px-4 py-3">
        {Icon ? (
          /* Layout con icono: texto a la izquierda, icono grande centrado a la derecha */
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
                {value}
              </p>
              {description && (
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  {description}
                </p>
              )}
            </div>
            <Icon className="h-10 w-10 shrink-0 text-primary/40 transition-colors duration-300 group-hover:text-primary/70" />
          </div>
        ) : (
          <>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                {description}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// SummaryStats
// Fila de KPI cards que muestra el estado global del dataset.
// Los números vienen directamente de la BD y se actualizan solos
// cada vez que el pipeline de datos añade nuevas ofertas.
// No reacciona a los filtros del sidebar: representa el volumen
// total del dataset, no una vista filtrada.
//
// Grid responsive:
//   móvil    → 2 columnas: 2+2 cards y la última ocupa las 2 columnas
//   sm       → 3 columnas
//   lg       → 5 columnas (todas en una fila)
function SummaryStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargamos los stats una sola vez al montar el componente.
  // No hay deps que cambien porque los KPIs son independientes de los filtros.
  useEffect(() => {
    getSummaryStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-20 animate-pulse rounded-xl border border-border bg-muted/30 shadow-lg backdrop-blur-md ${
              i === 4 ? "col-span-2 sm:col-span-1" : ""
            }`}
          />
        ))}
      </div>
    );
  }

  if (error || !stats) return null;

  return (
    <div className="mb-6 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <KpiCard
        label="Ofertas activas"
        value={formatNumber(stats.total_active_jobs)}
        description="en los 8 países cubiertos"
      />
      <KpiCard
        label="Países cubiertos"
        value={formatNumber(stats.total_countries)}
        description="DE, FR, ES, NL, PL, IT, AT, BE"
      />
      <KpiCard
        label="Skills rastreadas"
        value={formatNumber(stats.total_skills)}
        description="tecnologías y habilidades"
      />
      <KpiCard
        label="Con salario declarado"
        value={`${stats.pct_with_salary}%`}
        description="de las ofertas activas"
      />
      {/* Última actualización ocupa 2 columnas en móvil (fila propia),
          1 columna en sm y lg donde hay espacio suficiente */}
      <KpiCard
        label="Última actualización"
        value={formatDate(stats.last_updated)}
        description="oferta más reciente"
        fullWidth
        icon={RiCalendarLine}
      />
    </div>
  );
}

export default SummaryStats;
