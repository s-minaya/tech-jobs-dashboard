import { useEffect, useState } from "react";
import { getSummaryStats } from "@/services/jobServices";

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
// Stat tile Halo: superficie --color-surface, borde hairline y franja
// aurora animada arriba (mismo degradado que GlowButton, ver .stat-tile
// en index.css) — sustituye al signal color plano por KPI. Sin hover
// animado — es contenido informativo, no una acción.
// El valor va en JetBrains Mono (font-mono), coherente con el resto de
// datos tabulares del dashboard. El label sigue el patrón eyebrow de Halo:
// uppercase, tracking amplio, texto muted.
// La prop fullWidth permite que una card ocupe dos columnas en el grid.
function KpiCard({ label, value, description, fullWidth = false }) {
  return (
    <div className={`stat-tile ${fullWidth ? "col-span-2 sm:col-span-1" : ""}`}>
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p className="font-mono text-2xl font-semibold text-foreground">
        {value}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
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
            className={`h-22 animate-pulse rounded-xl border border-border bg-surface/50 ${
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
      />
    </div>
  );
}

export default SummaryStats;
