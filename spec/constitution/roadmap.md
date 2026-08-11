# Roadmap

## Hecho ✅

_(anterior al rediseño Halo)_

1. **000 · Dashboard v1** — visualizaciones dinámicas completas, filtros, persistencia localStorage, tests unitarios, E2E y CI.

2. **001 · Halo tokens + auditoría** — variables CSS sustituidas por los tokens
   Halo (dual dark/light), Inter + JetBrains Mono instaladas, auditoría de
   organización/nomenclatura/duplicación aplicada. Ver
   `spec/features/001-halo-tokens/audit.md` para el detalle y los hallazgos
   diferidos a fases 004/005/006/007.

3. **002 · Halo ChartCard** — borde aurora animado sustituido por hairline
   1px `--color-border` estático; fondo de card a `--color-surface`; badge
   "Actualizando..." con tokens Halo (`--color-elevated`). El aurora queda
   reservado a GlowButton/hero. Sin cambios en `DecryptedText`, el ⓘ de
   filtros ni la lógica de estados.

4. **003 · Halo Stat Tiles** — KPI cards del hero pasan de wrapper/inner con
   hover aurora a `.stat-tile` (misma superficie que `ChartCard`) con una
   franja aurora animada de 3px en la parte superior, recortada a las
   esquinas redondeadas (a petición del usuario, en vez del accent bar de
   signal color plano del plan original). Valor en JetBrains Mono, label en
   patrón eyebrow, icono de calendario eliminado. Sin cambios en el
   fetching ni el grid responsive.

5. **004 · Halo Filtros** — `FilterDrawer`/`FilterSheet` pasan de
   `bg-background` a `bg-elevated` (nivel de superficie propio de un panel
   superpuesto); badge del FAB y anillo pulsante a `bg-primary`; chips
   inactivos de `FilterSection` a `bg-surface`; label de sección sin
   opacidad `/70`. Corregido un bug preexistente de la fase 001: `key`
   spreadeado en `FilterSheet` (warning de React 19). `GlowButton` y la
   lógica de drag no se tocaron. De paso se descubrió y arregló
   `FilterDrawer.test.jsx`, que desde su creación testeaba por error
   `SummaryStats` (contenido duplicado) en vez de `FilterDrawer`.

6. **005 · Halo BottomNav** — última barra con valores hardcodeados:
   `bg-background/95` → `bg-elevated/95` (mismo nivel de superficie que
   drawer/sheet), `border-white/8` → `border-border`. Cambio mínimo, sin
   tocar lógica ni tests.

7. **006 · Halo Hero** — título del hero: `font-heading` (Space Mono,
   desinstalado en 001) → `font-sans` (Inter); colores hardcodeados/con
   ternario `isDark ? ... : ...` de "Tech Jobs", "Dashboard" y el subtítulo
   → un único token Halo por elemento en ambos temas
   (`--color-text-primary`, `--color-primary`, `--color-text-secondary`).
   `DarkVeil`/`Aurora`/`ThemeToggle` sin cambios. Durante la verificación se
   investigaron (solo lectura) dos reportes del usuario ajenos a esta
   feature: un título de gráfica no reproducible como desaparecido, y un
   timeout de Postgres en la query de salario (confirmado lento — 5-14s —
   probable falta de índice; es trabajo de `api/`, zona congelada, no
   tocado). Ver `006-tasks.md` para el detalle.

7. **007 · Halo Charts Internals** — colores hardcodeados dentro de las
   gráficas sustituidos por tokens Halo: `TopSkillsChart` usa
   `var(--color-primary)` en vez de `var(--chart-1)` (que sigue apuntando a
   `--role-backend`, sin tocar — también es el fallback de
   `roleLabels.js`); `tickColor` de `TopSkillsChart`/`DemandByRoleChart`/
   `SalaryChart` se resuelve con `getComputedStyle` desde
   `--color-text-primary`/`-secondary` en vez de hex hardcodeado, mediante
   un hook `useIsDark` nuevo y compartido (extraído de la implementación
   original de `TopSkillsChart`); tooltips de esas dos últimas pasan de
   `bg-background border-border/50` a `bg-elevated border-border`;
   `EuropeMap` usa `--color-border`/`--color-text-primary` para el stroke
   de países; `HeatmapSvg`/`HeatmapLegend` usan `--color-surface` +
   `--color-border` para la celda "sin datos". No se pudo verificar
   visualmente con datos reales (misma limitación de red del sandbox que
   en fases 001/003/006); verificado con 309/309 tests, build limpio y 0
   errores de consola. Ver `007-tasks.md` para el detalle.

## En curso 🔜

8. **008 · Integridad de datos en la co-ocurrencia de skills** — no es
   parte del rediseño Halo; fix de datos descubierto en conversación
   directa con el usuario sobre el heatmap. Backend:
   `/api/skills/cooccurrence` agrupaba por `role_category` además de por
   el par de skills, fragmentando cada par real en varias filas con
   `co_count` parcial y desperdiciando el `LIMIT 1000` en duplicados —
   corregido. Frontend: `filterSkillsWithCoOccurrence` pasa de exigir "al
   menos 1" co-ocurrencia a un umbral de conectividad mínima real
   (k-core: `minDegree`/`minEdgeCount`, con fallback para conjuntos
   pequeños), 100% dinámico con la BD. Ver
   `spec/features/008-skills-cooccurrence/008-tasks.md` para el detalle.

## Backlog 💡

9. **009 · Halo Responsive y Pulido** — revisión final de breakpoints, espaciados y componentes menores.

> Una sola feature activa a la vez. No se empieza la siguiente hasta que la anterior pasa todos los criterios de aceptación.
