// ChartCard
// Wrapper visual reutilizable para todas las gráficas del dashboard.
//
// Diseño glassmorphism: bg-card/60 + backdrop-blur para dejar ver el
// fondo animado (DarkVeil/Aurora) a través de las cards.
//
// Borde con gradiente sutil y sombra con tinte de color primary
// para coherencia visual con el borde aurora del GlowButton.
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
      className={`relative rounded-2xl border border-white/8 bg-card/60 p-5 shadow-lg shadow-primary/5 backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:shadow-xl hover:shadow-primary/10 dark:shadow-black/40 dark:hover:shadow-black/60 ${className} `}
    >
      {/* Título — más grande y con acento de color */}
      {title && (
        <h2 className="mb-3 text-base font-bold tracking-tight text-foreground">
          {title}
        </h2>
      )}

      {!loading && error && (
        <p className="text-sm text-destructive">Error: {error}</p>
      )}

      {/* Carga inicial: spinner clásico porque no hay datos que mostrar */}
      {showSpinner && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Cargando...
        </p>
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
          <span className="rounded-full border border-border bg-background/80 px-2 py-0.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
            Actualizando...
          </span>
        </div>
      )}
    </div>
  );
}

export default ChartCard;
