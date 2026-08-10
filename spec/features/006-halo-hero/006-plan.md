# 006 · Halo Hero — Plan

## Enfoque

Un único archivo JSX, cambios solo en clases y valores de `style` inline.
No hay lógica que tocar ni CSS nuevo. El orden es: tipografía primero,
colores después, verificación visual en ambos temas al final.

## Implementación

### `src/components/layout/MainContent.jsx`

**1. Tipografía del h1:**
```jsx
// Antes:
<h1 className="font-heading text-5xl leading-tight font-bold drop-shadow-lg md:text-6xl lg:text-7xl">

// Después:
<h1 className="font-sans text-5xl leading-tight font-bold drop-shadow-lg md:text-6xl lg:text-7xl">
```

**2. Color "Tech Jobs" (span sin className):**
```jsx
// Antes:
<span style={{ color: isDark ? "white" : "var(--color-background)" }}>

// Después:
<span style={{ color: "var(--color-text-primary)" }}>
```
El mismo token funciona en dark (#F2F4F8, casi blanco) y en light
(oscuro, legible sobre Aurora).

**3. Color "Dashboard" (span.block):**
```jsx
// Antes:
<span className="block" style={{ color: isDark ? "var(--color-primary)" : "hsl(0, 0%, 30%)" }}>

// Después:
<span className="block" style={{ color: "var(--color-primary)" }}>
```
Si el `style` queda como único atributo dinámico con un valor fijo,
se puede mover a una clase Tailwind `text-primary` y eliminar el `style`:
```jsx
<span className="block text-primary">
```

**4. Color subtítulo "Mercado tech europeo":**
```jsx
// Antes:
<p className="..." style={{ color: isDark ? "rgba(255,255,255,0.6)" : "var(--color-background)" }}>

// Después:
<p className="... text-muted-foreground">
```
Mover el color a una clase Tailwind (ya no hace falta el `style` inline).

**5. Actualizar el comentario del componente** para reflejar que el título
usa Inter (no Space Mono) y que los colores usan tokens Halo.

## Decisiones

- **`var(--color-text-primary)` para "Tech Jobs" en ambos modos** — en
  dark es #F2F4F8 (casi blanco, legible sobre DarkVeil oscuro) y en light
  es el valor oscuro del token (legible sobre Aurora claro). Un solo token,
  dos valores correctos.
- **`var(--color-primary)` para "Dashboard" en ambos modos** — elimina la
  lógica `isDark ? ... : ...` del JSX. El primary es #5B6BFF en ambos
  modos por decisión del design system Halo.
- **`text-muted-foreground` para el subtítulo** — mover de `style` inline
  a clase Tailwind cuando el valor ya no depende de `isDark`. Más limpio.
- **`font-sans` en lugar de `font-heading`** — `font-heading` apuntaba a
  Space Mono (desinstalado en fase 001). `font-sans` apunta a Inter, que
  es la fuente de display en Halo.
- **No eliminar la prop `isDark`** — todavía la necesitan `DarkVeil` y
  `Aurora` para decidir qué fondo renderizar. Solo se eliminan los usos
  de `isDark` en los `style` inline del texto.

## Riesgos

- **Legibilidad del título en light mode** — `--color-text-primary` en
  light puede ser muy oscuro sobre el fondo Aurora (que es morado claro).
  Mitigación: verificar visualmente en light mode antes de dar por buena
  la tarea. Si el contraste no es suficiente, usar `var(--color-elevated)`
  o `white` con justificación en el tasks.md.
- **`drop-shadow-lg` con Inter** — el drop shadow puede verse diferente
  con la nueva fuente. Mitigación: verificar visualmente y ajustar si
  queda raro (puede eliminarse si no aporta con Inter).
