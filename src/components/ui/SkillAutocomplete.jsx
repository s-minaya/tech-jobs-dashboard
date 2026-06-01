import { useState, useRef, useEffect } from "react";

// SkillAutocomplete
// Input con dropdown que permite buscar y seleccionar una skill de la BD.
// La lista completa se carga una vez y el filtrado se hace en el frontend
// para que la búsqueda sea instantánea sin peticiones de red adicionales.
//
// Props:
//   skills         → array de { name, category } con todas las skills de la BD
//   selectedSkill  → nombre de la skill actualmente seleccionada, o null
//   onSelect       → callback que recibe el nombre de la skill seleccionada
//   onClear        → callback para limpiar la selección
function SkillAutocomplete({ skills, selectedSkill, onSelect, onClear }) {
  // Texto que el usuario está escribiendo en el input
  const [query, setQuery] = useState("");
  // Controla si el dropdown está abierto
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filtra las skills por el texto escrito, insensible a mayúsculas/minúsculas.
  // Si no hay texto muestra todas (para que el scroll funcione desde el inicio).
  const filtered =
    query.trim() === ""
      ? skills
      : skills.filter((s) =>
          s.name.toLowerCase().includes(query.toLowerCase()),
        );

  // Cierra el dropdown si el usuario hace clic fuera del componente
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e) {
    setQuery(e.target.value);
    setIsOpen(true);
    // Si el usuario modifica el texto después de haber seleccionado una skill,
    // limpiamos la selección para que el mapa vuelva al estado sin filtro de skill
    if (selectedSkill) onClear();
  }

  function handleSelect(skillName) {
    setQuery(skillName); // mostramos el nombre en el input
    setIsOpen(false);
    onSelect(skillName);
  }

  function handleClear() {
    setQuery("");
    setIsOpen(false);
    onClear();
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar skill (React, Python, AWS...)"
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none"
        />

        {/* Botón para limpiar la búsqueda, solo visible cuando hay texto */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown con los resultados */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-lg"
        >
          {filtered.length === 0 ? (
            // Mensaje cuando la búsqueda no coincide con ninguna skill
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No hay skills que coincidan con "{query}".
            </p>
          ) : (
            // Lista con scroll: max-h limita la altura y overflow-y-auto añade scroll
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.map((skill) => (
                <li
                  key={skill.name}
                  onClick={() => handleSelect(skill.name)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-1.5 text-xs transition-colors hover:bg-muted ${
                    skill.name === selectedSkill ? "bg-muted font-medium" : ""
                  }`}
                >
                  <span>{skill.name}</span>
                  {/* Categoría de la skill en gris, ayuda al usuario a identificarla */}
                  {skill.category && (
                    <span className="ml-2 shrink-0 text-muted-foreground">
                      {skill.category}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Indicador de skill seleccionada activa */}
      {selectedSkill && (
        <p className="mt-1 text-xs text-muted-foreground">
          Mostrando ofertas con{" "}
          <strong className="font-medium text-foreground">
            {selectedSkill}
          </strong>
          .{" "}
          <button
            onClick={handleClear}
            className="text-muted-foreground underline transition-colors hover:text-foreground"
          >
            Ver todas las skills
          </button>
        </p>
      )}
    </div>
  );
}

export default SkillAutocomplete;
