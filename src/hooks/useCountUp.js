import { useEffect, useRef, useState } from "react";

// useCountUp
// Anima un número de 0 a `target` con requestAnimationFrame — sin
// librería nueva (AGENTS.md: no añadir dependencias sin confirmación
// explícita). Fase 014: contadores de la landing y de las KPI cards del
// dashboard.
//
// Devuelve el valor CRUDO (puede tener decimales durante la animación,
// ej. para pct_with_salary) — el consumidor decide cómo formatearlo
// (Math.round para conteos enteros, toFixed(1) para porcentajes, etc.).
// En el último frame (progress=1) el valor es EXACTAMENTE `target`, sin
// pasar por el redondeo de la animación — así un target con decimales
// (35.7) no se queda pegado en un entero redondeado (36) al terminar.
//
// target=null/undefined (datos aún no cargados) no anima nada — se
// queda en 0 hasta que el consumidor tenga un número real que animar.
// Si target cambia a un valor distinto, la animación arranca de nuevo
// desde 0 (no hace falta hoy — stats solo se carga una vez — pero es el
// comportamiento correcto si algún día target cambiase).
export function useCountUp(target, durationMs = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target == null || Number.isNaN(target)) return;

    // `start` se fija con el timestamp del PRIMER frame (no con
    // performance.now() capturado fuera del callback) para garantizar
    // que usa la misma base de reloj que `now` en cada tick — jsdom no
    // garantiza que su polyfill de requestAnimationFrame comparta base
    // con performance.now(), así que restar ambos podía dar un
    // `progress` negativo y disparado (confirmado con datos reales al
    // testear este hook).
    let start = null;

    function tick(now) {
      if (start === null) start = now;
      const progress = Math.min((now - start) / durationMs, 1);
      if (progress >= 1) {
        setValue(target);
        return;
      }
      // ease-out cúbico: arranca rápido, frena suave al llegar al final.
      const eased = 1 - (1 - progress) ** 3;
      setValue(target * eased);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);

  return value;
}
