// ChartFallback
// Fallback de <Suspense> para las gráficas cargadas con React.lazy()
// (fase 016, bloque B — code-splitting por ruta). Se muestra mientras el
// navegador descarga el chunk de la gráfica, es decir, ANTES de que el
// propio componente (y su ChartCard interno) lleguen a existir — por eso
// no puede ser el ChartCard real, y en su lugar replica su mismo shell
// visual (mt-6, .chart-card, p-5, "Cargando...") para que no haya salto
// de layout ni cambio de estilo al pasar de "cargando el chunk" a
// "cargando los datos" (que ya gestiona ChartCard con su propio
// showSpinner una vez el componente real se monta).
// Ver src/components/ui/ChartCard.jsx (bloque "Carga inicial").
function ChartFallback() {
  return (
    <div className="mt-6">
      <div className="chart-card relative p-5">
        <div className="py-8 text-center text-sm text-muted-foreground">
          <p>Cargando...</p>
        </div>
      </div>
    </div>
  );
}

export default ChartFallback;
