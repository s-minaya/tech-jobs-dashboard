# 006 · Halo Hero

**Estado:** en curso

## Qué hace

Actualiza la sección hero del dashboard (`MainContent.jsx`) para que los
colores del título y el subtítulo usen tokens Halo en lugar de valores
hardcodeados, y la tipografía del título pase de `font-heading` (Space
Mono, ya desinstalado en la fase 001) a `font-body` (Inter) con los
pesos correctos de Halo.

Lo que **cambia**:

- **Tipografía del h1:** `font-heading` → `font-sans` (Inter). Space Mono
  fue desinstalado en la fase 001 — `font-heading` puede seguir
  funcionando si Tailwind tiene un fallback, pero debe actualizarse al
  token correcto. Inter a tamaño display (`text-5xl/6xl/7xl`) con
  `font-bold` es el patrón de headline Halo.

- **Color "Tech Jobs":**
  - dark: `color: 'white'` → `var(--color-text-primary)` — el token
    correcto para texto principal en dark es `--color-text-primary`
    (#F2F4F8), no `white` hardcodeado.
  - light: `color: 'var(--color-background)'` — ya usa un token Halo,
    pero es semánticamente incorrecto (el background en light es el fondo
    de página, no un color de texto). Cambiar a `var(--color-text-primary)`
    también en light — en light mode `--color-text-primary` es oscuro y
    se leerá bien sobre el fondo Aurora.

- **Color "Dashboard":**
  - dark: `var(--color-primary)` → se mantiene — ya es el token correcto.
  - light: `hsl(0, 0%, 30%)` → `var(--color-primary)` — mismo token en
    ambos temas para consistencia. El primary en light mode (#5B6BFF)
    se leerá bien sobre el fondo Aurora claro.

- **Color del subtítulo "Mercado tech europeo":**
  - dark: `rgba(255,255,255,0.6)` → `var(--color-text-secondary)` — el
    token semántico correcto para texto secundario/muted sobre fondos
    oscuros.
  - light: `var(--color-background)` → `var(--color-text-secondary)` —
    mismo token en ambos temas.

Lo que **no cambia**:

- `DarkVeil` y `Aurora` como fondos del hero — se mantienen.
- `ThemeToggle` — se mantiene en `absolute top-6 right-6`.
- La estructura del hero (overflow-hidden, z-index, padding).
- Las KPI cards (`SummaryStats`) y su overlap con el hero (`-mt-32`).
- El grid de gráficas y las secciones.
- La lógica de `isDark` y `toggleTheme` — no se toca.
- Los ids de sección (`id="inicio"`, `id="tendencias"`, etc.).

## Por qué

Los valores de color hardcodeados (`white`, `rgba(255,255,255,0.6)`,
`hsl(0, 0%, 30%)`) no respetan el dual theme y se comportan diferente
en cada modo. Usando tokens Halo el resultado es predecible y mantenible.
La tipografía de `font-heading` debe actualizarse porque Space Mono fue
desinstalado en la fase 001 y el token correcto ahora es Inter.

## Criterios de aceptación

- [ ] El título "Tech Jobs" usa `var(--color-text-primary)` en dark y light.
- [ ] El título "Dashboard" usa `var(--color-primary)` en dark y light.
- [ ] El subtítulo usa `var(--color-text-secondary)` en dark y light.
- [ ] El `h1` usa `font-sans` (Inter) en lugar de `font-heading`.
- [ ] `DarkVeil` sigue apareciendo en dark mode como fondo del hero.
- [ ] `Aurora` sigue apareciendo en light mode como fondo del hero.
- [ ] `ThemeToggle` sigue visible en la esquina superior derecha.
- [ ] Las KPI cards siguen solapando el hero con `-mt-32`.
- [ ] El título es legible en dark y light mode sobre sus respectivos fondos.
- [ ] `npx vitest run` pasa al 100% sin cambios en tests.
- [ ] `npm run build` sin errores.
- [ ] La landing no ha sido modificada.

## Fuera de alcance

- Cambios en `DarkVeil.jsx` o `Aurora.jsx`.
- Cambios en `ThemeToggle.jsx`.
- Cambios en el grid de gráficas o en las secciones.
- Añadir nuevas secciones o elementos al hero.
- Cambios en `SummaryStats`.
