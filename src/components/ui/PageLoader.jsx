// PageLoader
// Pantalla de carga que se muestra mientras el dashboard está cargando.
// Fondo: --background (hsl(235, 25%, 14%)) — mismo que el dark mode.
// El icono aparece y desaparece cíclicamente jugando con la opacidad
// mediante una animación CSS keyframe personalizada.
//
// Para sustituir el icono placeholder por el definitivo:
//   1. Colocar el PNG en src/assets/logo.png
//   2. Cambiar el src del <img> a: import logo from "@/assets/logo.png"
//      y usar <img src={logo} ... />
function PageLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "hsl(235, 25%, 14%)" }}
    >
      {/* Icono con animación de pulso de opacidad */}
      <div style={{ animation: "loaderPulse 2s ease-in-out infinite" }}>
        {/* Placeholder SVG — sustituir por <img src={logo} /> cuando esté listo */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="64" height="64" rx="16" fill="hsl(249, 100%, 69%)" />
          <path
            d="M16 32h8l6-12 8 24 6-16 4 4h8"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Keyframe inyectado inline — de casi invisible a visible y vuelta */}
      <style>{`
        @keyframes loaderPulse {
          0%   { opacity: 0.1; }
          50%  { opacity: 1;   }
          100% { opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}

export default PageLoader;
