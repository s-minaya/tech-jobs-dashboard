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

## En curso 🔜

_(ninguna — siguiente: 007)_

## Backlog 💡

8. **007 · Halo Charts Internals** — colores internos de todas las gráficas adaptados a la paleta Halo.
9. **008 · Halo Responsive y Pulido** — revisión final de breakpoints, espaciados y componentes menores.

> Una sola feature activa a la vez. No se empieza la siguiente hasta que la anterior pasa todos los criterios de aceptación.
