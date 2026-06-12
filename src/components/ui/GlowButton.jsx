import { forwardRef } from "react";

// GlowButton
// Botón con efecto aurora animado (conic-gradient rotatorio).
// Colores: #7cff67 → #B497CF → #5227FF
//
// Comportamiento:
//   Por defecto → relleno con gradiente aurora completo (fondo animado)
//   Hover       → gradiente solo en el borde (4px), relleno oscuro
//
// Variantes:
//   solid → para CTAs principales (landing, acciones primarias)
//   ghost → para filtros y chips (relleno más sutil)
//
// El keyframe auroraRotate y las clases CSS están en index.css
// para ser globales y reutilizables sin repetir código.
const GlowButton = forwardRef(function GlowButton(
  { children, variant = "solid", className = "", ...rest },
  ref,
) {
  return (
    <div className={`glow-button-wrapper glow-${variant} ${className}`}>
      <button ref={ref} className="glow-button-inner" {...rest}>
        {children}
      </button>
    </div>
  );
});

export default GlowButton;
