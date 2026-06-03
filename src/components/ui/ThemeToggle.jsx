import { RiSunFill, RiMoonFill } from "react-icons/ri";

// ThemeToggle
// DARK MODE:  píldora oscura | [ ○  🌙 ]
//
// LIGHT MODE: píldora blanca | [ ☀️  ○ ]
//
function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`
        relative flex h-7 w-16 cursor-pointer items-center justify-between rounded-full px-1.5
        transition-colors duration-300
        ${isDark
          ? "bg-background"           // dark: píldora oscura
          : "bg-white"              // light: píldora blanca
        }
      `}
    >
      {/* Lado izquierdo */}
      <span className="flex h-5 w-5 items-center justify-center">
        {isDark ? (
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: "oklch(0.63 0.27 281)" }}
          />
        ) : (
          // Light: sol oscuro sin envoltura
          <RiSunFill className="h-5 w-5 text--background" />
        )}
      </span>

      {/* Lado derecho */}
      <span className="flex h-5 w-5 items-center justify-center">
        {isDark ? (
          
          <RiMoonFill className="h-5 w-5 text-white" />
        ) : (
          
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: "oklch(0.63 0.27 281)" }}
          />
        )}
      </span>
    </button>
  );
}

export default ThemeToggle;