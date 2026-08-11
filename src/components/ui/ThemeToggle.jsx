import { RiSunFill, RiMoonFill } from "react-icons/ri";

// ThemeToggle
// DARK MODE:  píldora oscura | [ ○  🌙 ]
//   - dot izquierda con color primary (var(--color-primary))
//   - luna blanca derecha
//
// LIGHT MODE: píldora blanca | [ ☀️  ○ ]
//   - sol izquierda
//   - dot derecha con color primary (var(--color-primary))
//
// Mismos dos elementos y las mismas posiciones de siempre, pero ahora
// viajan: el dot y el icono se desplazan (translateX) intercambiando su
// posición en vez de teletransportarse de golpe, y el icono cruza de
// luna (blanca) a sol (con el color primary, el mismo que lleva el dot)
// mientras viaja — y a la inversa al volver a dark. bg-surface en vez de
// bg-background en dark: --color-background es casi negro y la píldora
// se fundía con el hero animado; --color-surface es un nivel de
// superficie por encima. Usa --duration-slow + --easing-standard (tokens
// de movimiento de Halo) para que el intercambio se note suave y no un
// simple fundido de 200ms.
function ThemeToggle({ isDark, onToggle }) {
  const motion = {
    transitionDuration: "var(--duration-slow)",
    transitionTimingFunction: "var(--easing-standard)",
  };
  // Distancia entre la posición "dark" y la posición "light" de cada
  // elemento — misma para ambos porque cruzan por el mismo hueco del track.
  const travel = "2rem";

  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`relative h-7 w-16 shrink-0 cursor-pointer rounded-full transition-colors ${isDark ? "bg-surface" : "bg-white"}`}
      style={motion}
    >
      {/* Dot: siempre primary, viaja de izquierda (dark) a derecha (light) */}
      <span
        className="absolute top-1.5 left-1.5 h-4 w-4 rounded-full transition-transform"
        style={{
          backgroundColor: "var(--color-primary)",
          transform: isDark ? "translateX(0)" : `translateX(${travel})`,
          ...motion,
        }}
      />

      {/* Icono: luna en dark (derecha) <-> sol en light (izquierda).
          El wrapper viaja; dentro, luna y sol se cruzan en opacidad. */}
      <span
        className="absolute top-1 right-1.5 flex h-5 w-5 items-center justify-center transition-transform"
        style={{
          transform: isDark ? "translateX(0)" : `translateX(-${travel})`,
          ...motion,
        }}
      >
        <RiMoonFill
          className="absolute h-5 w-5 text-white transition-opacity"
          style={{ opacity: isDark ? 1 : 0, ...motion }}
        />
        <RiSunFill
          className="absolute h-5 w-5 transition-opacity"
          style={{
            opacity: isDark ? 0 : 1,
            color: "var(--color-primary)",
            ...motion,
          }}
        />
      </span>
    </button>
  );
}

export default ThemeToggle;
