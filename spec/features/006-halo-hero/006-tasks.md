# 006 · Halo Hero — Tareas

## Implementación — `src/components/layout/MainContent.jsx`

- [x] `h1`: cambiar `font-heading` → `font-sans`.

- [x] Span "Tech Jobs": eliminar el ternario `isDark ? ... : ...` y dejar
  un único token (`var(--color-text-primary)`).

- [x] Span "Dashboard": eliminar el ternario y mover a clase Tailwind
  `text-primary` (sin `style`).

- [x] Subtítulo "Mercado tech europeo": eliminar el ternario y mover a
  clase Tailwind. **Ajuste sobre el snippet de `tasks.md`:** el ejemplo
  proponía `text-muted-foreground`, pero `006-spec.md` pide explícitamente
  `--color-text-secondary` en sus tres menciones (dark, light y criterio de
  aceptación) — son tokens distintos (`--color-text-muted` vs
  `--color-text-secondary`), y `text-muted-foreground` ya está reservado a
  `--color-text-muted` vía el puente de `@theme inline`. Se siguió el spec:
  `text-(--color-text-secondary)` (sintaxis canónica de variable CSS de
  Tailwind v4, sugerida por el linter sobre `text-[var(--color-text-secondary)]`).

- [x] Verificar que `isDark` sigue siendo necesario después de los cambios
  (lo usan `DarkVeil` y `Aurora`) — confirmado, no se eliminó de las props.

- [x] Actualizar el comentario del componente: reflejar que el título usa
  Inter y tokens Halo en ambos temas, sin lógica `isDark` en los estilos
  de texto.

## Verificación

- [x] Arrancar dev server en **dark mode**:
  - "Tech Jobs" legible (casi blanco) sobre DarkVeil oscuro. ✓
  - "Dashboard" en `--color-primary` (#5B6BFF). ✓
  - Subtítulo en `--color-text-secondary` (muted, no completamente opaco). ✓
  - El título usa Inter display (no monospace). ✓
  - ThemeToggle visible en la esquina superior derecha. ✓
- [x] Cambiar a **light mode**:
  - "Tech Jobs" legible sobre Aurora claro con `--color-text-primary` — no
    hizo falta ajustar a `white` ni `--color-elevated`, el contraste es
    bueno tal cual (ver captura en la verificación). ✓
  - "Dashboard" en `--color-primary` (#5B6BFF sobre Aurora claro). ✓
  - Subtítulo legible. ✓
  - Aurora visible como fondo. ✓
- [x] `npx vitest run` — 305/305 tests pasando sin cambios en tests.
- [x] `npm run build` — sin errores.
- [x] La landing no ha sido modificada.

## Hallazgos fuera de alcance (reportados por el usuario, investigados solo lectura)

Durante la verificación se investigaron dos problemas reportados por el
usuario, no relacionados con esta feature:

1. **Título de "Top Skills más demandadas" reportado como desaparecido.**
   No se pudo reproducir: en dark y light mode el título se renderiza
   correctamente (verificado con Playwright, capturas en ambos temas).
   `ChartCard.jsx`, `TopSkillsChart.jsx` y `DecryptedText.jsx` no fueron
   tocados por ninguna fase 001-006. Posible causa: estado de HMR obsoleto
   durante el desarrollo activo de fases anteriores. No se aplicó ningún
   cambio de código por falta de causa reproducible.

2. **`Error: canceling statement due to statement timeout` en "Salario
   mediano anual por rol y país".** Confirmado que la query de
   `/api/salary/by-role-country` es lenta de por sí (13.8s con
   `periodo=90d`, 5.3s con "todo el histórico" — ambas veces sin timeout
   en este entorno, pero claramente al límite). La query combina
   `PERCENTILE_CONT` (agregado ordenado) con `GROUP BY` sobre `country_code,
   role_category` en la tabla `jobs` — muy probablemente le falta un índice
   de soporte. Es un problema de rendimiento de base de datos, dentro de
   `api/` (zona congelada, responsabilidad de otra persona) — **no se ha
   tocado ningún archivo de `api/`**. Reportado al usuario para que decida
   si se investiga como una fase/tarea aparte.

## Cierre

- [x] Documentar en este archivo si se tuvo que ajustar algún color por
  contraste — no hizo falta ningún ajuste.
- [x] Validar contra todos los criterios de aceptación de `spec.md`.
- [x] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [x] Commit (solo tras confirmación del usuario):
  `refactor: replace hardcoded hero colors with Halo tokens`
