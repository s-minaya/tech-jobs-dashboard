# 005 · Halo BottomNav — Tareas

## Implementación

- [x] En `src/components/layout/BottomNav.jsx`, localizar el `<div>`
  hijo directo de `<nav>` y cambiar:
  - `border-white/8` → `border-border`
  - `bg-background/95` → `bg-elevated/95`

## Verificación

- [x] Arrancar dev server en **dark mode** (viewport móvil <768px):
  - La barra tiene fondo `#1E2029` con 95% de opacidad — se distingue
    del contenido pero deja ver lo que hay detrás al hacer scroll. ✓
  - El borde superior es sutil (hairline, no blanco hardcodeado). ✓
  - El item activo muestra el efecto `aurora-icon` y `aurora-text`. ✓
  - El badge de filtros aparece al activar un filtro. ✓ (verificado por
    los 3 tests de badge en `BottomNav.test.jsx`; la captura visual con
    el `FilterSheet` abierto no sirve porque el sheet tapa la barra por
    completo mientras está abierto — comportamiento correcto de la app).
- [x] Verificar en **light mode**:
  - La barra tiene fondo claro elevado (no el fondo de página). ✓
  - El borde superior es visible con `--color-border`. ✓
- [x] `npx vitest run` — 305/305 tests pasando sin cambios en los tests
  (`BottomNav.test.jsx` no se tocó).
- [x] `npm run build` — sin errores.
- [x] La landing no ha sido modificada.

## Cierre

- [x] Validar contra todos los criterios de aceptación de `spec.md`.
- [x] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [ ] Commit (solo tras confirmación del usuario):
  `refactor: apply Halo surface tokens to BottomNav`
