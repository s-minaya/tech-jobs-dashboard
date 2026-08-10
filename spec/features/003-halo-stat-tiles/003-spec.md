# 003 · Halo Stat Tiles

**Estado:** en curso

## Qué hace

Rediseña el componente `SummaryStats.jsx` y las clases CSS asociadas
(`glow-kpi-wrapper`, `glow-kpi-inner`) siguiendo el patrón stat-tile de
Halo, manteniendo el comportamiento de datos dinámicos y el grid responsive.

Lo que **cambia**:

- El efecto hover aurora (borde animado + relleno oscuro) se reemplaza por
  un stat-tile Halo con superficie `--color-surface` y borde hairline 1px
  `--color-border` en los tres lados no superiores — sin hover animado, las
  KPI cards son contenido informativo, no acciones.
- Cada KPI card mantiene una **franja de 3px en la parte superior**, pero
  en vez de un signal color plano por tipo de dato usa el mismo degradado
  animado que `GlowButton` (`@keyframes auroraFlow`) — decisión tomada
  durante la implementación: las 5 cards comparten la misma franja aurora,
  recortada a las esquinas redondeadas de la card (`overflow: hidden` +
  `::before`, ya que `border-image` no respeta `border-radius`). Esto es
  una excepción deliberada al criterio de "aurora solo en elementos
  interactivos" de la fase 002 — aquí decora, no indica una acción.
- El **valor numérico** pasa a JetBrains Mono (`font-mono`) — los datos
  tabulares y métricas usan la fuente mono en Halo.
- El **label** (eyebrow) pasa a `text-xs uppercase tracking-wider
  font-medium text-muted` — patrón eyebrow de Halo para labels de KPI.
- Se elimina el icono `RiCalendarLine` de "Última actualización" — en Halo
  los stat tiles son texto puro; el icono añade ruido sin valor.
- El skeleton de carga se simplifica: misma forma que la card real (mismo
  radio y borde), sin `backdrop-blur-md`.

Lo que **no cambia**:

- La lógica de fetching (`getSummaryStats`, `useEffect`, estados
  `loading`/`error`).
- Los textos de `label`, `value` y `description` de cada KPI.
- El grid responsive (2 cols móvil / 3 cols sm / 5 cols lg).
- El comportamiento de `fullWidth` en "Última actualización".
- `formatNumber` y `formatDate`.
- Los datos vienen de la BD real — nada hardcodeado.

## Por qué

Las KPI cards son lo primero que ve el usuario al entrar al dashboard.
Con la fase 002 las gráficas ya tienen superficie Halo; las KPIs deben
seguir el mismo lenguaje visual para que el dashboard sea coherente. La
franja aurora superior conserva algo del carácter distintivo del diseño
anterior (aurora era el efecto de marca de las KPI cards) sin el hover
animado ni el relleno oscuro, que sí chocaban con "contenido informativo,
no acción".

## Criterios de aceptación

- [ ] Cada KPI card tiene fondo `--color-surface`, borde 1px
      `--color-border` (excepto el lado superior) y radio `--radius-xl` —
      igual que `ChartCard`.
- [ ] Cada card tiene una franja de 3px en la parte superior con el
      degradado aurora animado (`@keyframes auroraFlow`), recortada a las
      esquinas redondeadas de la card.
- [ ] El valor numérico usa `font-mono` (JetBrains Mono).
- [ ] El label usa el patrón eyebrow: `text-xs uppercase tracking-wider
      font-medium` y color `--color-text-muted`.
- [ ] La description usa `--color-text-muted` (sin opacidad `/70`).
- [ ] El icono `RiCalendarLine` ha sido eliminado.
- [ ] No hay efecto hover animado en las cards.
- [ ] El skeleton de carga tiene la misma forma que la card (mismo radio
      y borde), sin `backdrop-blur-md`.
- [ ] El grid responsive sigue siendo 2/3/5 columnas según breakpoint.
- [ ] `fullWidth` sigue funcionando en "Última actualización".
- [ ] Los datos siguen siendo dinámicos (vienen de `getSummaryStats()`).
- [ ] Funciona correctamente en dark y light mode con los tokens Halo.
- [ ] `npx vitest run` pasa al 100%.
- [ ] `npm run build` sin errores.
- [ ] La landing no ha sido modificada.

## Fuera de alcance

- Añadir sparklines o tendencias — no hay datos históricos de KPIs.
- Animaciones de entrada de los números.
- Hacer las cards clickables o interactivas.
- Cambios en la API de `getSummaryStats()`.
