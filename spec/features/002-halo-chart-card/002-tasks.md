# 002 · Halo ChartCard — Tareas

## Preparación

- [ ] Grep de usos actuales de las clases que se van a renombrar:
  ```bash
  grep -r "chart-card-border\|chart-card-inner" src/ --include="*.jsx" --include="*.css"
  ```
  Resultado esperado: solo `ChartCard.jsx` y `index.css`. Si hay más, tratar antes de continuar.

## CSS — `src/index.css`

- [ ] Localizar el bloque `/* CHART CARD */` (línea ~466) y reemplazar
  `.chart-card-border` + `.chart-card-inner` + `:root:not(.dark) .chart-card-inner`
  por una única clase `.chart-card`:
  ```css
  /* ── Chart card — superficie Halo con borde hairline ─────────────────────
     Nivel de superficie 2 (--color-surface) sobre el fondo de página
     (--color-background), separados por borde 1px --color-border.
     Tanto dark como light mode usan el mismo token — solo cambia el valor. */
  .chart-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
  }
  ```
- [ ] Eliminar el comentario `/* TODO: rediseñar en fase 002 (Halo ChartCard) */` que queda encima.
- [ ] Verificar que `@keyframes auroraFlow` sigue presente más abajo en el archivo
  (lo usa GlowButton — NO eliminarlo).
- [ ] Verificar que `.chart-graph-area` y su variante light mode no se han tocado.

## JSX — `src/components/ui/ChartCard.jsx`

- [ ] Reemplazar el contenedor doble:
  ```jsx
  // Antes:
  <div className="chart-card-border relative">
    <div className="chart-card-inner p-5">
  
  // Después:
  <div className="chart-card relative p-5">
  ```
  (cerrar el div sobrante al final del return).

- [ ] Actualizar el badge "Actualizando..." con tokens Halo:
  ```jsx
  // Antes:
  <span className="rounded-full border border-border bg-background/80 px-2 py-0.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
  
  // Después:
  <span className="rounded-full border border-border bg-elevated px-2 py-0.5 text-xs text-muted-foreground">
  ```
  (eliminar `shadow-sm` y `backdrop-blur-sm` — Halo no usa blur en chips).

- [ ] Actualizar el comentario de bloque del componente para que refleje la
  nueva técnica (borde hairline, sin gradiente animado).

- [ ] Verificar que `DecryptedText`, el ⓘ (`warning` prop) y la lógica de
  estados (`showSpinner`, `showStale`, `error`) no han sido modificados.

## Verificación

- [ ] Arrancar dev server y comprobar visualmente en dark mode:
  - La card tiene fondo `#14151C` (surface) y se distingue de `#0A0B0F` (background).
  - El borde es sutil, 1px, sin gradiente.
  - El hover sobre el título activa el efecto DecryptedText.
  - Con filtros activos, el ⓘ aparece a la izquierda del título.
- [ ] Comprobar en light mode:
  - La card tiene fondo blanco y se distingue del fondo lila claro.
  - El área de la gráfica tiene fondo blanco (`chart-graph-area`).
- [ ] Comprobar el badge "Actualizando..." (activar un filtro mientras la gráfica carga).
- [ ] `npx vitest run` — 100% de tests pasando.
- [ ] `npm run build` — sin errores.
- [ ] La landing no ha sido modificada.

## Cierre

- [ ] Validar contra todos los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [ ] Commit (solo tras confirmación del usuario):
  `refactor: replace aurora border with Halo hairline in ChartCard`
