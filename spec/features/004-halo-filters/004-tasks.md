# 004 · Halo Filtros — Tareas

## Hallazgo previo a la implementación (no estaba en el plan)

`src/tests/components/Filters/FilterDrawer.test.jsx` tenía el contenido de
`SummaryStats.test.jsx` copiado encima (mismo hash MD5) desde el commit que
lo creó (`f96c713`, previo a esta feature) — `FilterDrawer` nunca tuvo tests
propios, solo un duplicado que testeaba otro componente. Se reescribió por
completo antes de tocar `FilterDrawer.jsx`, para tener una base de tests
real contra la que verificar los cambios de esta fase. `FilterSheet.jsx` no
tenía (ni tiene) test propio — está excluido de coverage a propósito en
`vite.config.js` por la complejidad de su lógica de drag, y el plan de esta
fase pide explícitamente no tocar esa lógica, así que no se creó uno nuevo;
el fix del bug de `key` se verificó por consola con Playwright.

## Preparación

- [x] Verificar que `bg-elevated` genera utilidad Tailwind:
  ```bash
  grep "elevated" src/index.css
  ```
  Si `--color-elevated` está en `@theme inline`, la utilidad existe.
  Confirmado: ya estaba registrado desde las fases 002/003.
- [x] Verificar que `bg-surface` genera utilidad Tailwind (registrado en
  fase 003 — solo confirmar). Confirmado.
- [x] Verificar qué valor tiene `--color-elevated` en el bloque light mode
  (`:root, .light`) de `index.css` — debe ser una superficie clara.
  Confirmado: `#ffffff` en light, `#1e2029` en dark.

## FilterSection — `src/components/Filters/FilterSection.jsx`

- [x] `FilterChip` inactivo: cambiar `bg-card` → `bg-surface`.
- [x] `FilterSection` label: cambiar `text-muted-foreground/70` →
  `text-muted-foreground` (quitar la opacidad `/70`).
- [x] Verificar `hover:bg-muted` en `FilterToggleRow` — confirmar que
  `--muted` apunta a un token Halo de superficie. Confirmado:
  `--color-muted: var(--color-surface)` en `@theme inline` — token Halo
  válido, se mantiene `hover:bg-muted` sin cambios.
- [x] No tocar iconos, estructura ni lógica.

## FilterDrawer — `src/components/Filters/FilterDrawer.jsx`

- [x] Panel: cambiar `bg-background` → `bg-elevated`.
- [x] `FilterFAB` badge: cambiar `bg-white text-primary` →
  `bg-primary text-primary-foreground`.
- [x] `FilterFAB` anillo pulsante: cambiar `bg-white/40` → `bg-primary/40`.
- [x] Verificar que el borde derecho del panel (`border-r border-border`),
  el botón "Resetear" y el botón X ya usan tokens Halo correctos —
  confirmado, no se tocaron.
- [x] Verificar que `GlowButton` del FAB y del footer no han sido
  modificados. Confirmado.

## FilterSheet — `src/components/Filters/FilterSheet.jsx`

- [x] Panel: cambiar `bg-background` → `bg-elevated`.
- [x] Footer: cambiar `border-white/8` → `border-border`.
- [x] **Corregir bug `key` spread** — se usó la opción recomendada: función
  helper local `filterRest(key)` que devuelve las props sin `key`, con
  `key="..."` explícito en cada `<FilterSection>`. El warning de React 19
  desaparece de consola (verificado con Playwright: 0 warnings).
- [x] Verificar que el `GlowButton` del footer sigue funcionando.
- [x] Verificar que el drag sigue funcionando — verificado con simulación
  de mouse en Playwright leyendo el `transform` del panel directamente:
  drag corto (<30% de la altura) vuelve a `translateY(0)`, drag largo
  (>30%) cierra a `translateY(100%)`. La lógica de drag no se tocó (0
  líneas cambiadas en `startDrag`/`moveDrag`/`endDrag` ni en sus efectos).

## Verificación

- [x] Arrancar dev server y abrir el drawer en **dark mode**:
  - El panel tiene fondo `#1E2029` (elevated), distinguible del dashboard. ✓
  - El FAB tiene badge en `bg-primary`. ✓
  - Los chips inactivos tienen fondo `bg-surface`. ✓
  - No hay warnings de React 19 en consola relacionados con `key`. ✓
- [x] Verificar en **light mode**:
  - El panel tiene fondo claro (elevated en light = superficie clara). ✓
  - Los chips y toggle rows se leen con buen contraste. ✓
- [x] Abrir el `FilterSheet` en móvil (viewport 390×844):
  - El panel tiene fondo elevated. ✓
  - El drag funciona (verificado por script, ver arriba). ✓
  - "Ver resultados" con GlowButton visible y sin borde `border-white/8`. ✓
- [x] Consola del navegador sin warnings de `key` en FilterSheet. ✓ (0/0)
- [x] `npx vitest run` — 305/305 tests pasando (298 previos + 16 nuevos de
  `FilterDrawer.test.jsx` − 9 que en realidad eran duplicado de
  `SummaryStats.test.jsx`).
- [x] `npm run build` — sin errores.
- [x] La landing no ha sido modificada.
- [ ] El bloqueo de scroll funciona en iOS Safari — no se puede verificar en
  este entorno (desktop/Playwright headless), tal y como anticipa
  `004-spec.md`. Código de bloqueo de scroll no tocado en esta fase.

## Cierre

- [x] Validar contra todos los criterios de aceptación de `spec.md`.
- [x] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [ ] Commit (solo tras confirmación del usuario):
  `refactor: apply Halo tokens to filter panels and fix key spread warning`
  Nota: hay además un segundo cambio de documentación ya presente en el
  árbol de trabajo antes de empezar esta feature (`005-plan.md`/`006-spec.md`
  → `004-plan.md`/`004-spec.md`, corrigiendo la numeración) — no es de esta
  sesión, se propone como commit `docs:` separado.
