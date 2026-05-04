function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-border p-4">
      <h2 className="mb-4 text-lg font-semibold">Filtros</h2>

      {/* País */}
      <div className="mb-4">
        <p className="mb-1 text-sm font-medium">País</p>
        <div className="flex flex-wrap gap-1">
          {["Todos", "GB", "DE", "FR", "ES", "NL", "PL", "IT", "AT", "BE"].map((p) => (
            <button key={p} className="rounded border px-2 py-1 text-xs">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Periodo */}
      <div className="mb-4">
        <p className="mb-1 text-sm font-medium">Periodo</p>
        <div className="flex flex-col gap-1">
          {["Últimos 30 días", "Últimos 90 días", "Últimos 6 meses", "Todo el histórico"].map((p) => (
            <button key={p} className="rounded border px-2 py-1 text-left text-xs">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de contrato */}
      <div className="mb-4">
        <p className="mb-1 text-sm font-medium">Tipo de contrato</p>
        <div className="flex flex-col gap-1">
          {["Todos", "Permanent", "Contract"].map((p) => (
            <button key={p} className="rounded border px-2 py-1 text-left text-xs">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Jornada */}
      <div className="mb-4">
        <p className="mb-1 text-sm font-medium">Jornada</p>
        <div className="flex flex-col gap-1">
          {["Todos", "Full time", "Part time"].map((p) => (
            <button key={p} className="rounded border px-2 py-1 text-left text-xs">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Remote */}
      <div className="mb-4">
        <p className="mb-1 text-sm font-medium">Remote</p>
        <div className="flex flex-col gap-1">
          {["Todos", "Sí", "No"].map((p) => (
            <button key={p} className="rounded border px-2 py-1 text-left text-xs">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Categoría de skills */}
      <div className="mb-4">
        <p className="mb-1 text-sm font-medium">Categoría de skills</p>
        <div className="flex flex-wrap gap-1">
          {["Todas", "Language", "Framework", "Cloud", "Database", "Tool", "Methodology"].map((p) => (
            <button key={p} className="rounded border px-2 py-1 text-xs">
              {p}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar