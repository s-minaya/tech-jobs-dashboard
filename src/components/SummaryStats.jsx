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
// Tarjeta individual para un indicador. Diseño minimalista para que
// varios quepan en una fila sin saturar visualmente la cabecera.
function KpiCard({ label, value, description }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground/70">{description}</p>
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
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg border border-border bg-muted"
          />
        ))}
      </div>
    );
  }

  if (error || !stats) return null;

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
      <KpiCard
        label="Última actualización"
        value={formatDate(stats.last_updated)}
        description="oferta más reciente"
      />
    </div>
  );
}

export default SummaryStats;
