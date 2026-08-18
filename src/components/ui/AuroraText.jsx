// AuroraText
// Texto con gradiente animado (background-clip: text) — traducido a JSX
// sin TypeScript desde un componente de referencia externo aportado por
// el usuario (fase 017). El span "sr-only" lleva el texto real
// (accesibilidad/SEO); el span aria-hidden pinta el gradiente animado
// encima. Keyframe `aurora` + token `--animate-aurora` viven en
// src/index.css, junto al resto de efectos aurora del proyecto
// (auroraFlow, auroraHue).
export default function AuroraText({
  children,
  className = "",
  colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
  speed = 1,
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${colors[0]})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animationDuration: `${10 / speed}s`,
  };

  return (
    <span className={`relative inline-block ${className}`}>
      <span className="sr-only">{children}</span>
      <span
        className="animate-aurora relative bg-size-[200%_auto] bg-clip-text text-transparent"
        style={gradientStyle}
        aria-hidden="true"
      >
        {children}
      </span>
    </span>
  );
}
