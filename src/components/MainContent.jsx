// Área principal del dashboard. Recibe los filtros activos para
// filtrar los datos que se mostrarán en las gráficas.
// El <pre> es temporal, sirve para verificar que el estado de los
// filtros se actualiza correctamente. Se eliminará cuando se añadan las gráficas reales.
function MainContent({ filters }) {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-2xl font-bold">Tech Jobs Dashboard</h1>
      <pre className="mt-4 text-xs text-muted-foreground">
        {JSON.stringify(filters, null, 2)}
      </pre>
    </main>
  );
}

export default MainContent;
