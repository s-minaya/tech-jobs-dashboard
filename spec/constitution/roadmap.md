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

## En curso 🔜

_(ninguna — siguiente: 003)_

## Backlog 💡

4. **003 · Halo Stat Tiles** — KPI cards con patrón stat-tile de Halo y signal colors.
5. **004 · Halo Filtros** — FilterDrawer, FilterSheet y FilterSection con estética Halo (conservando GlowButton en CTAs).
6. **005 · Halo BottomNav** — barra de navegación móvil con estética Halo.
7. **006 · Halo Hero** — sección hero del dashboard con Aurora, fondos dual-theme y ThemeToggle.
8. **007 · Halo Charts Internals** — colores internos de todas las gráficas adaptados a la paleta Halo.
9. **008 · Halo Responsive y Pulido** — revisión final de breakpoints, espaciados y componentes menores.

> Una sola feature activa a la vez. No se empieza la siguiente hasta que la anterior pasa todos los criterios de aceptación.
