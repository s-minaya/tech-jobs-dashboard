# 018 · Rediseño landing — versión tablet — Spec

**Estado:** borrador, pendiente de confirmación explícita del usuario
antes de crear `018-plan.md`/`018-tasks.md` (`AGENTS.md`).

> Segunda feature del "resto de la fase 3", continúa lo que empezó la
> 017 en `src/components/landing/` (ya no congelada). Alcance:
> **tablet** (640–1024px, rango de `tech-stack.md`), en sus dos
> orientaciones — portrait y landscape, con comportamientos distintos
> entre sí. Desktop (>1024px) sigue fuera de alcance, para una feature
> futura sin numerar.

## Contexto

Hoy `LandingPage.jsx` no tiene ningún tratamiento propio de tablet —
todo lo que sea ≥640px (`sm:` de Tailwind) hereda el fallback que dejó
fijado la 017 para "todo lo que no sea móvil": sin scroll, centrado,
misma disposición de una columna que móvil
(`sm:overflow-visible sm:pointer-events-none`, cards en
`sm:flex-row sm:flex-wrap`). No es un diseño de tablet, es solo lo que
queda por descarte.

El usuario aportó dos imágenes de referencia (tablet portrait y tablet
landscape) con comportamientos claramente distintos entre sí:

- **Portrait** — hero (título + descripción + CTA) alineado a la
  izquierda, ocupando el alto completo del viewport; debajo, una línea
  separadora + indicador "scroll para ver las métricas ↓"; al hacer
  scroll, las 3 stat cards en grid de 2 columnas (la card de demanda
  ocupa el ancho completo de la segunda fila).
- **Landscape** — sin scroll: hero a la izquierda, las 3 cards a la
  derecha (2 arriba + 1 abajo ocupando el ancho de las dos), todo
  visible a la vez.

Como en la 017, las imágenes son una aproximación de la distribución,
no un contrato pixel a pixel.

## Qué hace

1. Tratamiento propio de tablet (640–1024px) en `LandingPage.jsx`,
   distinto del fallback actual.
2. **Portrait**: hero alineado a la izquierda, ocupa el alto completo
   del viewport (100dvh); línea separadora + indicador de scroll con
   flecha debajo del CTA; al hacer scroll se revelan las 3 cards en
   grid de 2 columnas / 2 filas (card de demanda en fila completa).
3. **Landscape**: sin scroll — hero a la izquierda, cards a la derecha
   en el mismo grid 2+1, todo dentro del viewport.
4. Mismo texto de descripción que móvil ("Explora las tendencias del
   mercado laboral tech en Europa..." — confirmado con el usuario, sin
   copy nuevo).
5. Card "Descubre dónde está la demanda": mismo contenido interno que
   en móvil (lista numerada 1/2/3, sin cambios) — en el grid de tablet
   solo cambian su posición y su tamaño (ocupa el ancho completo de la
   segunda fila), no su contenido.
6. Fondo `Lightfall` se mantiene fijo en toda la pantalla (portrait y
   landscape), igual que en móvil — sigue detrás tanto del hero como de
   las cards.
7. Ningún dato se hardcodea: mismo mapeo card→dato que móvil.

## Mapeo dato → card (sin cambios respecto a la 017)

| Card | Dato(s) | Fuente |
|---|---|---|
| Explora el mercado por país | `total_countries`, `total_active_jobs`, `last_updated` | `useSummaryStats` |
| Compara salarios en Europa | `median_salary_90d` | `useSummaryStats` |
| Descubre dónde está la demanda | `top_skills_30d` (top 3) | `useSummaryStats` |

## Fuera de alcance

- Desktop (>1024px de ancho) — sigue heredando el fallback actual
  hasta una feature futura. Un tablet en landscape con más de 1024px
  de ancho real (p. ej. iPad Air/Pro) cae en ese fallback, no en el
  diseño de esta feature — ver "Decisiones ya tomadas".
- Cualquier endpoint, dato o campo nuevo.
- `HomePage.jsx` / hero del dashboard.
- Texto de descripción nuevo — se reutiliza el ya aprobado en móvil.
- Móvil (<640px) — sin cambios de comportamiento respecto a la 017.

## Decisiones ya tomadas (no se reabren en el plan)

- Breakpoint tablet: 640–1024px (`tech-stack.md`), en ambas
  orientaciones — no se inventa un rango distinto.
- Mismo texto de descripción que móvil, confirmado explícitamente con
  el usuario (la imagen de referencia traía un texto más corto, pero
  no es el texto final).

## Criterios de aceptación

- [ ] En tablet portrait (640–1024px, vertical), el hero ocupa el
      viewport completo, con línea separadora + indicador de scroll
      debajo del CTA.
- [ ] Al hacer scroll en portrait, las 3 cards se muestran en grid de 2
      columnas (card de demanda en fila completa).
- [ ] En tablet landscape (640–1024px, horizontal), todo el contenido
      (hero + 3 cards) es visible sin scroll.
- [ ] Móvil (<640px) sin cambios de comportamiento respecto a la 017.
- [ ] Desktop (>1024px) sin cambios respecto al fallback actual.
- [ ] Las 3 cards siguen 100 % dinámicas vía `useSummaryStats`, mismo
      mapeo de datos que móvil.
- [ ] `npx vitest run` al 100 %, `npm run build` sin errores.
- [ ] `.env.local` nunca leído ni impreso.

## Ver también

- Imágenes de referencia (tablet portrait/landscape), aportadas por el
  usuario en la conversación que originó esta spec.
- `spec/features/017-landing-mobile-redesign/` — feature anterior sobre
  el mismo componente.
