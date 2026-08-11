# 007 · Halo Charts Internals

**Estado:** en curso

## Qué hace

Elimina los valores de color hardcodeados que quedan dentro de los cinco
componentes de gráficas y los reemplaza por tokens Halo. También deduplica
el patrón de detección de tema que estaba repetido en tres archivos
(diferido de la auditoría 001).

**Archivos afectados:**
`TopSkillsChart.jsx`, `DemandByRoleChart.jsx`, `SalaryChart.jsx`,
`EuropeMap.jsx`, `HeatmapSvg.jsx`, `HeatmapLegend.jsx`,
`src/hooks/useIsDark.js` (nuevo), `src/tests/hooks/useIsDark.test.js` (nuevo).

Lo que **cambia**:

### useIsDark — nuevo hook compartido

`TopSkillsChart` ya tiene `useIsDark` con `MutationObserver`. Moverlo a
`src/hooks/useIsDark.js` y que `DemandByRoleChart` y `SalaryChart` lo
importen en lugar de hacer `document.documentElement.classList.contains("dark")`
en cada render (lectura directa del DOM sin reactividad).

### tickColor — los tres archivos que lo usan

```js
// Antes (DemandByRoleChart, SalaryChart — lectura directa, no reactiva):
const isDark = document.documentElement.classList.contains("dark");
const tickColor = isDark ? "#ffffff" : undefined;

// Antes (TopSkillsChart — ya reactivo pero color hardcodeado):
const tickColor = isDark ? "#ffffff" : "#374151";

// Después (los tres):
const isDark = useIsDark();
const tickColor = isDark ? "var(--color-text-primary)" : "var(--color-text-secondary)";
```

Nota técnica: Recharts renderiza los ticks como `<text>` SVG y no puede
leer variables CSS directamente. La variable CSS debe resolverse a un valor
concreto en el momento del render. La forma correcta es usar
`getComputedStyle` para resolver el token:
```js
const tickColor = getComputedStyle(document.documentElement)
  .getPropertyValue(isDark ? "--color-text-primary" : "--color-text-secondary")
  .trim();
```
O, más simple: usar los valores hex directos de los tokens ya conocidos
(`#F2F4F8` dark / `#64748B` light) — son los mismos que definen los tokens
Halo. Elige la técnica que el agente considere más mantenible.

### var(--chart-1) en TopSkillsChart

`var(--chart-1)` es un token de shadcn/ui, no Halo. En `index.css` debe
apuntar a `--color-primary` ya (verificar). Si no, reemplazar por
`var(--color-primary)` directamente.

### EuropeMap — stroke valores hardcodeados

- `stroke` de país seleccionado: `"#ffffff"` → `"var(--color-text-primary)"`.
- `stroke` de países normales: `"var(--border)"` → `"var(--color-border)"`.

### Tooltips de DemandByRoleChart y SalaryChart

```jsx
// bg-background ✓ (ya token Halo)
// border-border/50 → border-border (quitar la opacidad /50 — Halo usa hairlines sin transparencia)
// bg-background → bg-elevated (el tooltip flota sobre el contenido, mismo nivel que drawers)
```

### HeatmapSvg y HeatmapLegend — celdas sin datos

```js
// Antes:
isDark ? "hsl(237, 22%, 22%)" : "#f1f5f9"
isDark ? "1px solid hsl(237, 22%, 30%)" : "1px solid #e2e8f0"

// Después:
// Color de celda vacía:  "var(--color-surface)"
// Borde de celda vacía:  "1px solid var(--color-border)"
```

`--color-surface` en dark es `#14151C` (distinto del negro del fondo,
suficiente contraste con RdYlGn). En light es `#ffffff`. El borde usa
`--color-border` directamente.

### HeatmapLegend — nota final

```jsx
// Antes:
className="... text-muted-foreground/70"
// Después:
className="... text-muted-foreground"
```

Lo que **no cambia**:

- `d3.interpolateRdYlGn` — la escala de color del heatmap y del mapa
  son señal visual de datos, no decoración. Se mantienen.
- `getRoleColor()` — colores semánticos propios del proyecto por rol.
- Toda la lógica de fetching, transformación de datos y renderizado.
- Los tests existentes de las gráficas.

## Por qué

Los valores hex y hsl hardcodeados no respetan el dual theme y quedan
desactualizados si los tokens Halo cambian. Centralizando en tokens y
en el hook `useIsDark` el mantenimiento es trivial.

## Criterios de aceptación

- [ ] `src/hooks/useIsDark.js` existe y exporta `useIsDark` con
      `MutationObserver` (reactivo al cambio de tema).
- [ ] `DemandByRoleChart` y `SalaryChart` usan `useIsDark()` importado.
- [ ] `tickColor` en los tres archivos usa los valores de los tokens Halo
      (no `"#ffffff"` ni `"#374151"` hardcodeados).
- [ ] `var(--chart-1)` en `TopSkillsChart` apunta a `--color-primary`
      (verificado, no necesariamente cambiado si el mapeo ya existe).
- [ ] `EuropeMap` usa `"var(--color-border)"` para el stroke normal y
      `"var(--color-text-primary)"` para el país seleccionado.
- [ ] Los tooltips de `DemandByRoleChart` y `SalaryChart` usan
      `bg-elevated border-border` (sin opacidad `/50`).
- [ ] `HeatmapSvg` y `HeatmapLegend` usan `var(--color-surface)` para
      celdas sin datos y `var(--color-border)` para su borde.
- [ ] `HeatmapLegend` nota final sin opacidad `/70`.
- [ ] Cambiar tema (dark↔light) actualiza los colores de las gráficas
      correctamente sin recargar.
- [ ] `npx vitest run` pasa al 100% — nuevo test para `useIsDark`.
- [ ] `npm run build` sin errores.
- [ ] La landing no ha sido modificada.

## Fuera de alcance

- Cambiar `d3.interpolateRdYlGn` — es señal de datos, no decoración.
- Cambiar `getRoleColor()` — colores semánticos del proyecto.
- Rediseño del layout de ninguna gráfica.
- Añadir animaciones ni interacciones nuevas.

## Sugerencia de índice para backend (no aplicar — pasar a la compañera)

La query de `/api/salary/by-role-country` es lenta (~14s) porque combina
`PERCENTILE_CONT` con `GROUP BY` sobre `jobs` sin índice de soporte.
Sugerencia para añadir en la BD:

```sql
-- Índice compuesto para la query de salario por rol y país.
-- Cubre el WHERE (is_active, salary_mid, salary_is_predicted),
-- el GROUP BY (country_code, role_category) y evita un seq scan.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_query
  ON jobs (country_code, role_category, salary_mid)
  WHERE is_active = TRUE
    AND salary_mid IS NOT NULL
    AND salary_is_predicted = FALSE
    AND salary_mid >= 1000;
```

`CONCURRENTLY` permite crearlo sin bloquear lecturas en producción.
Estimación: reducción de ~14s a ~1-2s en el tier gratuito de Supabase.
