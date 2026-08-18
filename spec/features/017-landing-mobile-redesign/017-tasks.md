# 017 · Rediseño landing — versión móvil — Tareas

> No empezar sin autorización explícita del usuario para pasar de
> `017-plan.md` a implementación. Confirmar cada bloque antes de pasar
> al siguiente (`AGENTS.md`).

## Bloque A — Traducción de `AuroraText`

- [x] `src/components/ui/AuroraText.jsx` (props: `children`,
      `className`, `colors`, `speed` — ver `017-plan.md`).
- [x] `src/index.css`: token `--animate-aurora` + `@keyframes aurora`.
- [x] Test: `src/tests/components/ui/AuroraText.test.jsx`.
- [x] `npx vitest run` en verde. `npm run build` sin errores.

## Bloque B — Aplicar `AuroraText` en el título

- [x] Título: `Radar del` + `<AuroraText>Mercado Tech</AuroraText>`,
      colores por defecto del componente de referencia.
- [x] Copy del CTA → "Explorar dashboard".
- [x] `npx vitest run` en verde — 408/408, 32/32 archivos. `npm run
      build` sin errores.

## Bloque C — Scroll y disposición interna de las cards

- [x] Elección de iconos: previsualizadas 5 alternativas por card
      (Remix Icon + lucide-react, ya instalado) en un montaje temporal
      de solo lectura, borrado tras decidir. Se mantienen
      `RiEarthLine` (país) y `RiFireLine` (demanda); el de salario
      cambia de `RiMoneyEuroCircleLine` a `Euro` (lucide-react).
- [x] Contenedor raíz: separada una capa de scroll nueva entre el fondo
      fijo (`Lightfall`/overlay) y el contenido — si el `overflow-y-auto`
      se pone directo en el contenedor que también tiene el fondo
      `absolute`, el fondo se desplazaría con el contenido en vez de
      quedarse fijo. En móvil (<640px) esa capa nueva es scrollable de
      verdad; en `sm+` (fuera de alcance) vuelve a
      `overflow-visible`/`pointer-events-none` — mismo comportamiento
      exacto que antes, sin tocar nada ahí.
- [x] Rediseño interno de cada `StatCard`: icono en círculo (`h-8 w-8
      rounded-full`), números subidos de `text-xl` a `text-2xl`, franja
      inferior nueva (`StatCardFooter`) con texto + punto decorativo
      (`var(--color-success)` inline — el token no está en el puente
      `@theme`, no existe `bg-success` como utilidad Tailwind). Borde/
      fondo de cristal sin cambios.
- [x] Verificación manual (Playwright headless, viewport móvil real
      375×667, capturas revisadas): el fondo `Lightfall` se queda fijo
      mientras el contenido hace scroll; las 3 cards y el CTA quedan
      accesibles haciendo scroll (antes cortados sin poder verlos).
- [x] `npx vitest run` en verde. `npm run build` sin errores.

## Bloque D — Documentación y cierre

- [x] `AGENTS.md`: nota de desbloqueo de `src/components/landing/`
      (mismo formato que `api/`).
- [x] `mission.md`: actualizado tanto "Qué NO es" como el principio de
      "Diseño coherente" (mencionaba "la landing... no se toca").
- [x] `tech-stack.md`: actualizado de paso (no estaba en el plan
      original, pero tenía la misma zona marcada como congelada en dos
      sitios más — se habría quedado contradiciendo a `AGENTS.md`/
      `mission.md`); `AuroraText.jsx` añadido a "Archivos/módulos clave".
- [x] Confirmado sin datos hardcodeados nuevos — revisado el diff
      completo de `LandingPage.jsx`: todo número sigue viniendo de
      `stats`/`useSummaryStats`, lo único añadido es copy de UI.
- [x] `npx vitest run` al 100 %, `npm run build` sin errores.
- [x] `.env.local` nunca leído ni impreso — verificado con `git diff`
      sobre todos los archivos tocados en la feature.
- [x] Movida la 017 a "Hecho" en `roadmap.md`, con el resumen real de
      lo implementado (incluida la reversión de `NeonGradientCard`).
- [ ] Resumen de cambios al usuario, esperar aprobación antes de
      `git commit`/`git push`.
