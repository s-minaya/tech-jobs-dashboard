# 018 · Rediseño landing — versión tablet — Tareas

> No empezar sin autorización explícita del usuario para pasar de
> `018-plan.md` a implementación. Confirmar cada bloque antes de pasar
> al siguiente (`AGENTS.md`).

## Bloque A — Hero: alineado a la izquierda en tablet

- [ ] Título/descripción/CTA pasan de centrado (móvil) a alineado a la
      izquierda en tablet (`sm:items-start sm:text-left`, ambas
      orientaciones). `lg:` restaura el centrado actual de desktop.
- [ ] `npx vitest run` en verde.

## Bloque B — Separador + indicador de scroll (portrait)

- [ ] Elemento nuevo (línea + "scroll para ver las métricas ↓"), solo
      visible en tablet portrait (`hidden sm:portrait:flex lg:hidden`).
- [ ] Verificación visual (Playwright, viewport 768×1024): visible en
      portrait, oculto en móvil/landscape/desktop.
- [ ] `npx vitest run` en verde.

## Bloque C — Grid de cards (2 columnas)

- [ ] Contenedor de cards: de `flex-wrap` a grid de 2 columnas en
      tablet (`sm:grid sm:grid-cols-2`), card de demanda en
      `sm:col-span-2`. `lg:` restaura el `flex-row flex-wrap` actual de
      desktop. Contenido interno de las 3 cards sin cambios (incluida
      la lista numerada de la card de demanda, igual que en móvil).
- [ ] Verificación visual (Playwright, 768×1024 y 1024×768): grid 2+1
      correcto en ambas orientaciones tablet.
- [ ] `npx vitest run` en verde.

## Bloque D — Landscape: hero + cards en fila, sin scroll; scroll de portrait

- [ ] Wrapper general: `sm:landscape:flex sm:landscape:flex-row` (hero
      a la izquierda, grid de cards a la derecha, misma fila). Portrait
      mantiene el orden vertical natural del DOM (hero, luego cards).
- [ ] Scroll: override de `sm:overflow-visible sm:pointer-events-none`
      (017) movido a `sm:landscape:overflow-visible
      sm:landscape:pointer-events-none` + `lg:overflow-visible
      lg:pointer-events-none` — portrait tablet hereda el scroll por
      defecto (mismo mecanismo que móvil), sin regla nueva.
- [ ] Verificación visual (Playwright): landscape sin scroll con todo
      visible; portrait con scroll funcional (fondo `Lightfall` fijo,
      cards accesibles al hacer scroll, mismo mecanismo que móvil en la
      017).
- [ ] `npx vitest run` en verde, `npm run build` sin errores.

## Bloque E — Cierre

- [ ] Confirmar sin datos hardcodeados nuevos.
- [ ] Confirmar que móvil (<640px) y desktop (>1024px) quedan
      pixel-idénticos a como estaban antes de esta feature (capturas
      comparativas).
- [ ] `npx vitest run` al 100 %, `npm run build` sin errores.
- [ ] `.env.local` nunca leído ni impreso.
- [ ] Mover la 018 a "Hecho" en `roadmap.md`.
- [ ] Resumen de cambios al usuario, esperar aprobación antes de
      `git commit`/`git push`.
