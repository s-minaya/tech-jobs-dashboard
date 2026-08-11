# 007 · Halo Charts Internals — Plan

## Enfoque

Orden de implementación: primero el hook compartido (base para lo demás),
luego los tres archivos que usan `tickColor`, luego `EuropeMap`,
luego `HeatmapSvg` y `HeatmapLegend` juntos (comparten la misma lógica
de color de celdas vacías).

## Implementación

### 1. Crear `src/hooks/useIsDark.js`

Extraer el hook que ya existe en `TopSkillsChart` y moverlo a su propio
archivo. `TopSkillsChart` pasa a importarlo desde `@/hooks/useIsDark`.

```js
// src/hooks/useIsDark.js
import { useState, useEffect } from "react";

// useIsDark
// Devuelve true si el documento tiene la clase "dark" en <html>.
// Usa MutationObserver para reaccionar al cambio de tema en tiempo real
// sin necesidad de recargar la página.
// Centralizado aquí para que todas las gráficas usen la misma lógica
// en vez de leer document.documentElement.classList directamente en cada render.
export function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return isDark;
}
```

### 2. tickColor — TopSkillsChart, DemandByRoleChart, SalaryChart

En los tres archivos:
- Importar `useIsDark` desde `@/hooks/useIsDark`.
- Eliminar la definición inline del hook (en `TopSkillsChart`) o la lectura
  directa del DOM (en los otros dos).
- Resolver `tickColor` con `getComputedStyle`:
  ```js
  const isDark = useIsDark();
  const tickColor = getComputedStyle(document.documentElement)
    .getPropertyValue(isDark ? "--color-text-primary" : "--color-text-secondary")
    .trim() || (isDark ? "#F2F4F8" : "#64748B"); // fallback si CSS no está listo
  ```

### 3. var(--chart-1) en TopSkillsChart

Hacer grep: `grep "chart-1" src/index.css`. Si el token ya apunta a
`--color-primary`, no hay nada que cambiar. Si no, reemplazar
`var(--chart-1)` por `var(--color-primary)` en el `chartConfig` y en el
`<Bar fill=...>`.

### 4. EuropeMap — strokes

```jsx
// stroke país normal:
"var(--border)" → "var(--color-border)"

// stroke país seleccionado:
"#ffffff" → "var(--color-text-primary)"
```

### 5. Tooltips de DemandByRoleChart y SalaryChart

```jsx
// bg-background → bg-elevated
// border-border/50 → border-border
```

### 6. HeatmapSvg y HeatmapLegend — celdas sin datos

En `HeatmapSvg`, la función `fill` de las celdas:
```js
// Antes:
if (co === 0) return isDark ? "hsl(237, 22%, 22%)" : "#f1f5f9";
// Después:
if (co === 0) return "var(--color-surface)";
```
Eliminar la lectura `const isDark = document.documentElement.classList.contains("dark")`
dentro de la función de D3 — ya no hace falta.

En `HeatmapLegend`, los estilos inline de la celda sin datos:
```jsx
// Antes:
style={{ backgroundColor: isDark ? "hsl(237, 22%, 22%)" : "#f1f5f9",
         border: isDark ? "1px solid hsl(237, 22%, 30%)" : "1px solid #e2e8f0" }}
// Después:
style={{ backgroundColor: "var(--color-surface)",
         border: "1px solid var(--color-border)" }}
```
Eliminar la variable `isDark` de `HeatmapLegend` si ya no se usa en otro sitio.

### 7. HeatmapLegend — nota final

```jsx
className="... text-muted-foreground/70"
→
className="... text-muted-foreground"
```

### 8. Test — `src/tests/hooks/useIsDark.test.js`

Test básico del nuevo hook: inicialización, reacción a cambio de clase.
Similar a `useTheme.test.js`.

## Decisiones

- **`getComputedStyle` para tickColor** — Recharts no puede leer CSS
  variables en SVG `<text>`. `getComputedStyle` resuelve el token al
  valor hex real en el momento del render. Es más mantenible que los
  hex hardcodeados porque si el token cambia, el tick se actualiza solo.
- **`var(--color-surface)` para celdas vacías** — en dark (#14151C) es
  claramente distinto del rojo de "raramente juntas" (RdYlGn) y del negro
  del fondo. En light (#ffffff) igual. Más semántico que el gris custom.
- **Deduplicar `useIsDark` ahora** — estaba diferido desde la auditoría 001
  porque tocar las gráficas era trabajo de esta fase. El momento correcto
  es este.

## Riesgos

- **`getComputedStyle` en SSR o tests** — en jsdom `getComputedStyle` no
  resuelve variables CSS custom; devuelve string vacío. El fallback
  `|| (isDark ? "#F2F4F8" : "#64748B")` lo cubre. En tests, el tick es
  un elemento SVG que no se inspecciona — ningún test debería romperse.
- **`var(--color-surface)` en D3** — D3 asigna el valor como atributo SVG
  `fill`. Los atributos SVG `fill` sí resuelven variables CSS en el
  navegador (a diferencia de los `<text>` de Recharts). Verificar que
  el color cambia al alternar tema.
