import DesktopFilterSidebar from "@/components/Filters/DesktopFilterSidebar";

// ChartPageLayout
// Wrapper de layout compartido por las 5 páginas de gráfica — evita
// repetir el mismo grid "sidebar + contenido" en cada una. Monta
// DesktopFilterSidebar (md+, sin overlay) junto al <main> que ya usaban
// las páginas; en móvil el <aside> no se renderiza (hidden md:flex
// interno a DesktopFilterSidebar) y el layout se reduce a <main> solo.
//
// No es un layout de react-router (sin <Outlet/>) a propósito: solo las
// 5 páginas de gráfica lo necesitan, no las 6 rutas — envolver cada
// página explícitamente es más simple que introducir una ruta layout
// nueva en App.jsx solo para este subconjunto. `/` (HomePage) no usa
// este wrapper — no lleva sidebar.
function ChartPageLayout({ filters, onFilterChange, onReset, children }) {
  return (
    <div className="flex w-full">
      <DesktopFilterSidebar
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />
      <main className="w-full min-w-0 flex-1 pb-20 md:pb-0">
        <div className="grid grid-cols-1 gap-4 px-6 pt-6 pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default ChartPageLayout;
