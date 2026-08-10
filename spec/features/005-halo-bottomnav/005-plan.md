# 005 · Halo BottomNav — Plan

## Enfoque

Un único archivo JSX, dos líneas de cambio. No hay CSS nuevo ni lógica
que tocar. La fase es intencionalmente pequeña — el componente ya estaba
bien construido y las fases anteriores dejaron los tokens correctos.

## Implementación

### `src/components/layout/BottomNav.jsx`

Localizar el `<div>` que envuelve la barra (hijo directo de `<nav>`):

```jsx
// Antes:
<div className="border-t border-white/8 bg-background/95 backdrop-blur-md">

// Después:
<div className="border-t border-border bg-elevated/95 backdrop-blur-md">
```

Dos cambios en una sola clase:
1. `border-white/8` → `border-border`
2. `bg-background/95` → `bg-elevated/95`

## Decisiones

- **`bg-elevated/95` en lugar de `bg-surface/95`** — la barra de nav
  flota sobre el contenido del dashboard igual que el drawer y el sheet
  (fase 004). `elevated` es el nivel correcto para elementos superpuestos.
  `surface` sería el nivel de las cards, que están debajo.
- **Mantener `/95` de opacidad** — permite ver el contenido que queda
  detrás al hacer scroll, lo que comunica que la barra está "sobre" el
  dashboard. Eliminar la opacidad daría una barra totalmente opaca, menos
  elegante.
- **Mantener `backdrop-blur-md`** — el blur refuerza la sensación de
  elemento superpuesto. Es CSS puro, no WebGL — está dentro de los límites
  de la constitución.

## Riesgos

- Ninguno significativo. Son dos clases Tailwind con tokens ya verificados
  en fases anteriores.
