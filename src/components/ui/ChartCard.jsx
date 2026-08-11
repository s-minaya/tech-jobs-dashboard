/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import DecryptedText from "@/components/ui/DecryptedText";
import { describeError } from "@/lib/errorMessages";

// Tras cuántos ms de carga inicial se muestra slowHint (si el chart lo pasa).
const SLOW_LOADING_MS = 6000;

// ChartCard
// Wrapper visual reutilizable para todas las gráficas del dashboard.
//
// El título está en el flujo normal ENCIMA de la card (no absolute),
// así nunca se solapa independientemente del tamaño o número de líneas.
// Centrado cuando no hay aviso, alineado a la izquierda cuando hay ⓘ.
// El título usa DecryptedText para el efecto de descifrado al hacer hover.
//
// Card con superficie Halo (chart-card): fondo --color-surface y borde
// hairline 1px --color-border — sin gradiente animado. El aurora se
// reserva para elementos interactivos (GlowButton, hero); esta card es
// contenido pasivo.
//
// Distingue dos estados de carga:
//   - Carga inicial (isInitialLoad=true): muestra "Cargando..."
//   - Recarga por filtro (loading=true, isInitialLoad=false): opacidad
//     reducida + badge "Actualizando..." sin cambiar el layout
//
// slowHint (opcional): texto adicional que aparece bajo "Cargando..." si
// la carga inicial lleva más de SLOW_LOADING_MS. Opt-in — sin esta prop,
// cero cambio de comportamiento. Solo en carga inicial, no en recargas
// (ahí ya hay datos anteriores visibles, menos ansiedad de "¿esto está
// roto?"). Pensado para gráficas con queries lentas conocidas (ver
// SalaryChart, fase 010).
function ChartCard({
  title,
  loading,
  isInitialLoad,
  error,
  children,
  warning,
  className = "",
  slowHint,
}) {
  const showSpinner = loading && isInitialLoad;
  const showStale = loading && !isInitialLoad;

  const [showSlowHint, setShowSlowHint] = useState(false);
  useEffect(() => {
    if (!showSpinner || !slowHint) {
      setShowSlowHint(false);
      return;
    }
    const timer = setTimeout(() => setShowSlowHint(true), SLOW_LOADING_MS);
    return () => clearTimeout(timer);
  }, [showSpinner, slowHint]);

  return (
    <div className={`mt-6 ${className}`}>
      {/* Título en flujo normal — nunca se solapa con la card */}
      {title && (
        <div className="mb-3 flex items-start justify-center gap-2 px-2">
          {/* ⓘ a la izquierda — shrink-0 para que nunca se comprima */}
          {warning && <span className="mt-0.5 shrink-0">{warning}</span>}
          {/* Título ocupa el espacio que necesite — text-center sin aviso,
              text-left con aviso para que fluya naturalmente */}
          <h2
            className={`cursor-default font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl ${warning ? "text-left" : "text-center"}`}
          >
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
        </div>
      )}

      {/* Card con superficie Halo y borde hairline */}
      <div className="chart-card relative p-5">
        {!loading && error && (
          <p className="text-sm text-destructive">
            {describeError(error) ?? `Error: ${error}`}
          </p>
        )}

        {/* Carga inicial */}
        {showSpinner && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <p>Cargando...</p>
            {showSlowHint && (
              <p className="mt-2 text-xs text-muted-foreground/70">
                {slowHint}
              </p>
            )}
          </div>
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
            <span className="rounded-full border border-border bg-elevated px-2 py-0.5 text-xs text-muted-foreground">
              Actualizando...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartCard;
