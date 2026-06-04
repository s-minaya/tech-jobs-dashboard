// Botón individual de una opción de filtro.
// Props:
//   fullWidth → si es true, el botón ocupa todo el ancho y alinea el texto a la izquierda
//   isActive  → si es true, aplica estilos de seleccionado (fondo y texto en color primary)
//   onClick   → callback que se ejecuta al pulsar, notifica la opción elegida a FilterSection
function FilterButton({
  children,
  fullWidth = false,
  isActive = false,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded border px-2 py-1 text-xs ${fullWidth ? "w-full text-left" : ""} ${isActive ? "border-primary bg-primary text-primary-foreground" : ""}`}
    >
      {children}
    </button>
  );
}

// FilterSection
// Sección de filtro con título y sus opciones renderizadas como botones.
// Props:
//   title     → texto del encabezado (ej: "País")
//   options   → array de strings con las opciones disponibles
//   fullWidth → si es true, los botones se apilan en columna en lugar de fluir en fila
//   selected  → valor actualmente activo, viene del estado en App
//   onSelect  → callback que recibe el valor pulsado y lo propaga hacia App
function FilterSection({
  title,
  options,
  fullWidth = false,
  selected,
  onSelect,
}) {
  return (
    <div className="mb-4">
      <p className="mb-1 text-sm font-medium">{title}</p>
      <div className={`flex gap-1 ${fullWidth ? "flex-col" : "flex-wrap"}`}>
        {options.map((option) => (
          <FilterButton
            key={option}
            fullWidth={fullWidth}
            isActive={selected === option}
            onClick={() => onSelect(option)}
          >
            {option}
          </FilterButton>
        ))}
      </div>
    </div>
  );
}

export default FilterSection;
