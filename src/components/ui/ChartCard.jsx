import DecryptedText from "@/components/ui/DecryptedText";

// ChartCard
// Wrapper visual reutilizable para todas las gráficas del dashboard.
//
// El título se sitúa FUERA de la card (margin-top negativo en el wrapper)
// para romper la monotonía de tarjetas apiladas. Sale 1.5rem por encima
// del borde de la card.
//
// El ⓘ de avisos de filtros ignorados se pasa como prop `warning`
// y se renderiza inline junto al título.
//
// El título usa DecryptedText para un efecto de descifrado al hacer hover.
//
// Glassmorphism: bg-card/60 + backdrop-blur para dejar ver el fondo
// animado (DarkVeil/Aurora) a través de las cards.
//
// Distingue dos estados de carga:
//   - Carga inicial (isInitialLoad=true): muestra "Cargando..."
//   - Recarga por filtro (loading=true, isInitialLoad=false): opacidad
//     reducida + badge "Actualizando..." sin cambiar el layout
function ChartCard({
  title,
  loading,
  isInitialLoad,
  error,
  children,
  warning, // nodo React — icono ⓘ de FilterWarningPopover
  className = "",
}) {
  const showSpinner = loading && isInitialLoad;
  const showStale = loading && !isInitialLoad;

  return (
    <div className={`relative mt-6 ${className}`}>
      {/* Título fuera de la card — sobresale por arriba */}
      {title && (
        <div className="absolute -top-5 left-5 z-10 flex items-center gap-2">
          <h2 className="cursor-default font-heading text-lg font-bold tracking-tight text-foreground">
            <DecryptedText
              text={title}
              animateOn="hover"
              sequential
              revealDirection="start"
              speed={30}
              maxIterations={1}
              className="text-foreground"
              encryptedClassName="text-primary/50"
            />
          </h2>
          {/* Icono ⓘ de aviso de filtro ignorado, si lo hay */}
          {warning && <span className="flex items-center">{warning}</span>}
        </div>
      )}

      {/* Card — glassmorphism */}
      <div className="rounded-2xl border border-white/8 bg-card/60 p-5 pt-8 shadow-lg shadow-primary/5 backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:shadow-xl hover:shadow-primary/10 dark:shadow-black/40 dark:hover:shadow-black/60">
        {!loading && error && (
          <p className="text-sm text-destructive">Error: {error}</p>
        )}

        {/* Carga inicial */}
        {showSpinner && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Cargando...
          </p>
        )}

        {/* Contenido */}
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

        {/* Badge de actualización */}
        {showStale && (
          <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-3">
            <span className="rounded-full border border-border bg-background/80 px-2 py-0.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
              Actualizando...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartCard;
