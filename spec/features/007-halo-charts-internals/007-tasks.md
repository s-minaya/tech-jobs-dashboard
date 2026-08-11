# 007 · Halo Charts Internals — Tareas

## Preparación

- [ ] Grep de `var(--chart-1)` en `index.css` para ver si ya apunta a
  `--color-primary`:
  ```bash
  grep "chart-1" src/index.css
  ```
- [ ] Grep de `var(--border)` (nombre shadcn) que queden en las gráficas:
  ```bash
  grep -r "var(--border)" src/components/Charts/ --include="*.jsx"
  ```

## Hook — `src/hooks/useIsDark.js` (nuevo)

- [ ] Crear `src/hooks/useIsDark.js` con el hook extraído de `TopSkillsChart`
  (ver plan para el código exacto).

## TopSkillsChart — `src/components/Charts/TopSkillsChart.jsx`

- [ ] Eliminar la definición inline de `useIsDark` (la función + el
  `useEffect` con `MutationObserver`).
- [ ] Importar `useIsDark` desde `@/hooks/useIsDark`.
- [ ] Actualizar `tickColor` para usar `getComputedStyle`:
  ```js
  const tickColor = getComputedStyle(document.documentElement)
    .getPropertyValue(isDark ? "--color-text-primary" : "--color-text-secondary")
    .trim() || (isDark ? "#F2F4F8" : "#64748B");
  ```
- [ ] Verificar `var(--chart-1)` en `chartConfig` y `<Bar fill=...>` —
  si el grep de preparación confirma que apunta a `--color-primary`,
  no tocar; si no, reemplazar por `var(--color-primary)`.

## DemandByRoleChart — `src/components/Charts/DemandByRoleChart.jsx`

- [ ] Importar `useIsDark` desde `@/hooks/useIsDark`.
- [ ] Reemplazar la lectura directa del DOM:
  ```js
  // Eliminar:
  const isDark = document.documentElement.classList.contains("dark");
  // Añadir al nivel del componente:
  const isDark = useIsDark();
  ```
- [ ] Actualizar `tickColor` con `getComputedStyle` (mismo patrón que TopSkills).
- [ ] Tooltips: `bg-background` → `bg-elevated`, `border-border/50` →
  `border-border`.

## SalaryChart — `src/components/Charts/SalaryChart.jsx`

- [ ] Mismo cambio de `isDark` y `tickColor` que `DemandByRoleChart`.
- [ ] Tooltips: mismo cambio que `DemandByRoleChart`.

## EuropeMap — `src/components/Charts/EuropeMap.jsx`

- [ ] `stroke` de países normales: `"var(--border)"` → `"var(--color-border)"`.
- [ ] `stroke` de país seleccionado: `"#ffffff"` → `"var(--color-text-primary)"`.

## HeatmapSvg — `src/components/Charts/HeatmapSvg.jsx`

- [ ] En la función `fill` de las celdas D3, reemplazar:
  ```js
  // Eliminar:
  const isDark = document.documentElement.classList.contains("dark");
  if (co === 0) return isDark ? "hsl(237, 22%, 22%)" : "#f1f5f9";
  // Añadir:
  if (co === 0) return "var(--color-surface)";
  ```

## HeatmapLegend — `src/components/Charts/HeatmapLegend.jsx`

- [ ] Celda sin datos: reemplazar los estilos inline hardcodeados:
  ```jsx
  // Antes:
  style={{ backgroundColor: isDark ? "hsl(237, 22%, 22%)" : "#f1f5f9",
           border: isDark ? "..." : "..." }}
  // Después:
  style={{ backgroundColor: "var(--color-surface)",
           border: "1px solid var(--color-border)" }}
  ```
- [ ] Eliminar la variable `isDark` del componente si ya no se usa en
  ningún otro sitio del archivo.
- [ ] Nota final: `text-muted-foreground/70` → `text-muted-foreground`.

## Tests — `src/tests/hooks/useIsDark.test.js` (nuevo)

- [ ] Crear test básico del hook:
  - Arranca en `false` si `<html>` no tiene clase `dark`.
  - Arranca en `true` si `<html>` tiene clase `dark`.
  - Reacciona correctamente al añadir/quitar la clase `dark`.
  (Patrón similar a `useTheme.test.js`.)

## Verificación

- [ ] Arrancar dev server y comprobar en **dark mode**:
  - Ticks de los ejes de las tres gráficas en color claro (no negro).
  - Celdas vacías del heatmap en `--color-surface` (no gris custom).
  - País seleccionado en el mapa con borde claro (no `#ffffff` hardcodeado).
- [ ] Cambiar a **light mode** con el toggle:
  - Ticks de los ejes en color oscuro sin recargar.
  - Celdas vacías del heatmap en `--color-surface` light.
  - Tooltips con fondo `bg-elevated` (ligeramente diferente de background).
- [ ] `npx vitest run` — 100% de tests pasando incluyendo el nuevo
  `useIsDark.test.js`.
- [ ] `npm run build` — sin errores.
- [ ] La landing no ha sido modificada.

## Cierre

- [ ] Validar contra todos los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [ ] Commit (solo tras confirmación del usuario):
  `refactor: replace hardcoded chart colors with Halo tokens, extract useIsDark hook`
