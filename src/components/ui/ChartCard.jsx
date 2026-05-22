// ─────────────────────────────────────────────────────────────────────────────
// Wrapper visual reutilizable para todas las gráficas del dashboard.
// Proporciona:
//   - Marco consistente (borde, padding, rounded)
//   - Título estandarizado
//   - Estados de carga y error sin repetir JSX en cada chart
//
// Uso:
//   <ChartCard title="Top Skills" loading={loading} error={error}>
//     <BarChart ... />
//   </ChartCard>
//
// Si loading=true  → muestra "Cargando..."
// Si error!=null   → muestra el mensaje de error
// Si ambos false   → renderiza children normalmente
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ChartCard
 * Contenedor estándar para las visualizaciones del dashboard.
 *
 * @param {string}    title    - Título visible en la cabecera de la gráfica
 * @param {boolean}   loading  - Si true, muestra el estado de carga
 * @param {string|null} error  - Si no es null, muestra el error en rojo
 * @param {ReactNode} children - El contenido de la gráfica cuando todo está OK
 * @param {string}    className - Clases CSS adicionales opcionales
 */
function ChartCard({ title, loading, error, children, className = "" }) {
  return (
    <div className={`rounded-lg border border-border p-4 ${className}`}>
      {/* Título de la gráfica — siempre visible aunque esté cargando */}
      {title && (
        <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      )}

      {/* Estado de carga */}
      {loading && (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      )}

      {/* Estado de error (solo se muestra si no está cargando) */}
      {!loading && error && (
        <p className="text-sm text-destructive">Error: {error}</p>
      )}

      {/* Contenido normal (solo se renderiza si no hay loading ni error) */}
      {!loading && !error && children}
    </div>
  );
}

export default ChartCard;