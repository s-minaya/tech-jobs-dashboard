# 004 · Halo Filtros — Plan

## Enfoque

Tres archivos JSX y `index.css`. Los cambios son principalmente de tokens
CSS en las clases Tailwind — no hay lógica que tocar excepto el bug del
`key` spread en `FilterSheet`. El orden es: primero `FilterSection`
(más simple, sin lógica), luego `FilterDrawer`, luego `FilterSheet`
(más complejo por el drag).

## Implementación

### 1. `src/components/Filters/FilterSection.jsx`

- `FilterChip` inactivo: cambiar `bg-card` → `bg-surface`.
- `FilterSection` label: cambiar `text-muted-foreground/70` →
  `text-muted-foreground`.
- Verificar que `hover:bg-muted` en `FilterToggleRow` apunta a un token
  Halo correcto (grep en `index.css` para confirmar). Si `--muted` apunta
  a una superficie Halo válida, se mantiene; si no, ajustar al token correcto.
- No tocar los iconos ni la estructura del componente.

### 2. `src/components/Filters/FilterDrawer.jsx`

- `FilterFAB` badge: `bg-white text-primary` → `bg-primary text-primary-foreground`.
- `FilterFAB` anillo pulsante: `bg-white/40` → `bg-primary/40`.
- Panel: `bg-background` → `bg-elevated`.
- Verificar borde derecho del panel: `border-r border-border` — ya usa
  token correcto, solo confirmar.
- Verificar botón "Resetear" y botón X — ya usan tokens correctos.

### 3. `src/components/Filters/FilterSheet.jsx`

- Panel: `bg-background` → `bg-elevated`.
- Footer: `border-white/8` → `border-border`.
- **Corregir bug `key` spread:** refactorizar las llamadas a
  `<FilterSection {...byKey.X} ...>` para extraer `key` del spread.
  El patrón más limpio es alinearlo con `FilterDrawer`:
  ```jsx
  // En vez de byKey por sección, usar FILTERS.map igual que FilterDrawer:
  // Para el área de País (ancho completo):
  {(() => {
    const { key, ...rest } = byKey.pais;
    return <FilterSection key={key} {...rest} selected={...} onSelect={...} />;
  })()}
  // O extraer antes del return
  ```
  Alternativa más limpia: crear una función helper local
  `filterProps(key)` que devuelva `{ ...byKey[key] }` sin la prop `key`.
  El agente elige la que quede más legible — lo importante es que
  `key` no llegue en el spread y desaparezca el warning de React 19.
- Verificar que el `GlowButton` del footer no tiene `border-white/8`
  heredado del contenedor.

### 4. `src/index.css` — verificar tokens

- Confirmar que `bg-elevated` genera utilidad Tailwind (debe estar en
  `@theme inline` tras las fases 001–003; si no, añadirlo).
- Confirmar que `bg-surface` genera utilidad Tailwind (ya registrado en
  la fase 003).
- Si `--muted` no apunta a un token Halo de superficie, actualizarlo.

### 5. Tests — `FilterDrawer.test.jsx`

El test busca el badge por texto numérico (`"1"`, `"2"`) y los botones
por texto ("Resetear", "Ver resultados"). No hay selectores por clase CSS.
Verificar que pasa al 100% sin cambios.

## Decisiones

- **`bg-elevated` para los paneles** — un drawer/sheet es un nivel de
  superficie superpuesto; debe ser `elevated` (#1E2029 dark), no
  `background` (#0A0B0F dark). La diferencia de contraste es sutil pero
  comunica correctamente la jerarquía Z.
- **Mantener `GlowButton` en FAB y "Ver resultados"** — son acciones
  principales. El criterio de la constitución es claro: aurora en
  elementos interactivos/de foco.
- **Badge del FAB a tokens Halo** — `bg-white` es un valor hardcodeado
  que no respeta el dual theme; `bg-primary text-primary-foreground`
  funciona en dark y light mode.
- **No tocar la lógica de drag** — es código complejo y ya funciona
  correctamente. Esta feature solo toca la capa visual.

## Riesgos

- **`bg-elevated` no genera utilidad Tailwind** — si el token no está en
  `@theme inline`, Tailwind v4 no genera `bg-elevated`. Mitigación: grep
  en `index.css` antes de empezar; añadir si falta.
- **Bug `key` spread en `FilterSheet`** — hay varias formas de arreglarlo;
  la que elija el agente debe no romper el layout de grid ni el orden de
  las `FilterSection`. Verificar visualmente después.
- **Light mode del drawer/sheet** — `bg-elevated` en light mode debe ser
  blanco o superficie clara; verificar que el token `--color-elevated`
  tiene valor en el bloque `:root, .light` de `index.css`.
