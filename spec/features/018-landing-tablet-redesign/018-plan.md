# 018 · Rediseño landing — versión tablet — Plan

## Detección de breakpoint + orientación — CSS, no JS

El proyecto ya tiene un precedente de detección de orientación en JS:
`useOrientation()` (local a `SkillHeatmap.jsx`, vía
`matchMedia("(orientation: landscape)")`), usado porque ese caso
intercambia el árbol de componentes entero (tabla vs. prompt de girar
el móvil). Aquí no hace falta lo mismo: el contenido es siempre el
mismo (hero + 3 cards), solo cambia su agrupación/posición — se resuelve
con variantes de Tailwind (`portrait:`/`landscape:`, nativas desde v3,
combinables con `sm:`/`lg:`), sin JS ni hook nuevo:

- `sm:` (≥640px) — arranca el tratamiento de tablet.
- `lg:` (≥1024px) — restaura el fallback actual (desktop, fuera de
  alcance).
- `portrait:`/`landscape:` — distingue las dos variantes dentro del
  rango tablet (`sm:landscape:...`, `sm:portrait:...`).

## Scroll — se resuelve casi solo

El toggle de scroll de la 017 ya usa `overflow-y-auto` por defecto
(móvil) y lo desactiva a partir de `sm:` (`sm:overflow-visible
sm:pointer-events-none`). Para que **tablet portrait siga con scroll**
(a diferencia de landscape), el override se mueve de `sm:` a
`sm:landscape:` + `lg:` — es decir, se desactiva el scroll en landscape
dentro del rango tablet y en todo lo que sea ≥1024px, pero NO en
portrait dentro del rango tablet, que hereda el comportamiento por
defecto (scrollable) sin necesidad de una regla nueva.

## Estructura de contenido (misma jerarquía en las 3 variantes)

Mismos tres bloques que ya existen, reordenados/reagrupados por
breakpoint+orientación con clases de Tailwind, sin duplicar JSX:

1. **Hero** (título + descripción + CTA) — pasa de centrado (móvil) a
   alineado a la izquierda en tablet (ambas orientaciones).
2. **Separador + indicador de scroll** — elemento nuevo, solo visible
   en tablet portrait (`hidden sm:portrait:flex lg:hidden`).
3. **Grid de cards** — pasa de `flex-wrap` (móvil/fallback) a grid de 2
   columnas en tablet (ambas orientaciones), con la card de demanda en
   `col-span-2`. En landscape, el grid se coloca a la derecha del hero
   en la misma fila (`sm:landscape:flex-row`); en portrait, debajo
   (columna, ya es el orden natural del DOM).

`lg:` restaura explícitames las clases del fallback actual (`lg:flex
lg:flex-row lg:flex-wrap`, scroll desactivado) para que desktop quede
intacto — no basta con no añadir nada, porque las clases `sm:` sin
tope seguirían aplicando a partir de 1024px.

## Card de demanda — sin cambios de contenido

`StatCard`/`StatCardFooter` y el `<ol>` numerado de la card de demanda
no cambian nada por dentro — mismo contenido exacto que móvil. Lo único
que cambia en tablet es su tamaño/posición dentro del grid
(`sm:col-span-2`, ver más abajo), no su JSX interno.

## Verificación

Igual que en la 017: `npx vitest run` no puede probar breakpoints
CSS/`matchMedia` reales en jsdom — la verificación de portrait/landscape
en tablet se hace con capturas de Playwright en viewports reales
(ej. 768×1024 portrait, 1024×768 landscape), no con tests unitarios
nuevos.

## Riesgos

- **`lg:` como tope del rango tablet, no el ancho real de un tablet en
  landscape** — un iPad Air/Pro en landscape (1180-1366px de ancho)
  cae en el fallback de desktop, no en el diseño de esta feature. Es
  una consecuencia directa de usar el rango de `tech-stack.md` tal
  cual, documentada en `018-spec.md` como fuera de alcance, no un bug.
- **Compound variants de Tailwind** (`sm:landscape:`, `sm:portrait:`) —
  si alguna combinación no se comporta como se espera en la práctica,
  el plan B es el mismo patrón JS ya usado en `SkillHeatmap.jsx`
  (`useOrientation` + `window.innerWidth`), extraído a un hook
  compartido — no bloquea el resto de la feature si hace falta en un
  bloque concreto.
