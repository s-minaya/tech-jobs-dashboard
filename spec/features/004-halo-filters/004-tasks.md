# 004 · Halo Filtros — Tareas

## Preparación

- [ ] Verificar que `bg-elevated` genera utilidad Tailwind:
  ```bash
  grep "elevated" src/index.css
  ```
  Si `--color-elevated` está en `@theme inline`, la utilidad existe.
  Si no, añadirlo antes de continuar.
- [ ] Verificar que `bg-surface` genera utilidad Tailwind (registrado en
  fase 003 — solo confirmar).
- [ ] Verificar qué valor tiene `--color-elevated` en el bloque light mode
  (`:root, .light`) de `index.css` — debe ser una superficie clara.

## FilterSection — `src/components/Filters/FilterSection.jsx`

- [ ] `FilterChip` inactivo: cambiar `bg-card` → `bg-surface`.
- [ ] `FilterSection` label: cambiar `text-muted-foreground/70` →
  `text-muted-foreground` (quitar la opacidad `/70`).
- [ ] Verificar `hover:bg-muted` en `FilterToggleRow` — confirmar que
  `--muted` apunta a un token Halo de superficie. Si no, ajustar al token
  correcto (p.ej. `hover:bg-surface`).
- [ ] No tocar iconos, estructura ni lógica.

## FilterDrawer — `src/components/Filters/FilterDrawer.jsx`

- [ ] Panel: cambiar `bg-background` → `bg-elevated`.
- [ ] `FilterFAB` badge: cambiar `bg-white text-primary` →
  `bg-primary text-primary-foreground`.
- [ ] `FilterFAB` anillo pulsante: cambiar `bg-white/40` → `bg-primary/40`.
- [ ] Verificar que el borde derecho del panel (`border-r border-border`),
  el botón "Resetear" y el botón X ya usan tokens Halo correctos — si
  es así, no tocar.
- [ ] Verificar que `GlowButton` del FAB y del footer no han sido
  modificados.

## FilterSheet — `src/components/Filters/FilterSheet.jsx`

- [ ] Panel: cambiar `bg-background` → `bg-elevated`.
- [ ] Footer: cambiar `border-white/8` → `border-border`.
- [ ] **Corregir bug `key` spread** — eliminar el warning de React 19:
  Extraer `key` del spread en cada `<FilterSection {...byKey.X} ...>`.
  Opción recomendada — función helper local antes del return:
  ```jsx
  // Helper local para extraer key del objeto de filtro
  function filterRest(key) {
    const { key: _k, ...rest } = byKey[key];
    return rest;
  }
  // Uso:
  <FilterSection key="pais" {...filterRest("pais")} selected={...} onSelect={...} />
  ```
  El agente puede elegir otra forma siempre que:
  1. `key` no llegue en el objeto spread.
  2. El layout y el orden de secciones no cambien.
  3. El warning desaparezca de la consola.
- [ ] Verificar que el `GlowButton` del footer sigue funcionando.
- [ ] Verificar que el drag sigue funcionando (arrastrar el handle hacia
  abajo en desktop con mouse).

## Verificación

- [ ] Arrancar dev server y abrir el drawer en **dark mode**:
  - El panel tiene fondo `#1E2029` (elevated), distinguible del dashboard.
  - El FAB tiene badge en `bg-primary`.
  - Los chips inactivos tienen fondo `bg-surface`.
  - No hay warnings de React 19 en consola relacionados con `key`.
- [ ] Verificar en **light mode**:
  - El panel tiene fondo claro (elevated en light = superficie clara).
  - Los chips y toggle rows se leen con buen contraste.
- [ ] Abrir el `FilterSheet` en móvil (o reducir viewport a <768px):
  - El panel tiene fondo elevated.
  - El drag funciona (arrastrar el handle hacia abajo).
  - "Ver resultados" con GlowButton visible y sin borde `border-white/8`.
- [ ] Consola del navegador sin warnings de `key` en FilterSheet.
- [ ] `npx vitest run` — 100% de tests pasando.
- [ ] `npm run build` — sin errores.
- [ ] La landing no ha sido modificada.

## Cierre

- [ ] Validar contra todos los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [ ] Commit (solo tras confirmación del usuario):
  `refactor: apply Halo tokens to filter panels and fix key spread warning`
