# 016 · Setup de rutas por gráfica + header de navegación — Tareas

> No empezar ninguna tarea de este archivo sin autorización explícita
> del usuario para pasar de `016-plan.md` a implementación
> (`AGENTS.md`).

## Bloque A — Dependencia + esqueleto de rutas

- [x] `npm install react-router-dom` (última estable `^7`, modo
      declarativo). Instalado `^7.18.2`.
- [x] Crear `src/pages/HomePage.jsx` con el contenido actual de
      `MainContent.jsx` (hero + `SummaryStats` + `TopSkillsChart`),
      sin sidebar. Los `id="inicio"`/`id="inicio-skills"` no se
      trasladan (sin selector CSS dependiente, verificado con grep;
      el `IntersectionObserver` que los usaba se retira en el bloque C).
- [x] Crear `src/pages/TrendsPage.jsx` (`DemandByRoleChart`).
- [x] Crear `src/pages/SalaryPage.jsx` (`SalaryChart`).
- [x] Crear `src/pages/MapPage.jsx` (`EuropeMap`).
- [x] Crear `src/pages/SkillsPage.jsx` (`SkillHeatmap`).
- [x] Eliminar `src/components/layout/MainContent.jsx` (contenido ya
      migrado a `HomePage.jsx`). Referencias residuales en comentarios
      de `index.css`/`SummaryStats.jsx`/`App.jsx` actualizadas a
      `HomePage.jsx` de paso.
- [x] Envolver `<App />` con `<BrowserRouter>` en `src/main.jsx`.
- [x] `App.jsx`: sustituir el render de `<MainContent />` por
      `<Routes>` con las 5 `<Route>` (imports normales todavía, sin
      `lazy`). `FilterFAB`/`FilterDrawer`/`MobileFilterSheet` se quedan
      montados tal cual por ahora (se retiran/adaptan en el bloque D).
- [x] Verificación manual: `npm run dev` + Playwright headless
      (`chromium-cli` no disponible en este entorno Windows — se usó la
      config ya existente del proyecto, `playwright.config.js`, con un
      script temporal fuera de `e2e/`, borrado al terminar). Landing →
      "Comenzar" → las 5 rutas, capturas de cada una.
- [x] `npx vitest run` en verde — 400/400, 28/28 archivos (una primera
      pasada tuvo 7 timeouts de arranque de workers, reproducidos de
      forma no determinista por el entorno — la repetición inmediata
      pasó limpia, no relacionado con los cambios de este bloque).

## Bloque B — Code-splitting real

- [ ] `TopSkillsChart` (en `HomePage.jsx`) → `React.lazy()` + `Suspense`.
- [ ] `DemandByRoleChart` (en `TrendsPage.jsx`) → `React.lazy()` +
      `Suspense`.
- [ ] `SalaryChart` (en `SalaryPage.jsx`) → `React.lazy()` +
      `Suspense`.
- [ ] `EuropeMap` (en `MapPage.jsx`) → `React.lazy()` + `Suspense`.
- [ ] `SkillHeatmap` (en `SkillsPage.jsx`) → `React.lazy()` +
      `Suspense`.
- [ ] Fallback de `Suspense` coherente con el skeleton que ya usa
      `ChartCard` durante la carga.
- [ ] `npm run build`: confirmar chunks separados por gráfica (revisar
      `dist/assets/`) y que el aviso "chunks larger than 500 kB" ya no
      aplica al chunk principal — documentar el tamaño real de cada
      chunk aquí una vez medido:
      - `TopSkillsChart`: ⬜ kB
      - `DemandByRoleChart`: ⬜ kB
      - `SalaryChart`: ⬜ kB
      - `EuropeMap`: ⬜ kB
      - `SkillHeatmap`: ⬜ kB
- [ ] Verificación manual (Network tab): al entrar en una ruta, solo se
      descarga el chunk de esa gráfica.

## Bloque C — `Header` (md+), `BottomNav` (móvil) y `ThemeToggle`

- [ ] Crear `src/components/layout/Header.jsx`: barra superior, **solo
      md+** (`hidden md:flex`), 5 `NavLink` a las rutas, aloja
      `ThemeToggle`.
- [ ] Montar `Header` en `App.jsx` (fuera de `<Routes>`, visible en
      todas las páginas del dashboard, solo en md+).
- [ ] `BottomNav.jsx`: añadir el ítem "Salarios" (`/salarios`) →
      `NAV_ITEMS` pasa de 5 a 6 (Inicio, Tendencias, Salarios, Mapa,
      Skills, Filtros). Los 5 ítems de ruta pasan de `scrollIntoView` a
      `NavLink` real. El ítem "Filtros" no cambia — sigue abriendo
      `MobileFilterSheet` igual que hoy.
- [ ] `HomePage.jsx`: quitar el `ThemeToggle` que hoy vive hardcodeado
      dentro del hero.
- [ ] `App.jsx`: montar un segundo `ThemeToggle`, **solo móvil**
      (`md:hidden`), `position: fixed` (no `absolute`, para que se vea
      en cualquier ruta) en la misma esquina donde vive hoy, visible en
      todas las páginas.
- [ ] `App.jsx`: eliminar el `useEffect` del `IntersectionObserver` y
      el estado `activeSection` (ya no se usan).
- [ ] Verificación manual: `Header` visible solo en desktop/tablet,
      `BottomNav` visible solo en móvil, navegación funcional en
      ambos, tema seleccionable desde cualquier ruta y cualquier
      tamaño de pantalla.
- [ ] `npx vitest run` en verde (`BottomNav.test.jsx` actualizado a 6
      items + `NavLink`; test nuevo `Header.test.jsx`).

## Bloque D — `DesktopFilterSidebar` nuevo (md+); `MobileFilterSheet` intacto (móvil)

> `DesktopFilterSidebar` es un componente **nuevo**, no una reescritura de
> `FilterDrawer.jsx` — reutiliza su contenido pequeño (`FilterSection`
> + cabecera) como referencia visual, no su mecánica de overlay/FAB,
> que ya no aplica a nada. Ver razonamiento completo en `016-plan.md`
> bloque D. `MobileFilterSheet.jsx` (móvil) no se toca.

- [ ] Crear `src/components/Filters/DesktopFilterSidebar.jsx` (reutiliza
      `FilterSection.jsx`; props `filters`, `onFilterChange`,
      `onReset`).
- [ ] Comportamiento: columna izquierda, **abierta por defecto**,
      colapsable con un icono, sin overlay/backdrop — mecánica exacta
      del colapso con margen de ajuste posterior.
- [ ] Estilo con tokens Halo ya existentes (`bg-elevated`,
      `border-border`, `--radius-*`, mismos `FilterChip`/
      `FilterToggleRow` de `FilterSection.jsx`) — mismo lenguaje visual
      que `FilterDrawer.jsx`/`FilterSheet.jsx` desde la fase 004, en
      dark y light. Intento real de acabado, no un placeholder sin
      estilizar.
- [ ] Crear `src/components/layout/ChartPageLayout.jsx` si conviene
      (grid `sidebar + contenido` compartido por las 4 páginas).
- [ ] `TrendsPage.jsx`/`SalaryPage.jsx`/`MapPage.jsx`/
      `SkillsPage.jsx`: envolver su gráfica en `ChartPageLayout` (o
      directamente) con `DesktopFilterSidebar`.
- [ ] `App.jsx`: eliminar `FilterFAB`, `FilterDrawer` y su montaje
      global; `MobileFilterSheet` se queda exactamente como está (mismo
      `filtersOpen`/`onOpenFilters` que ya usa `BottomNav`).
- [ ] Eliminar `src/components/Filters/FilterDrawer.jsx` (incluye el
      export `FilterFAB`).
- [ ] Verificación manual: en cada página de gráfica, cambiar un
      filtro dispara una única petición nueva, persiste en
      `localStorage` y se refleja en `/` al volver — probar tanto
      desde `DesktopFilterSidebar` (desktop) como desde `MobileFilterSheet` (móvil).
- [ ] `npx vitest run` en verde (`DesktopFilterSidebar.test.jsx` nuevo;
      `FilterDrawer.test.jsx` se retira con el componente;
      `FilterSection.test.jsx` sin cambios).

## Bloque E — Limpieza, extras opcionales, tests, documentación

- [ ] Confirmar que no queda código muerto: `MainContent.jsx`,
      `FilterFAB`, `FilterDrawer.jsx`, `IntersectionObserver`/
      `activeSection` de `App.jsx`, imports huérfanos. `MobileFilterSheet.jsx`
      no entra aquí — se mantiene sin cambios.
- [ ] **Opcional:** prefetch del chunk de una ruta al hacer hover sobre
      su link del header.
- [ ] **Opcional:** `startTransition` (React 19) envolviendo la
      navegación del header/`BottomNav`.
- [ ] Reescribir `e2e/dashboard.spec.js`: tests que interactúan con el
      FAB/drawer desktop → nuevo flujo (navegar a una página de
      gráfica, usar `DesktopFilterSidebar`); tests con
      `scrollIntoViewIfNeeded()` sobre headings → navegación por ruta
      real. Los flujos móviles (`MobileFilterSheet` vía `BottomNav`) deberían
      necesitar cambios mínimos.
- [ ] Actualizar `spec/constitution/tech-stack.md`: carpeta `pages/`,
      `Header.jsx`, `DesktopFilterSidebar.jsx`, `ChartPageLayout.jsx` nuevos;
      `MainContent.jsx`/`FilterFAB`/`FilterDrawer.jsx` retirados;
      `MobileFilterSheet.jsx` sin cambios; nota de que `ThemeToggle` vive en
      `Header` (md+) y flotante en móvil, ya no en el hero.
- [ ] Actualizar `spec/constitution/mission.md`: la frase *"El toggle
      dark/light se mantiene en el hero del dashboard"* queda
      desactualizada — sustituir por la ubicación real.
- [ ] `npx vitest run` al 100%.
- [ ] `npm run build` sin errores.
- [ ] `npx playwright test` en verde.
- [ ] `.env.local` nunca leído ni impreso durante toda la feature.

## Cierre

- [ ] Validar contra todos los criterios de aceptación de
      `016-spec.md`.
- [ ] Mover la feature 016 a "Hecho" en `spec/constitution/roadmap.md`,
      con el resumen real de lo implementado (mismo formato que las
      features anteriores).
- [ ] Presentar resumen de cambios al usuario y esperar aprobación
      explícita antes de `git commit`/`git push` (`AGENTS.md`).
