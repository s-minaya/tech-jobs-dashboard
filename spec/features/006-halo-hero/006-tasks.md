# 006 · Halo Hero — Tareas

## Implementación — `src/components/layout/MainContent.jsx`

- [ ] `h1`: cambiar `font-heading` → `font-sans`.

- [ ] Span "Tech Jobs": eliminar el ternario `isDark ? ... : ...` y dejar
  un único token:
  ```jsx
  // Antes:
  style={{ color: isDark ? "white" : "var(--color-background)" }}
  // Después:
  style={{ color: "var(--color-text-primary)" }}
  ```

- [ ] Span "Dashboard": eliminar el ternario y mover a clase Tailwind:
  ```jsx
  // Antes:
  <span className="block" style={{ color: isDark ? "var(--color-primary)" : "hsl(0, 0%, 30%)" }}>
  // Después:
  <span className="block text-primary">
  ```
  (eliminar el `style` por completo — ya no hace falta).

- [ ] Subtítulo "Mercado tech europeo": eliminar el ternario y mover a
  clase Tailwind:
  ```jsx
  // Antes:
  <p className="mb-3 text-xs font-medium tracking-[0.3em] uppercase"
     style={{ color: isDark ? "rgba(255,255,255,0.6)" : "var(--color-background)" }}>
  // Después:
  <p className="mb-3 text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">
  ```
  (eliminar el `style` por completo).

- [ ] Verificar que `isDark` sigue siendo necesario después de los cambios
  (lo usan `DarkVeil` y `Aurora` — no eliminarlo de las props).

- [ ] Actualizar el comentario del componente: quitar la referencia a
  "Space Mono" o "font-heading" si la hay; reflejar que el título usa
  Inter y tokens Halo.

## Verificación

- [ ] Arrancar dev server en **dark mode**:
  - "Tech Jobs" legible (casi blanco) sobre DarkVeil oscuro.
  - "Dashboard" en `--color-primary` (#5B6BFF).
  - Subtítulo en `--color-text-secondary` (muted, no completamente opaco).
  - El título usa Inter display (no monospace).
  - ThemeToggle visible en la esquina superior derecha.
- [ ] Cambiar a **light mode**:
  - "Tech Jobs" legible sobre Aurora claro — si el contraste no es
    suficiente con `--color-text-primary`, usar `white` o
    `--color-elevated` y documentar la decisión aquí.
  - "Dashboard" en `--color-primary` (#5B6BFF sobre Aurora claro).
  - Subtítulo legible.
  - Aurora visible como fondo.
- [ ] `npx vitest run` — 100% de tests pasando sin cambios en tests.
- [ ] `npm run build` — sin errores.
- [ ] La landing no ha sido modificada.

## Cierre

- [ ] Documentar en este archivo si se tuvo que ajustar algún color por
  contraste (especialmente en light mode).
- [ ] Validar contra todos los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [ ] Commit (solo tras confirmación del usuario):
  `refactor: replace hardcoded hero colors with Halo tokens`
