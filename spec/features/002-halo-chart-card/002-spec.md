# 002 · Halo ChartCard

**Estado:** en curso

## Qué hace

Rediseña el wrapper visual `ChartCard.jsx` y sus clases CSS asociadas
(`chart-card-border`, `chart-card-inner`, `chart-graph-area`) siguiendo
el design system Halo.

**Contexto de diseño:** este rediseño no replica Halo tal cual — es una
versión propia que usa Halo como base estructural e integra los efectos
visuales del proyecto (DecryptedText, aurora en GlowButton, etc.) tanto
en dark como en light mode. El light mode también sigue la paleta Halo
adaptada (tokens de `index.css`), no el estilo anterior.

Lo que **cambia**:
- El borde aurora animado (degradado verde/morado giratorio) se reemplaza
  por un borde hairline 1px `--color-border` estático — el aurora se
  reserva para elementos interactivos (GlowButton, hero), no para cards
  de contenido pasivo.
- El fondo de la card pasa de `--color-background` (mismo que la página)
  a `--color-surface` (nivel 2 de superficie Halo) — las cards tienen que
  destacar del fondo tanto en dark como en light mode.
- En light mode, la card usa `--color-surface` (#ffffff) — coherente con
  los tokens Halo ya definidos en `index.css`.
- El badge "Actualizando..." usa tokens Halo: `--color-elevated`,
  `--color-border`, `--color-text-muted`.
- El estado de error usa `text-destructive` (que ya apunta a `--color-danger`
  tras la fase 001).

Lo que **no cambia**:
- La lógica de los tres estados (`isInitialLoad`, `showStale`, error).
- `DecryptedText` en el título.
- La posición del ⓘ (`warning` prop).
- El `chart-graph-area` en light mode (fondo blanco en el área de la
  gráfica — se mantiene, es una decisión de legibilidad, no de borde).
- La API del componente (props idénticas).

## Por qué

La card de gráfica es el elemento visual más repetido del dashboard —
aparece 6 veces en pantalla. Es el que más impacto tiene en la percepción
general del diseño. Hacerla después de los tokens garantiza que los colores
ya son los correctos y que solo hay que reemplazar la técnica del borde y
los niveles de superficie.

## Criterios de aceptación

- [ ] La card tiene fondo `--color-surface` tanto en dark como en light mode.
- [ ] El borde es 1px sólido `--color-border`, radio `--radius-xl` — sin
      gradiente animado ni padding de 3px para simular el borde.
- [ ] En dark mode la card se distingue visualmente del fondo de página
      (`--color-surface` #14151C sobre `--color-background` #0A0B0F).
- [ ] En light mode la card se distingue visualmente del fondo de página
      (`--color-surface` #ffffff sobre `--color-background` #f6f6fc).
- [ ] El badge "Actualizando..." usa tokens Halo: fondo `--color-elevated`,
      borde `--color-border`, texto `--color-text-muted`, radio `--radius-full`.
- [ ] El mensaje de error usa `--color-danger` (o `text-destructive`, que ya
      apunta al token correcto tras la fase 001).
- [ ] El estado "Cargando..." mantiene el mismo texto y posición, con
      `--color-text-muted`.
- [ ] `DecryptedText` en el título sigue funcionando igual (hover descifra).
- [ ] El ⓘ de filtros ignorados sigue apareciendo a la izquierda del título.
- [ ] `chart-graph-area` en light mode conserva el fondo blanco (`--color-surface`)
      para el área de la gráfica.
- [ ] Las 6 gráficas del dashboard se ven correctamente en dark y light mode.
- [ ] La animación `auroraFlow` se elimina de `.chart-card-border` (queda
      solo en GlowButton, que sí la usa).
- [ ] `npx vitest run` pasa al 100% — el test de `ChartCard.test.jsx` no
      necesita cambios de lógica pero se actualiza si algún selector cambia.
- [ ] `npm run build` sin errores.
- [ ] La landing no ha sido modificada.

## Fuera de alcance

- Rediseño de los componentes de gráficas individuales — eso es 007.
- Rediseño de `ChartDescription` (pills, filtros) — eso es 008.
- Cambios en `DecryptedText` ni en `FilterWarningPopover`.
- Añadir hover states a la card — Halo no tiene hover en cards de contenido.
