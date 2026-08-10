# 003 · Halo Stat Tiles — Tareas

## Preparación

- [ ] Grep de usos de las clases que se van a eliminar:
  ```bash
  grep -r "glow-kpi" src/ --include="*.jsx" --include="*.css"
  ```
  Resultado esperado: solo `SummaryStats.jsx` e `index.css`.

## CSS — `src/index.css`

- [ ] Localizar el bloque `/* KPI CARDS */` (clases `.glow-kpi-wrapper` y
  `.glow-kpi-inner` y sus variantes hover/light) y reemplazarlo por:
  ```css
  /* ── Stat tile — KPI card con accent bar superior ──────────────────────
     Mismo nivel de superficie que ChartCard. La accent bar usa una custom
     property inline (--accent-color) pasada desde el JSX, con fallback a
     --color-border-strong si no se especifica. */
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
- [ ] Eliminar el comentario `/* TODO: rediseñar en fase 003 */` que
  precede al bloque antiguo.
- [ ] Verificar que no queda ninguna referencia a `.glow-kpi-wrapper` ni
  `.glow-kpi-inner` en el archivo.

## JSX — `src/components/layout/SummaryStats.jsx`

- [ ] Eliminar el import de `RiCalendarLine` (y de `react-icons/ri` si
  era el único icono importado).

- [ ] Refactorizar `KpiCard`:
  - Añadir prop `accentColor` al destructuring.
  - Eliminar prop `icon` y todo el bloque condicional `{Icon ? ... : ...}`.
  - Reemplazar `className="glow-kpi-wrapper group ..."` por
    `className="stat-tile"` con `style={{ '--accent-color': accentColor }}`.
  - Eliminar el `<div className="glow-kpi-inner ...">` interior.
  - Actualizar clases de texto:
    - Label: añadir `uppercase tracking-wider` al `text-xs font-medium text-muted-foreground`.
    - Value: añadir `font-mono` y quitar `tracking-tight`.
    - Description: cambiar `text-muted-foreground/70` por `text-muted-foreground`.

- [ ] Actualizar las llamadas a `<KpiCard>` para pasar `accentColor`:
  ```jsx
  <KpiCard label="Ofertas activas"       accentColor="var(--color-primary)"      ... />
  <KpiCard label="Países cubiertos"      accentColor="var(--color-info)"         ... />
  <KpiCard label="Skills rastreadas"     accentColor="var(--color-warning)"      ... />
  <KpiCard label="Con salario declarado" accentColor="var(--color-success)"      ... />
  <KpiCard label="Última actualización"  accentColor="var(--color-border-strong)" fullWidth ... />
  ```
  (sin prop `icon` en ninguna).

- [ ] Actualizar el skeleton de carga:
  ```jsx
  // Antes:
  className={`h-20 animate-pulse rounded-xl border border-border bg-muted/30 shadow-lg backdrop-blur-md ${...}`}
  // Después:
  className={`h-[88px] animate-pulse rounded-xl border border-border bg-surface/50 ${...}`}
  ```

- [ ] Actualizar el comentario del componente `KpiCard` para describir
  el nuevo diseño (stat-tile, accent bar, font-mono).

## Verificación

- [ ] Arrancar dev server y comprobar visualmente en **dark mode**:
  - Cada card tiene fondo `#14151C` distinguible del fondo `#0A0B0F`.
  - Accent bar de 2px visible en la parte superior de cada card con su color.
  - Valor en JetBrains Mono.
  - Label en uppercase con tracking amplio.
  - Sin icono en "Última actualización".
- [ ] Comprobar en **light mode**:
  - Cards blancas distinguibles del fondo lila claro.
  - Accent bars visibles con sus signal colors.
- [ ] `npx vitest run` — 100% de tests pasando.
- [ ] `npm run build` — sin errores.
- [ ] La landing no ha sido modificada.

## Cierre

- [ ] Validar contra todos los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [ ] Commit (solo tras confirmación del usuario):
  `refactor: replace KPI cards with Halo stat tiles and signal accent bars`
