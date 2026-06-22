import logo from "@/assets/logo.png";

// PageLoader
// Pantalla de carga que se muestra mientras el dashboard está cargando.
// Fondo: --background (hsl(235, 25%, 14%)) — mismo que el dark mode.
// El icono aparece y desaparece cíclicamente jugando con la opacidad
// mediante una animación CSS keyframe personalizada.
//

function PageLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "hsl(235, 25%, 14%)" }}
    >
      {/* Icono con animación de pulso de opacidad */}
      <div style={{ animation: "loaderPulse 2s ease-in-out 1" }}>
        <img src={logo} alt="Loading" width="128" height="128" />
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
