# 005 · Halo BottomNav

**Estado:** en curso

## Qué hace

Actualiza los dos únicos valores no-Halo que quedan en `BottomNav.jsx`:
el fondo de la barra y el borde superior. El comportamiento, la lógica
de navegación, el badge de filtros, los efectos aurora del item activo
y los tests no se tocan.

Lo que **cambia**:

- Fondo de la barra: `bg-background/95 backdrop-blur-md` →
  `bg-elevated/95 backdrop-blur-md` — la barra de navegación es un
  elemento superpuesto sobre el contenido, igual que el drawer (fase 004).
  Usar `bg-elevated` en lugar de `bg-background` le da la misma jerarquía
  visual que el resto de paneles Halo.
- Borde superior: `border-white/8` → `border-border` — `border-white/8`
  es un valor hardcodeado que no respeta el dual theme; `--color-border`
  funciona en dark y light mode.

Lo que **no cambia**:

- La lógica de navegación (`handleClick`, `scrollIntoView`).
- El efecto `aurora-icon` y `aurora-text` en el item activo — son los
  efectos visuales propios del proyecto que se conservan.
- El badge de filtros activos (`bg-primary`, `text-primary-foreground`).
- Los iconos (`react-icons/ri`).
- `outline-none active:scale-90` en los botones.
- El `pb-safe` para el área segura de iPhone.
- Los tests de `BottomNav.test.jsx`.

## Por qué

Es la misma lógica que la fase 004: los elementos superpuestos sobre el
dashboard usan `bg-elevated`, no `bg-background`. Y `border-white/8`
es el único valor hardcodeado que queda en el componente.

## Criterios de aceptación

- [ ] El fondo de la barra usa `bg-elevated/95` en lugar de `bg-background/95`.
- [ ] El borde superior usa `border-border` en lugar de `border-white/8`.
- [ ] Los efectos `aurora-icon` y `aurora-text` en el item activo siguen funcionando.
- [ ] El badge de filtros sigue apareciendo cuando hay filtros activos.
- [ ] Funciona en dark y light mode.
- [ ] `npx vitest run` pasa al 100% sin tocar los tests.
- [ ] `npm run build` sin errores.
- [ ] La landing no ha sido modificada.

## Fuera de alcance

- Cambios en la lógica de navegación o en el IntersectionObserver de `App.jsx`.
- Rediseño estructural de la barra (iconos, layout, número de items).
- Añadir animaciones nuevas.
