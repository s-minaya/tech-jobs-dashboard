# 004 · Halo Filtros

**Estado:** en curso

## Qué hace

Rediseña la capa visual del sistema de filtros — `FilterDrawer.jsx`,
`FilterSheet.jsx` y `FilterSection.jsx` — siguiendo los tokens Halo.
El comportamiento de apertura/cierre, el drag del sheet, el bloqueo de
scroll y toda la lógica de filtros se mantienen intactos.

Lo que **cambia**:

### FilterDrawer (desktop)
- El panel pasa de `bg-background` a `bg-elevated` — el drawer es un
  nivel de superficie por encima del dashboard (igual que un modal).
- El borde derecho y el borde de la cabecera/footer usan `--color-border`.
- El FAB mantiene `GlowButton` con su efecto aurora — es una acción, no
  contenido pasivo.
- El badge de filtros activos en el FAB: `bg-white text-primary` →
  `bg-primary text-primary-foreground` (tokens Halo).
- El anillo pulsante del badge: `bg-white/40` → `bg-primary/40`.
- El badge inline en la cabecera del drawer ya usa `bg-primary
  text-primary-foreground` — se mantiene.
- El botón "Resetear" se adapta: `text-muted-foreground hover:text-foreground`
  → mismos tokens Halo (ya correctos, solo verificar).
- El botón X de cierre: `bg-muted text-muted-foreground` → mismos tokens
  Halo (ya correctos, solo verificar).
- "Ver resultados": `GlowButton` se mantiene — es una acción principal.
- El overlay: `bg-black/40 backdrop-blur-sm` — se mantiene (no es un
  componente Halo, es un comportamiento).

### FilterSheet (móvil)
- El panel pasa de `bg-background` a `bg-elevated` — mismo criterio que
  el drawer.
- El handle y la cabecera: sin cambios estructurales.
- El separador `div.mx-4.h-px.bg-border` → `--color-border` (ya correcto).
- El footer "Ver resultados": borde `border-white/8` → `--color-border`.
  `GlowButton` se mantiene.
- **Bug pendiente de la fase 001:** `FilterSection` se llama via spread
  de `byKey.pais` etc., lo que incluye la prop `key` en el objeto. Corregir
  en esta fase extrayendo `key` antes del spread:
  ```jsx
  // Antes (genera warning React 19):
  <FilterSection {...byKey.pais} selected={...} onSelect={...} />
  // Después:
  const { key: _k, ...paiProps } = byKey.pais;
  <FilterSection key="pais" {...paisProps} selected={...} onSelect={...} />
  ```
  O más limpio: usar el mismo patrón que `FilterDrawer` con
  `FILTERS.map(({ key, ...rest }) => ...)`.

### FilterSection
- Chips activos: `border-primary bg-primary text-primary-foreground` →
  se mantiene (ya usa tokens Halo correctos).
- Chips inactivos: `border-border bg-card text-muted-foreground` →
  `border-border bg-surface text-muted-foreground` (`bg-card` → `bg-surface`).
- Toggle rows activos: `bg-primary/10 text-primary` → se mantiene.
- Toggle rows inactivos: `hover:bg-muted` → `hover:bg-surface-raised`
  (si el token existe) o mantener `hover:bg-muted` si apunta a un token
  Halo correcto — verificar en `index.css`.
- El label de sección: `text-muted-foreground/70 uppercase` →
  `text-muted-foreground uppercase` (quitar la opacidad `/70` — los tokens
  Halo ya tienen el contraste correcto en `--color-text-muted`).

Lo que **no cambia**:
- Toda la lógica de drag del `FilterSheet` (touch, mouse, thresholds).
- El bloqueo de scroll con `passive:false`.
- `GlowButton` en FAB y en "Ver resultados" de ambos paneles.
- Los iconos de `FilterSection` (banderas, `react-icons/ri`).
- La estructura de layout del `FilterSheet` (grid 2 columnas, scroll interno).
- La lógica de `activeFilterCount` (ya movida a `filterUtils.js` en 001).
- Los tests — no cambia nada de la lógica que testean.

## Por qué

El drawer y el sheet actualmente usan `bg-background` (el fondo de página),
lo que los hace visualmente indistinguibles del dashboard cuando están
abiertos. Un panel superpuesto debe estar en un nivel de superficie más alto
(`--color-elevated`) para comunicar que está "por encima" del contenido.

## Criterios de aceptación

- [ ] `FilterDrawer` y `FilterSheet` usan `bg-elevated` como fondo del panel.
- [ ] El badge del FAB usa `bg-primary text-primary-foreground` y el anillo
      pulsante usa `bg-primary/40`.
- [ ] Los chips inactivos de `FilterSection` usan `bg-surface` en lugar de
      `bg-card`.
- [ ] El label de sección en `FilterSection` no usa opacidad `/70`.
- [ ] El footer del `FilterSheet` usa `border-border` en lugar de
      `border-white/8`.
- [ ] El bug del spread de `key` en `FilterSheet` está corregido (sin
      warnings de React 19 en consola).
- [ ] `GlowButton` se mantiene en FAB y "Ver resultados" de ambos paneles.
- [ ] El drag del `FilterSheet` sigue funcionando (arrastrar >30% cierra,
      <30% vuelve a posición).
- [ ] El bloqueo de scroll funciona en iOS Safari (no se puede verificar en
      desktop, documentar).
- [ ] Funciona en dark y light mode.
- [ ] `npx vitest run` pasa al 100%.
- [ ] `npm run build` sin errores.
- [ ] La landing no ha sido modificada.

## Fuera de alcance

- Rediseño estructural del layout del `FilterSheet` (columnas, orden de secciones).
- Cambios en `GlowButton` — se mantiene tal cual.
- Añadir animaciones nuevas al drawer.
- Cambios en `FILTERS` config o en `useFilters`.
