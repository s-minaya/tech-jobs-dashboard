# 002 · Halo ChartCard — Plan

## Enfoque

Dos archivos afectados: `src/index.css` (clases CSS de la card) y
`src/components/ui/ChartCard.jsx` (clases Tailwind en el JSX). El CSS
es el cambio principal — el JSX solo cambia las clases del badge y del
contenedor de la card. La lógica no se toca.

## Implementación

### 1. `src/index.css` — reemplazar `.chart-card-border` y `.chart-card-inner`

Eliminar la técnica del padding-como-borde (wrapper 3px + inner que tapa)
y reemplazar por una sola clase `.chart-card` con borde real:

```css
/* Antes (técnica wrapper+inner): */
.chart-card-border {
  padding: 3px;
  background: linear-gradient(135deg, #7cff67, ...);
  animation: auroraFlow 4s ease infinite;
}
.chart-card-inner { background: var(--color-background); }

/* Después (Halo): */
.chart-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}
```

Renombrar la clase en el JSX: `chart-card-border` + `chart-card-inner` → `chart-card`.
Eliminar `:root:not(.dark) .chart-card-inner` (ya no hay distinción).
Mantener `.chart-graph-area` y su variante light mode sin cambios.

### 2. `src/components/ui/ChartCard.jsx` — actualizar JSX

- Reemplazar `<div className="chart-card-border relative">` +
  `<div className="chart-card-inner p-5">` por
  `<div className="chart-card relative p-5">`.
- Badge "Actualizando...": reemplazar las clases actuales por tokens Halo.
- Error: verificar que `text-destructive` ya apunta a `--color-danger` (sí,
  lo hace tras la fase 001 — no hay que cambiar nada).
- "Cargando...": verificar que `text-muted-foreground` apunta a
  `--color-text-muted` (sí — no hay que cambiar nada).

### 3. `src/tests/components/ui/ChartCard.test.jsx` — revisar selectores

El test busca elementos por texto ("Cargando...", "Actualizando...",
"Error:"), no por clases CSS — no debería necesitar cambios. Verificar
que todos los tests siguen pasando tras el cambio de clases.

## Decisiones

- **Una sola clase `.chart-card` en vez de dos** — la técnica wrapper+inner
  era un workaround para simular un borde con gradiente. Con un borde real
  1px solo hace falta un elemento. Más simple, más mantenible.
- **Renombrar `chart-card-border`→`chart-card`** en vez de reutilizar el
  nombre — el nombre antiguo describe la técnica (el "borde"), el nuevo
  describe el componente. Más claro para el agente en fases futuras.
- **Mantener `chart-graph-area`** sin cambios — es una decisión de
  legibilidad independiente del rediseño de la card.
- **No añadir hover state** — Halo no define hover en cards de contenido
  (solo en cards interactivas/clickables). Las chart cards no son clickables.
- **`text-destructive` no se cambia** — ya apunta a `--color-danger` tras
  la fase 001. No hay trabajo pendiente.

## Riesgos

- **La animación `auroraFlow` en `index.css`** — se elimina de
  `.chart-card-border` pero el keyframe `@keyframes auroraFlow` debe
  mantenerse porque lo sigue usando `GlowButton`. Verificar que solo se
  elimina la referencia en `.chart-card-border`, no el keyframe.
- **Tests que busquen la clase `chart-card-border`** — improbable (los
  tests de ChartCard buscan por texto, no por clase), pero verificar.
- **Otras partes del código que usen `chart-card-border` o `chart-card-inner`**
  — hacer grep antes de renombrar: `grep -r "chart-card" src/ --include="*.jsx"`.
