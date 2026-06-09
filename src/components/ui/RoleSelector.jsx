// RoleSelector
// Controles para seleccionar qué roles mostrar en una gráfica.
// Incluye botones "Todos" y "Ninguno" y un toggle por cada rol disponible.
// Lo usan DemandByRoleChart y SalaryChart.
//
// Props:
//   allRoles       → array con todos los roles disponibles (strings)
//   selected       → array con los roles actualmente visibles
//   onSelect       → callback que recibe el nuevo array de roles seleccionados
//   chartColors    → array de colores CSS, uno por rol
//   getRoleLabel   → función que convierte "backend" en "Backend"
function RoleSelector({
  allRoles,
  selected,
  onSelect,
  chartColors,
  getRoleLabel,
}) {
  // Alterna la visibilidad de un rol individual.
  function toggleRole(role) {
    onSelect(
      selected.includes(role)
        ? selected.filter((r) => r !== role)
        : [...selected, role],
    );
  }

  return (
    <div className="mb-4">
      {/* Atajos para seleccionar todos o ninguno */}
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => onSelect([...allRoles])}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Todos
        </button>
        <span className="text-xs text-muted-foreground">·</span>
        <button
          onClick={() => onSelect([])}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Ninguno
        </button>
      </div>

      {/* Un botón toggle por cada rol disponible */}
      <div className="flex flex-wrap gap-1">
        {allRoles.map((role, i) => {
          const isSelected = selected.includes(role);
          const color = chartColors[i % chartColors.length];
          return (
            <button
              key={role}
              onClick={() => toggleRole(role)}
              className={`cursor-pointer rounded border px-2 py-1 text-xs transition-colors ${
                isSelected
                  ? "border-transparent text-white"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              style={isSelected ? { backgroundColor: color } : {}}
            >
              {getRoleLabel(role)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RoleSelector;
