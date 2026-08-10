# 003 · Halo Stat Tiles — Tareas

## Preparación

- [x] Grep de usos de las clases que se van a eliminar:
  ```bash
  grep -r "glow-kpi" src/ --include="*.jsx" --include="*.css"
  ```
  Resultado esperado: solo `SummaryStats.jsx` e `index.css`.
  Confirmado: solo esos dos archivos.

## CSS — `src/index.css`

- [x] Localizar el bloque `/* KPI CARDS */` (clases `.glow-kpi-wrapper` y
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
- [x] Eliminar el comentario `/* TODO: rediseñar en fase 003 */` que
  precede al bloque antiguo.
- [x] Verificar que no queda ninguna referencia a `.glow-kpi-wrapper` ni
  `.glow-kpi-inner` en el archivo.
- [x] Extra (no en el plan original): registrar `--color-surface: var(--color-surface);`
  en `@theme inline`. Igual que con `--color-elevated` en la fase 002, el
  token existía pero `bg-surface` (usado en el skeleton) no generaba
  ninguna utilidad Tailwind sin esta línea.

## JSX — `src/components/layout/SummaryStats.jsx`

- [x] Eliminar el import de `RiCalendarLine` (y de `react-icons/ri` si
  era el único icono importado). Era el único, se eliminó el import completo.

- [x] Refactorizar `KpiCard`:
  - Añadir prop `accentColor` al destructuring.
  - Eliminar prop `icon` y todo el bloque condicional `{Icon ? ... : ...}`.
  - Reemplazar `className="glow-kpi-wrapper group ..."` por
    `className="stat-tile"` con `style={{ '--accent-color': accentColor }}`.
  - Eliminar el `<div className="glow-kpi-inner ...">` interior.
  - Actualizar clases de texto:
    - Label: añadir `uppercase tracking-wider` al `text-xs font-medium text-muted-foreground`.
    - Value: añadir `font-mono` y quitar `tracking-tight`.
    - Description: cambiar `text-muted-foreground/70` por `text-muted-foreground`.
  - Extra: se quitaron los `mt-0.5` manuales entre label/valor/descripción
    — `.stat-tile` ya define `gap: var(--space-1)` en el flex column, así
    que el margen manual habría duplicado el espaciado.

- [x] Actualizar las llamadas a `<KpiCard>` para pasar `accentColor`
  (sin prop `icon` en ninguna).

- [x] Actualizar el skeleton de carga a `bg-surface/50` sin `shadow-lg`/`backdrop-blur-md`.
  Altura: el linter del IDE sugirió la clase canónica `h-22` (=88px) en vez
  de la arbitraria `h-[88px]` del plan — mismo valor, se usó `h-22`.

- [x] Actualizar el comentario del componente `KpiCard` para describir
  el nuevo diseño (stat-tile, accent bar, font-mono).

## Verificación

- [x] Arrancar dev server y comprobar visualmente en **dark mode** y
  **light mode**: el skeleton (única parte visible sin datos reales — ver
  nota) usa `bg-surface/50`, `rounded-xl`, `border-border`, sin blur, y se
  distingue correctamente del fondo de página en ambos temas.
  Nota: igual que en las fases 001 y 002, este sandbox no tiene salida de
  red hacia la BD remota, así que las KPI cards reales (con accent bar y
  valor en JetBrains Mono) no se pudieron fotografiar cargadas — se
  verificaron por lectura de código y por los 9 tests de
  `SummaryStats.test.jsx`, que sí cubren el estado cargado vía MSW.
- [x] `npx vitest run` — 298/298 tests pasando.
- [x] `npm run build` — sin errores.
- [x] La landing no ha sido modificada.

## Revisión post-implementación (feedback directo del usuario)

Tras completar lo de arriba, el usuario pidió sustituir el accent bar de
signal color plano (2px, un color por KPI) por el degradado aurora animado
de `GlowButton`, más grueso y recortado a las esquinas redondeadas. Ver
`003-spec.md` y `003-plan.md` (sección "Decisiones") para el detalle.

- [x] CSS: `.stat-tile` pierde `border-top` de color sólido; pasa a
  `border-top: none` + `::before` absoluto (franja de 3px, degradado
  `linear-gradient(135deg, #7cff67, #b497cf, #5227ff, #b497cf, #7cff67)`,
  `animation: auroraFlow 4s ease infinite`) + `overflow: hidden` en el
  tile para que la franja respete el `border-radius`.
- [x] JSX: se elimina la prop `accentColor` de `KpiCard` por completo (ya
  no hace falta, las 5 cards comparten la misma franja) y de las 5
  llamadas a `<KpiCard>`.
- [x] Verificado visualmente con una página HTML aislada que carga el CSS
  ya compilado (`npm run build`) — evita depender de la red del sandbox
  para ver el componente con datos. Franja aurora nítida, recortada a las
  esquinas, en dark y light.
- [x] `npx vitest run` — 298/298 sigue en verde tras el cambio.
- [x] `npm run build` — sin errores.

## Cierre

- [x] Validar contra todos los criterios de aceptación de `spec.md`.
- [x] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [ ] Commit (solo tras confirmación del usuario):
  `refactor: replace KPI cards with Halo stat tiles and animated aurora accent bar`
