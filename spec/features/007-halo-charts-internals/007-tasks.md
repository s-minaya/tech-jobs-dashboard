# 007 · Halo Charts Internals — Tareas

## Preparación

- [x] Grep de `var(--chart-1)` en `index.css` para ver si ya apunta a
  `--color-primary`. **No apuntaba** — desde la fase 001 apunta a
  `var(--role-backend)` (decisión explícita de esa fase: "chart-1..5 ahora
  referencian --role-* en vez de duplicar el valor"), y `roleLabels.js`
  usa `var(--chart-1)` como fallback de `getRoleColor()` para roles
  desconocidos — cambiar el token globalmente habría afectado ese
  fallback, que sí debe seguir siendo un color de familia "rol", no el
  primary de marca. Se siguió la instrucción literal del plan
  ("reemplazar por `var(--color-primary)` **directamente**"): solo se
  cambiaron las dos referencias en `TopSkillsChart.jsx`
  (`chartConfig.job_count.color` y `<Bar fill=...>`), sin tocar
  `index.css` ni `roleLabels.js`.
- [x] Grep de `var(--border)` (nombre shadcn) en `src/components/Charts/` —
  encontrado 1 uso, en `EuropeMap.jsx` (stroke de países normales).

## Hook — `src/hooks/useIsDark.js` (nuevo)

- [x] Creado con el hook extraído de `TopSkillsChart` (MutationObserver,
  idéntico comportamiento).

## TopSkillsChart — `src/components/Charts/TopSkillsChart.jsx`

- [x] Eliminada la definición inline de `useIsDark`.
- [x] Importa `useIsDark` desde `@/hooks/useIsDark`.
- [x] `tickColor` actualizado con `getComputedStyle` — fallback usando los
  valores hex reales de los tokens (`#f5f6f8` / `#4b4b63`, no los del
  ejemplo del plan que no coincidían exactamente con `index.css`).
- [x] `var(--chart-1)` reemplazado por `var(--color-primary)` (ver nota de
  Preparación).

## DemandByRoleChart — `src/components/Charts/DemandByRoleChart.jsx`

- [x] Importa `useIsDark` desde `@/hooks/useIsDark`.
- [x] Reemplazada la lectura directa del DOM por `useIsDark()`.
- [x] `tickColor` actualizado con `getComputedStyle` (mismo patrón).
- [x] Tooltip: `bg-background` → `bg-elevated`, `border-border/50` →
  `border-border`. De paso se actualizó un comentario JSX que hablaba de
  "tickColor blanco en dark" (ya no describía el comportamiento real).

## SalaryChart — `src/components/Charts/SalaryChart.jsx`

- [x] Mismo cambio de `isDark`, `tickColor` y tooltip que `DemandByRoleChart`.

## EuropeMap — `src/components/Charts/EuropeMap.jsx`

- [x] `stroke` de países normales: `"var(--border)"` → `"var(--color-border)"`.
- [x] `stroke` de país seleccionado: `"#ffffff"` → `"var(--color-text-primary)"`.

## HeatmapSvg — `src/components/Charts/HeatmapSvg.jsx`

- [x] Celdas sin datos: `isDark ? "hsl(237, 22%, 22%)" : "#f1f5f9"` →
  `"var(--color-surface)"`. Eliminada la lectura de `classList` dentro de
  la función `fill` de D3.

## HeatmapLegend — `src/components/Charts/HeatmapLegend.jsx`

- [x] Celda sin datos: estilos inline hardcodeados → `var(--color-surface)`
  / `1px solid var(--color-border)`.
- [x] Eliminada la variable `isDark` — no se usaba en ningún otro sitio del
  archivo.
- [x] Nota final: `text-muted-foreground/70` → `text-muted-foreground`.

## Tests — `src/tests/hooks/useIsDark.test.js` (nuevo)

- [x] Creado con 4 tests: arranque en `false`/`true` según la clase `dark`
  inicial, y reactividad (añadir/quitar la clase después de montar,
  esperando con `waitFor` a que el `MutationObserver` dispare). Patrón
  igual que `useTheme.test.js`.

## Verificación

- [x] `npx vitest run` — 309/309 tests pasando (305 previos + 4 nuevos de
  `useIsDark`). Los 55 tests de `Charts/` + el hook pasan sin cambios de
  aserciones — ejercitan estos mismos componentes con datos de MSW.
- [x] `npm run build` — sin errores.
- [x] La landing no ha sido modificada.
- [x] Arrancar dev server y comprobar visualmente en dark y light mode: el
  shell del dashboard (cards, bordes, fondos, ThemeToggle) se ve correcto
  en ambos temas sin errores de consola.
  **Limitación del entorno (igual que en las fases 001, 003 y 006):** este
  sandbox no tiene salida de red fiable hacia la BD real de Supabase — se
  esperó hasta 150s con el backend conectado y las 6 gráficas seguían en
  "Cargando...". No se pudieron fotografiar las barras/mapa/heatmap ya
  cargados con datos reales para confirmar visualmente `tickColor`,
  `fill="var(--color-primary)"`, los strokes del mapa ni las celdas del
  heatmap. Se compensa con: revisión de código línea a línea, 0 errores de
  consola durante toda la espera (incluye que `getComputedStyle` no lanza
  en el navegador), y los tests de `Charts/` que sí renderizan estos
  componentes con datos (de MSW) y pasan sin fallos.

## Cierre

- [x] Validar contra todos los criterios de aceptación de `spec.md`.
- [x] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [ ] Commit (solo tras confirmación explícita):
  `refactor: replace hardcoded chart colors with Halo tokens, extract useIsDark hook`
