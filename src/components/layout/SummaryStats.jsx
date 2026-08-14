import { useEffect, useState } from "react";
import { useSummaryStats } from "@/hooks/useSummaryStats";
import { useCountUp } from "@/hooks/useCountUp";
import { SLOW_LOADING_MS } from "@/components/ui/ChartCard";

// Formatea un número grande con separador de miles: 26023 → "26.023"
// Redondea explícitamente porque useCountUp devuelve el valor crudo de
// la animación (con decimales a medio camino).
function formatNumber(n) {
  return Math.round(Number(n)).toLocaleString("es-ES");
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
//
// Fase 014 (revisión post-plan): "Ofertas activas"/"Países cubiertos" se
// sustituyen por "Empresas analizadas"/"Roles analizados" — esos dos
// números ya se muestran en la card "Explora el mercado por país" de la
// landing (mismo endpoint), así que repetirlos aquí no aportaba nada
// nuevo; las 2 cards nuevas cuentan una historia distinta (amplitud de
// empresas, granularidad de roles antes de entrar en SalaryChart). Las
// otras 3 ("Con salario declarado", "Última actualización", "Skills
// rastreadas") se mantienen igual, a petición explícita del usuario.
// Todos los valores numéricos animan al montar con useCountUp (mismo
// hook que la landing) — "Última actualización" es una fecha, no un
// conteo, así que no anima.
function SummaryStats() {
  const { stats, loading, error } = useSummaryStats();

  // Aviso de carga lenta (hallazgo 3): SummaryStats no usa ChartCard
  // (layout propio de stat tiles), así que no puede recibir la prop
  // slowHint — replica el mismo umbral (SLOW_LOADING_MS, exportado de
  // ChartCard.jsx) con su propio temporizador local. Con la caché de
  // /api/stats/summary (statsCache.js, TTL 10 min) esto solo debería
  // llegar a mostrarse en el caso raro de caché fría.
  const [showSlowHint, setShowSlowHint] = useState(false);
  useEffect(() => {
    if (!loading) {
      setShowSlowHint(false);
      return;
    }
    const timer = setTimeout(() => setShowSlowHint(true), SLOW_LOADING_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  // Contadores animados — useCountUp no anima nada mientras el target es
  // null/undefined/NaN, así que es seguro llamarlos ya con stats?.campo
  // antes de que stats cargue (los hooks deben llamarse siempre, en el
  // mismo orden, nunca dentro de un if).
  const companiesCount = useCountUp(stats?.total_companies);
  const roleCategoriesCount = useCountUp(stats?.total_role_categories);
  const skillsCount = useCountUp(stats?.total_skills);
  const salaryPctCount = useCountUp(
    stats ? Number(stats.pct_with_salary) : null,
  );

  if (loading) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-22 animate-pulse rounded-xl border border-border bg-surface/50 ${
                i === 4 ? "col-span-2 sm:col-span-1" : ""
              }`}
            />
          ))}
        </div>
        {showSlowHint && (
          <p className="mt-2 text-center text-xs text-muted-foreground/70">
            La primera carga puede tardar unos segundos — gracias por tu
            paciencia.
          </p>
        )}
      </div>
    );
  }

  if (error || !stats) return null;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Empresas analizadas"
          value={formatNumber(companiesCount)}
          description="con ofertas activas"
        />
        <KpiCard
          label="Roles analizados"
          value={formatNumber(roleCategoriesCount)}
          description="categorías en Salario por rol"
        />
        <KpiCard
          label="Skills rastreadas"
          value={formatNumber(skillsCount)}
          description="tecnologías y habilidades"
        />
        <KpiCard
          label="Con salario declarado"
          value={`${salaryPctCount.toFixed(1)}%`}
          description="de las ofertas activas"
        />
        {/* Última actualización ocupa 2 columnas en móvil (fila propia),
            1 columna en sm y lg donde hay espacio suficiente. No anima:
            es una fecha, no un conteo. */}
        <KpiCard
          label="Última actualización"
          value={formatDate(stats.last_updated)}
          description="última sincronización con la fuente"
          fullWidth
        />
      </div>
      {/* Fase 015 (ronda 2, reconciliación de totales): estas 5 cards
          nunca reaccionan a los filtros del sidebar (getSummaryStats() no
          recibe `filters` — decisión de la fase 014, ver comentario de
          HomePage.jsx). Verificado en vivo: son la única sección del
          dashboard que no se mueve al filtrar, mientras el mapa y las
          gráficas de abajo sí lo hacen — sin este texto, un usuario que
          filtre por un país podría leer "23.248 empresas" sin cambiar
          como si el filtro no funcionara, en vez de la lectura correcta
          ("esto es el mercado global, tu filtro se aplica más abajo"). */}
      <p className="mt-2 text-center text-xs text-muted-foreground/70">
        Datos globales del mercado — no varían con los filtros.
      </p>
    </div>
  );
}

export default SummaryStats;
