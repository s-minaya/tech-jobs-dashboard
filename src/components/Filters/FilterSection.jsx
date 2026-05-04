// Botón individual de una opción de filtro.
// fullWidth: si es true, el botón ocupa todo el ancho del contenedor
// y alinea el texto a la izquierda (usado en filtros de tipo lista).
function FilterButton({ children, fullWidth = false }) {
  return (
    <button
      className={`rounded border px-2 py-1 text-xs ${fullWidth ? "w-full text-left" : ""}`}
    >
      {children}
    </button>
  );
}

// Sección de filtro con título y sus opciones renderizadas como botones.
// Props:
//   title     → texto del encabezado de la sección (ej: "País")
//   options   → array de strings con las opciones disponibles (ej: ["Todos", "ES", "GB"])
//   fullWidth → si es true, los botones se apilan en columna en lugar de fluir en fila
function FilterSection({ title, options, fullWidth = false }) {
  return (
    <div className="mb-4">
      <p className="mb-1 text-sm font-medium">{title}</p>
      <div className={`flex gap-1 ${fullWidth ? "flex-col" : "flex-wrap"}`}>
        {options.map((option) => (
          <FilterButton key={option} fullWidth={fullWidth}>
            {option}
          </FilterButton>
        ))}
      </div>
    </div>
  );
}

export default FilterSection;