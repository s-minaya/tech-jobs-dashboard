// ChartCard
// Wrapper visual reutilizable para todas las gráficas del dashboard.
//
// En lugar de borde fino, usa sombra para dar elevación:
//   - Light mode: shadow-md con toque azulado sutil
//   - Dark mode: sombra negra intensa (shadow-black/60) para contrastar
//     sobre el fondo oscuro sin que las cards se pierdan
//
// Distingue dos estados de carga:
//   - Carga inicial (isInitialLoad=true): muestra "Cargando..." porque
//     no hay datos previos que mostrar.
//   - Recarga por filtro (loading=true, isInitialLoad=false): mantiene
//     el contenido visible con opacidad reducida y un badge "Actualizando..."
//     para que el layout no cambie de tamaño y el scroll no se mueva.

function ChartCard({
  title,
  loading,
  isInitialLoad,
  error,
  children,
  className = "",
}) {
  const showSpinner = loading && isInitialLoad;
  const showStale = loading && !isInitialLoad;

  return (
    <div
      className={`relative rounded-xl bg-card p-4 shadow-md shadow-black/8 dark:shadow-lg dark:shadow-black/60 ${className} `}
    >
      {title && <h2 className="mb-4 text-sm font-semibold">{title}</h2>}

      {!loading && error && (
        <p className="text-sm text-destructive">Error: {error}</p>
      )}

      {/* Carga inicial: spinner clásico porque no hay datos que mostrar */}
      {showSpinner && (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      )}

      {/* Contenido: siempre en el DOM cuando hay datos, aunque esté recargando.
          La opacidad reducida indica al usuario que los datos se están actualizando. */}
      {!error && !showSpinner && (
        <div
          style={{
            opacity: showStale ? 0.4 : 1,
            transition: "opacity 200ms ease",
          }}
        >
          {children}
        </div>
      )}

      {/* Badge de actualización: aparece encima del contenido sin alterar el layout */}
      {showStale && (
        <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-3">
          <span className="rounded-full border border-border bg-background/80 px-2 py-0.5 text-xs text-muted-foreground shadow-sm">
            Actualizando...
          </span>
        </div>
      )}
    </div>
  );
}

export default ChartCard;
