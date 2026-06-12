import DecryptedText from "@/components/ui/DecryptedText";

// ChartCard
// Wrapper visual reutilizable para todas las gráficas del dashboard.
//
// El título está en el flujo normal ENCIMA de la card (no absolute),
// así nunca se solapa independientemente del tamaño o número de líneas.
// Centrado y con presencia — font-heading, text-xl en móvil, text-2xl en desktop.
//
// El ⓘ de avisos se renderiza inline junto al título.
// El título usa DecryptedText para el efecto de descifrado al hacer hover.
//
// Borde aurora animado (chart-card-border) con interior del color del fondo
// (chart-card-inner) — el gradiente solo es visible como borde de 3px.
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
  warning,
  className = "",
}) {
  const showSpinner = loading && isInitialLoad;
  const showStale = loading && !isInitialLoad;

  return (
    <div className={`mt-6 ${className}`}>
      {/* Título en flujo normal — nunca se solapa con la card */}
      {title && (
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2 px-2">
          <h2 className="cursor-default font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
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

      {/* Card con borde aurora */}
      <div className="chart-card-border relative">
        <div className="chart-card-inner p-5">
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
    </div>
  );
}

export default ChartCard;
