# 016 · Setup de rutas por gráfica + header de navegación — Tareas

> No empezar ninguna tarea de este archivo sin autorización explícita
> del usuario para pasar de `016-plan.md` a implementación
> (`AGENTS.md`).

## Bloque A — Dependencia + esqueleto de rutas

- [x] `npm install react-router-dom` (última estable `^7`, modo
      declarativo). Instalado `^7.18.2`.
- [x] Crear `src/pages/HomePage.jsx` con el contenido de portada de
      `MainContent.jsx` (hero + `SummaryStats`), sin gráficas y sin
      sidebar. Los `id="inicio"`/`id="inicio-skills"` no se trasladan
      (sin selector CSS dependiente, verificado con grep; la
      navegación pasa a resolverse con `NavLink` en el bloque C).
- [x] Crear `src/pages/TopSkillsPage.jsx` (`TopSkillsChart`).
- [x] Crear `src/pages/TrendsPage.jsx` (`DemandByRoleChart`).
- [x] Crear `src/pages/SalaryPage.jsx` (`SalaryChart`).
- [x] Crear `src/pages/MapPage.jsx` (`EuropeMap`).
- [x] Crear `src/pages/SkillsPage.jsx` (`SkillHeatmap`).
- [x] Eliminar `src/components/layout/MainContent.jsx` (contenido ya
      migrado a las páginas). Referencias residuales en comentarios
      de `index.css`/`SummaryStats.jsx`/`App.jsx` actualizadas a las
      páginas nuevas de paso.
- [x] Envolver `<App />` con `<BrowserRouter>` en `src/main.jsx`.
- [x] `App.jsx`: sustituir el render de `<MainContent />` por
      `<Routes>` con las 6 `<Route>` (imports normales todavía, sin
      `lazy`). `FilterFAB`/`FilterDrawer`/`MobileFilterSheet` se quedan
      montados tal cual por ahora (se retiran/adaptan en el bloque D).
- [x] Verificación manual: `npm run dev` + Playwright headless
      (`chromium-cli` no disponible en este entorno Windows — se usó la
      config ya existente del proyecto, `playwright.config.js`, con
      scripts temporales fuera de `e2e/`, borrados al terminar). Landing
      → "Comenzar" → las 6 rutas, capturas de cada una.
- [x] `npx vitest run` en verde — 400/400, 28/28 archivos (una primera
      pasada tuvo 7 timeouts de arranque de workers, reproducidos de
      forma no determinista por el entorno — la repetición inmediata
      pasó limpia, no relacionado con los cambios de este bloque).

## Bloque B — Code-splitting real

- [x] `TopSkillsChart` (en `TopSkillsPage.jsx`) → `React.lazy()` +
      `Suspense`.
- [x] `DemandByRoleChart` (en `TrendsPage.jsx`) → `React.lazy()` +
      `Suspense`.
- [x] `SalaryChart` (en `SalaryPage.jsx`) → `React.lazy()` +
      `Suspense`.
- [x] `EuropeMap` (en `MapPage.jsx`) → `React.lazy()` + `Suspense`.
- [x] `SkillHeatmap` (en `SkillsPage.jsx`) → `React.lazy()` +
      `Suspense`.
- [x] Fallback de `Suspense` coherente con el skeleton que ya usa
      `ChartCard` durante la carga. Componente nuevo
      `src/components/ui/ChartFallback.jsx`: reutiliza exactamente el
      shell visual del estado "Cargando..." de `ChartCard.jsx` (mismo
      `.chart-card`, `p-5`, `mt-6`, texto), para que no haya salto de
      layout ni cambio de estilo al pasar de "cargando el chunk" a
      "cargando los datos".
- [x] `npm run build`: confirmar chunks separados por gráfica (revisar
      `dist/assets/`) y que el aviso "chunks larger than 500 kB" ya no
      aplica al chunk principal — tamaño real de cada chunk:
      - `TopSkillsChart`: 2.12 kB (gzip 1.23 kB)
      - `DemandByRoleChart`: 21.89 kB (gzip 7.40 kB)
      - `SalaryChart`: 4.87 kB (gzip 2.30 kB)
      - `EuropeMap`: 27.22 kB (gzip 10.81 kB)
      - `SkillHeatmap`: 10.97 kB (gzip 4.20 kB)

      Confirmado: el build ya no emite ningún aviso de tamaño de chunk
      (antes, bundle único de 920.84 kB — ver `roadmap.md`). Las
      dependencias pesadas compartidas entre varias gráficas (Recharts,
      iconos) caen en chunks vendor aparte que Rollup nombra de forma
      algo arbitraria (`useIsDark-*.js` 320.13 kB, `ri-*.js` 161.78 kB)
      — se descargan una sola vez y quedan cacheados entre rutas que
      los necesitan, no en cada navegación. El chunk `index-*.js`
      (entrada + shell de rutas) queda en 325.10 kB — también por
      debajo del umbral de 500 kB.
- [x] Verificación manual (Network tab): al entrar en una ruta, solo se
      descarga el chunk de esa gráfica; `/` no descarga ningún chunk de
      gráfica (portada sin gráficas). Verificado con specs temporales
      de Playwright (borrados tras usar) que acumulan las requests de
      red por ruta visitada: cada navegación añade exactamente un
      chunk nuevo al conjunto ya pedido (`/top-skills` → `TopSkillsChart`;
      `/tendencias` → + `DemandByRoleChart`; `/salarios` → +
      `SalaryChart`; `/mapa` → + `EuropeMap`; `/skills` → +
      `SkillHeatmap`), nunca antes de visitar la ruta correspondiente.
      Verificado también de forma visual (capturas de pantalla, chunk
      artificialmente ralentizado): se ve `ChartFallback` con el mismo
      acabado que el "Cargando..." de `ChartCard`. `npx vitest run`
      sigue en verde (400/400, 28/28 archivos) y `npm run lint` no
      añade ningún error nuevo (los 23 preexistentes son de archivos no
      tocados en este bloque).

## Bloque C — `Header` (md+), `BottomNav` (móvil) y `ThemeToggle`

- [x] Crear `src/components/layout/Header.jsx`: barra superior, **solo
      md+** (`hidden md:flex`), 6 `NavLink` a las rutas, aloja
      `ThemeToggle`. Extraído `ROUTE_ITEMS` a
      `src/config/navigation.js` (fuente única compartida con
      `BottomNav.jsx`, evita duplicar la lista de 6 rutas + iconos en
      dos sitios).
- [x] Montar `Header` en `App.jsx` (fuera de `<Routes>`, visible en
      todas las páginas del dashboard, solo en md+).
- [x] `BottomNav.jsx`: añadidos los ítems "Salarios" (`/salarios`) y
      "Top Skills" (`/top-skills`) → `NAV_ITEMS` pasa de 5 a 7 (Inicio,
      Tendencias, Salarios, Mapa, Skills, Top Skills, Filtros). Los 6
      ítems de ruta pasan de `scrollIntoView` a `NavLink` real (con
      `end` en Inicio para que no quede "activo" en cualquier ruta). El
      ítem "Filtros" no cambia — sigue abriendo `MobileFilterSheet`
      igual que hoy. Padding horizontal reducido (`px-3`→`px-1.5`) para
      que los 7 ítems quepan sin desbordar en pantallas estrechas.
- [x] `HomePage.jsx`: quitado el `ThemeToggle` que vivía hardcodeado
      dentro del hero (y su wrapper `<div>` ahora vacío).
- [x] `App.jsx`: montado un segundo `ThemeToggle`, **solo móvil**
      (`md:hidden`), `position: fixed` (`top-6 right-6 z-30`), visible
      en todas las páginas.
- [x] `App.jsx`: eliminados el `useEffect` del `IntersectionObserver` y
      el estado `activeSection` (ya no se usan; `BottomNav` tampoco
      recibe ya esa prop).
- [x] Verificación manual: `Header` visible solo en desktop/tablet,
      `BottomNav` visible solo en móvil, navegación funcional en
      ambos, tema seleccionable desde cualquier ruta y cualquier
      tamaño de pantalla — verificado con Playwright real en dos
      viewports (1280×800 y 375×667): navegación por Header (3 rutas) y
      por BottomNav (2 rutas) con heading correcto en cada una,
      `ThemeToggle` alterna la clase `dark` de `<html>` en ambas
      variantes, botón "Filtros" del móvil no navega (sigue en la
      misma ruta, abre `MobileFilterSheet`), cero errores de consola en
      ambos. Capturas revisadas.

      `FilterFAB` (`top-4 left-4 z-40`) comparte esquina con la marca
      de `Header`: con ambos montados, la marca "Tech Jobs" queda
      parcialmente tapada por el pill "Filtros". Se mantiene `FilterFAB`
      por delante (`z-40`, igual que `Header`) porque sigue siendo la
      única forma de abrir filtros en desktop hasta que
      `DesktopFilterSidebar` lo sustituya en el bloque D — el solape
      cosmético del texto de marca se acepta mientras tanto y se
      resuelve solo en cuanto el bloque D retire `FilterFAB`.
- [x] `npx vitest run` en verde — 406/406, 29/29 archivos
      (`BottomNav.test.jsx` reescrito a 7 items + `NavLink`/
      `MemoryRouter`; `Header.test.jsx` nuevo). `npm run build` sin
      avisos nuevos. `npm run lint` sin errores nuevos en los archivos
      de este bloque.

## Bloque D — `DesktopFilterSidebar` nuevo (md+); `MobileFilterSheet` intacto (móvil)

> `DesktopFilterSidebar` es un componente **nuevo**, no una reescritura de
> `FilterDrawer.jsx` — reutiliza su contenido pequeño (`FilterSection`
> + cabecera) como referencia visual, no su mecánica de overlay/FAB,
> que ya no aplica a nada. Ver razonamiento completo en `016-plan.md`
> bloque D.

- [x] `src/components/Filters/FilterSheet.jsx` renombrado a
      `MobileFilterSheet.jsx` (función + import en `App.jsx`) — empareja
      con `DesktopFilterSidebar.jsx`, cero cambio de comportamiento.
- [x] Crear `src/components/Filters/DesktopFilterSidebar.jsx` (reutiliza
      `FilterSection.jsx`; props `filters`, `onFilterChange`,
      `onReset`). Estado de colapso local (`useState`), sin `position:
      sticky` (evita competir con el `sticky top-0` de `Header`, que no
      tiene altura fija medible).
- [x] Comportamiento: columna izquierda, **abierta por defecto**,
      colapsable con un icono (`w-72` expandido / `w-16` colapsado,
      `RiMenuFoldLine`/`RiMenuUnfoldLine`, `aria-expanded`/`aria-label`),
      sin overlay/backdrop. El botón "Ver resultados" de `FilterDrawer.jsx`
      no se traslada — existía para cerrar un panel que tapaba
      contenido; este sidebar nunca tapa nada.
- [x] Estilo con tokens Halo ya existentes (`bg-elevated`,
      `border-border`, mismos `FilterChip`/`FilterToggleRow` de
      `FilterSection.jsx`) — mismo lenguaje visual que tenía
      `FilterDrawer.jsx` desde la fase 004, en dark y light. Verificado
      visualmente en ambos temas (capturas revisadas).
- [x] Crear `src/components/layout/ChartPageLayout.jsx` — grid `sidebar
      + contenido` compartido por las 5 páginas.
- [x] `TopSkillsPage.jsx`/`TrendsPage.jsx`/`SalaryPage.jsx`/`MapPage.jsx`/
      `SkillsPage.jsx`: envueltas en `ChartPageLayout` con
      `DesktopFilterSidebar`; ganan las props `onFilterChange`/`onReset`.
- [x] `App.jsx`: eliminado el import y el montaje de `FilterFAB`/
      `FilterDrawer`; las 5 rutas de gráfica pasan también
      `onFilterChange`/`onReset`. `MobileFilterSheet` se queda igual
      (mismo `filtersOpen`/`onOpenFilters` que ya usa `BottomNav`).
- [x] Eliminado `src/components/Filters/FilterDrawer.jsx` (incluye el
      export `FilterFAB`) y su test — verificado sin huérfanos
      (`grep -rn "FilterDrawer\|FilterFAB" src/` → cero resultados fuera
      de comentarios explicativos en `DesktopFilterSidebar.jsx`).
- [x] Corregido de paso: `useEffect` en `App.jsx` que llamaba
      `setIsLoading(false)` de forma síncrona al cumplirse
      `minElapsed && !statsLoading` (patrón detectado por
      `react-hooks/set-state-in-effect`, forzaba un render extra en
      cada actualización). `isLoading` pasa a ser un valor derivado
      (`transitioning && !(minElapsed && !statsLoading)`) calculado en
      cada render en vez de sincronizado con un segundo efecto — mismo
      comportamiento (verificado con Playwright real: el loader aparece
      y desaparece sin quedarse atascado, cero errores de consola), un
      render menos por transición.
- [x] Verificación manual: en cada una de las 5 páginas de gráfica,
      cambiar un filtro dispara una única petición nueva y persiste en
      `localStorage` — verificado con Playwright real (`/tendencias`,
      clic en "Alemania": exactamente 1 petición nueva a
      `/api/jobs/demand-by-role`, `localStorage.dashboard_filters.pais`
      = `"DE"`). Colapsar/expandir verificado en las 5 páginas. `/`
      confirmado sin ningún `<aside>` en el DOM. En móvil, `<aside>`
      sigue en el DOM pero oculto (`hidden md:flex`, mismo patrón que
      el resto del chrome) — `MobileFilterSheet` sigue abriéndose desde
      `BottomNav` exactamente igual.
- [x] `npx vitest run` en verde — 401/401, 30/30 archivos
      (`DesktopFilterSidebar.test.jsx` y `ChartPageLayout.test.jsx`
      nuevos; `FilterDrawer.test.jsx` retirado con el componente;
      `FilterSection.test.jsx` sin cambios). `npm run build`/`npm run
      lint` sin avisos ni errores nuevos (el fix del `useEffect` bajó el
      total de 23 a 22 errores preexistentes).

## Bloque E — Limpieza, extras opcionales, tests, documentación

- [x] Confirmar que no queda código muerto: `grep -rn` de `MainContent`,
      `FilterFAB`, `FilterDrawer`, `IntersectionObserver`, `activeSection`
      en `src/` → sin resultados fuera de código no relacionado (el
      `IntersectionObserver` que queda es el de `DecryptedText.jsx`, un
      efecto de texto en hover sin relación con navegación) y comentarios
      explicativos ya revisados en `DesktopFilterSidebar.jsx`. Comentarios
      residuales que mencionaban `MainContent.jsx` en
      `LandingPage.test.jsx` actualizados a `HomePage.jsx`.
- [x] **Opcional:** prefetch del chunk de una ruta al hacer hover sobre
      su link del header. `ROUTE_ITEMS` (`navigation.js`) gana un campo
      `prefetch` por ruta (mismo `import()` dinámico que usa
      `React.lazy()` para esa gráfica); `Header.jsx` lo dispara en
      `onMouseEnter`. Verificado con Playwright real: hacer hover sobre
      "Tendencias" sin hacer click dispara la request del chunk de
      `DemandByRoleChart`, y la URL sigue en "/".
- [x] **Opcional, omitido:** `startTransition` envolviendo la navegación.
      `NavLink` gestiona la navegación internamente (modo declarativo,
      sin `data router`) — envolverla en `startTransition` de verdad
      exige interceptar el click y navegar con `useNavigate()` a mano,
      perdiendo sin cuidado extra la semántica nativa de `<a>` (abrir en
      pestaña nueva con click central/Ctrl, etc.). Sin un problema real
      medido (el coste de pintar Recharts/D3 en las gráficas de este
      proyecto no se ha observado como perceptible), no se justifica el
      riesgo — mismo criterio que "no cambiar algo porque sí" de
      `016-spec.md`. Queda como candidato futuro si se mide un problema real.
- [x] Reescrito `e2e/dashboard.spec.js`: tests 5, 6 y 7 (evolución
      mensual, salario, heatmap) pasan de `scrollIntoViewIfNeeded()` a
      `page.goto()` a su ruta propia; test 4 (Top Skills) navega a
      `/top-skills` antes de comprobar el heading; tests 8 y 9 (filtros)
      reescritos por completo para `DesktopFilterSidebar`
      (`page.getByLabel("Filtros de la gráfica")` en vez del selector
      CSS frágil `div.fixed.top-4.left-4` del FAB, comprobando el badge
      numérico en vez del anillo `.animate-ping`); test 10 (tema) escopa
      el `ThemeToggle` a `header` para evitar un choque de "strict mode"
      con el montaje flotante móvil (mismo componente montado dos veces
      a la vez). Los tests 1-3 (landing, sessionStorage, KPIs) no
      necesitaron cambios.
- [x] Actualizado `spec/constitution/tech-stack.md`: `src/pages/`,
      `Header.jsx`, `ChartPageLayout.jsx`, `DesktopFilterSidebar.jsx`,
      `MobileFilterSheet.jsx`, `ChartFallback.jsx`, `navigation.js`
      documentados; `MainContent.jsx`/`FilterFAB`/`FilterDrawer.jsx`
      retirados de la lista; árbol de carpetas actualizado (`pages/`
      nuevo); nota de que `ThemeToggle` vive en `Header` (md+) y
      flotante en móvil, ya no en el hero; `react-router-dom` añadido a
      "Tecnologías".
- [x] Revisado `spec/constitution/mission.md`: la frase sobre el toggle
      en el hero que había que actualizar en realidad vivía en
      `tech-stack.md` (ya corregida ahí) — verificado con grep que
      `mission.md` no menciona "toggle" ni "hero" en ningún sitio, así
      que no necesitaba ningún cambio.
- [x] `npx vitest run` al 100% — 401/401, 30/30 archivos.
- [x] `npm run build` sin errores ni avisos nuevos.
- [x] `npx playwright test` en verde — 11/11 (una primera pasada tuvo 1
      timeout en el primer test del archivo, reproducido de forma no
      determinista por el entorno — mismo patrón de flakiness ya visto
      con vitest en el bloque A; la repetición inmediata pasó limpia,
      no relacionado con los cambios de este bloque).
- [x] `.env.local` nunca leído ni impreso — verificado con grep, sin
      resultados.

## Cierre

- [x] Validado contra todos los criterios de aceptación de
      `016-spec.md` — todos cumplidos (incluidos los dos opcionales:
      prefetch en hover implementado, `startTransition` evaluado y
      omitido con su razón documentada).
- [x] Movida la feature 016 a "Hecho" en `spec/constitution/roadmap.md`,
      con el resumen real de lo implementado (mismo formato que las
      features anteriores). Sección "En curso 🔜" retirada (queda
      vacía hasta que empiece la siguiente feature de la fase 3).
- [ ] Presentar resumen de cambios al usuario y esperar aprobación
      explícita antes de `git commit`/`git push` (`AGENTS.md`).
