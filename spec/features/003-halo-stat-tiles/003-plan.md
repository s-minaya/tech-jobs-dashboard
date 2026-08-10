# 003 · Halo Stat Tiles — Plan

## Enfoque

Dos archivos afectados: `src/index.css` (clases del KPI) y
`src/components/layout/SummaryStats.jsx` (JSX del componente). Las
clases CSS se simplifican drásticamente — de la técnica wrapper/inner con
efectos hover a una sola clase estática. En el JSX se refactoriza
`KpiCard` para recibir un `accentColor` prop y eliminar el icono.

## Implementación

### 1. `src/index.css` — reemplazar `.glow-kpi-wrapper` + `.glow-kpi-inner`

Eliminar el bloque completo (wrapper transparente + hover aurora + inner
oscuro) y reemplazar por una única clase `.stat-tile`:

```css
/* ── Stat tile — KPI card con accent bar superior ────────────────────────
   Mismo nivel de superficie que ChartCard (--color-surface / --color-border).
   La accent bar de 2px se pasa como custom property inline desde el JSX:
     style={{ '--accent-color': 'var(--color-primary)' }}
   Esto evita crear una clase por cada color signal. */
.stat-tile {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  border-top: 2px solid var(--accent-color, var(--color-border-strong));
  padding: var(--space-4) var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
```

Nota técnica: `border-top` sobreescribe el lado superior del `border`
shorthand — es el patrón correcto para combinar un borde general hairline
con un accent top de color diferente. El `border-radius` sigue aplicando
a las cuatro esquinas independientemente.

### 2. `src/components/layout/SummaryStats.jsx` — refactorizar `KpiCard`

- Añadir prop `accentColor` que se pasa como `style={{ '--accent-color': accentColor }}`.
- Eliminar prop `icon` e import de `RiCalendarLine`.
- Reemplazar clases: `glow-kpi-wrapper group` → `stat-tile`; `glow-kpi-inner h-full w-full rounded-xl px-4 py-3` → desaparece (el padding va en `.stat-tile`).
- Actualizar clases de texto:
  - Label: `text-xs font-medium text-muted-foreground` → `text-xs font-medium uppercase tracking-wider text-muted-foreground`
  - Value: `text-2xl font-semibold tracking-tight text-foreground` → `font-mono text-2xl font-semibold text-foreground`
  - Description: `text-xs text-muted-foreground/70` → `text-xs text-muted-foreground`
- Pasar `accentColor` en cada `KpiCard`:
  - Ofertas activas → `var(--color-primary)`
  - Países → `var(--color-info)`
  - Skills → `var(--color-warning)`
  - Con salario → `var(--color-success)`
  - Última actualización → `var(--color-border-strong)` (neutro)
- Skeleton: `h-20 animate-pulse rounded-xl border border-border bg-muted/30 shadow-lg backdrop-blur-md` → `h-[88px] animate-pulse rounded-xl border border-border bg-surface/50`

### 3. `src/tests/components/layout/SummaryStats.test.jsx` — verificar

El test busca los labels y valores por texto — no debería necesitar cambios.
Verificar que pasa al 100%.

## Decisiones

> **Actualización tras revisión con el usuario:** el plan original usaba
> `border-top` sólido + `--accent-color` inline (un signal color distinto
> por KPI). El usuario pidió sustituir esos colores por el degradado
> aurora animado de `GlowButton`, más grueso, recortado a las esquinas
> redondeadas — ver criterios actualizados en `003-spec.md`. Los puntos de
> abajo marcados con ~~tachado~~ quedaron obsoletos; el resto sigue vigente.

- ~~**Custom property `--accent-color` inline** en vez de clases por color
  (`stat-tile-primary`, `stat-tile-info`...) — menos CSS, más flexible.
  El `var()` con fallback garantiza que si se olvida pasar `accentColor`,
  la card muestra el borde neutro sin romperse.~~ Sustituido: las 5 cards
  comparten la misma franja aurora, no hace falta un color por instancia.
- **Eliminar el icono** — en Halo los stat tiles son texto puro. El icono
  de calendario añadía complejidad de layout sin valor informativo real
  (la label "Última actualización" ya lo dice todo).
- ~~**`border-top` sobre el `border` shorthand** — técnica CSS estándar para
  accent bars. No requiere pseudo-elementos ni wrappers extra.~~ Sustituido:
  un color sólido sí se puede poner en `border-top`, pero un degradado
  animado no (`border-image` no respeta `border-radius`, así que las
  esquinas quedarían cuadradas). Técnica final: `::before` absoluto +
  `overflow: hidden` en `.stat-tile`, que recorta el pseudo-elemento a las
  esquinas redondeadas de la card.
- **Misma superficie que ChartCard** — coherencia visual: todas las cards
  del dashboard usan `--color-surface` + `--color-border`.

## Riesgos

- **`glow-kpi-wrapper` / `glow-kpi-inner` usadas en otros sitios** —
  hacer grep antes de eliminar:
  `grep -r "glow-kpi" src/ --include="*.jsx" --include="*.css"`
  Resultado esperado: solo `SummaryStats.jsx` e `index.css`.
- **`RiCalendarLine` import** — eliminarlo puede dejar un import sin usar
  si hay otro icono de `react-icons/ri` en el mismo import. Verificar que
  el import queda limpio o se elimina por completo.
- **`border-top` en Tailwind** — si se usa `border-t-2` de Tailwind en
  vez de la clase custom, puede haber conflicto con el `border` shorthand.
  Por eso la accent bar va en la clase CSS `.stat-tile`, no en Tailwind.
