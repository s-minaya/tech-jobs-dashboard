# 016 · Setup de rutas por gráfica + header de navegación — Plan

## Mapa de rutas → contenido → componentes

| Ruta | Contenido | Chunk lazy | Sidebar de filtros (md+) |
|---|---|---|---|
| `/` | Hero (DarkVeil/Aurora + título) + KPIs (`SummaryStats`) | — | No |
| `/top-skills` | `TopSkillsChart` | `TopSkillsChart` | Sí |
| `/tendencias` | `DemandByRoleChart` | `DemandByRoleChart` | Sí |
| `/salarios` | `SalaryChart` | `SalaryChart` | Sí |
| `/mapa` | `EuropeMap` | `EuropeMap` | Sí |
| `/skills` | `SkillHeatmap` | `SkillHeatmap` | Sí |

La landing (`LandingPage.jsx`, congelada) **no** es una ruta — sigue
gateada por `sessionStorage`/`showLanding` en `App.jsx`, fuera del
router, exactamente como hoy. `/` es la home del *dashboard* (antes
sección `id="inicio"` de `MainContent.jsx`), no la landing de marketing.

### Chrome de navegación — dos sistemas completamente separados por breakpoint

No es un único componente respondiendo a media queries — son **dos
implementaciones distintas**, cada una montada siempre en el DOM y
mostrada/ocultada por CSS (mismo patrón que ya usa hoy el proyecto para
`FilterFAB`/`FilterDrawer` vs. `MobileFilterSheet`: `hidden md:flex` /
`md:hidden`, sin JS de por medio):

| | Móvil (<768px) | Tablet/Desktop (≥768px) |
|---|---|---|
| Navegación entre rutas | `BottomNav` (ya existe, se adapta) | `Header` (nuevo) |
| Filtros | `MobileFilterSheet` (ya existe, **sin cambios de comportamiento**) | `DesktopFilterSidebar` (nuevo) |
| `ThemeToggle` | Flotante, en cada página, misma posición que hoy | Dentro de `Header` |

## Enfoque

Cambio estructural en capas, de dentro hacia fuera, para poder validar
cada capa con `npx vitest run`/`npm run build` antes de montar la
siguiente:

1. Router + páginas (esqueleto navegable, sin lazy todavía).
2. Code-splitting (`React.lazy`/`Suspense`) sobre el esqueleto ya
   navegable.
3. `Header` (solo md+) + adaptación de `BottomNav` (solo móvil) +
   reubicación de `ThemeToggle`.
4. `DesktopFilterSidebar` nuevo (solo md+, en las 5 páginas de gráfica);
   `MobileFilterSheet` se mantiene intacto para móvil; `FilterFAB` y
   `FilterDrawer.jsx` se retiran (nada los usa ya: el FAB desaparece y
   ningún breakpoint necesita ya un panel oculto-por-defecto disparado
   desde fuera).
5. Limpieza (código muerto: `IntersectionObserver` de `App.jsx`,
   `MainContent.jsx`, `FilterFAB`, `FilterDrawer.jsx`) + extras
   opcionales (prefetch, `startTransition`) + tests + documentación.

## Implementación

### Bloque A — Dependencia + esqueleto de rutas

1. `npm install react-router-dom` (última estable, `^7`, compatible con
   React 19 — modo declarativo clásico: `BrowserRouter`/`Routes`/`Route`,
   sin adoptar el modo "data router" con loaders/actions, que no encaja
   con el patrón actual de `useChartData` y añadiría complejidad sin
   beneficio aquí).
2. Crear `src/pages/` (carpeta nueva) con un componente por ruta:
   - `HomePage.jsx` — contenido movido de `MainContent.jsx` (hero +
     `SummaryStats`), sin ninguna gráfica y **sin** sidebar.
   - `TopSkillsPage.jsx` — `TopSkillsChart` + `DesktopFilterSidebar`.
   - `TrendsPage.jsx` — `DemandByRoleChart` + `DesktopFilterSidebar`.
   - `SalaryPage.jsx` — `SalaryChart` + `DesktopFilterSidebar`.
   - `MapPage.jsx` — `EuropeMap` + `DesktopFilterSidebar`.
   - `SkillsPage.jsx` — `SkillHeatmap` + `DesktopFilterSidebar`.
   `MainContent.jsx` se elimina (su contenido pasa a `HomePage.jsx`/
   `TopSkillsPage.jsx`; el grid que agrupaba las 5 gráficas desaparece,
   cada una vive en su página).
3. Envolver `<App />` con `<BrowserRouter>` en `src/main.jsx`.
4. Dentro de `App.jsx`, sustituir el bloque `<MainContent />` por
   `<Routes>` con las 6 `<Route>` (sin lazy todavía, import normal) —
   se mantiene todo lo demás igual (landing gate, `FilterFAB`/`Drawer`/
   `Sheet` **todavía presentes** en este bloque, se retiran/adaptan en
   el bloque D).
5. Verificar: navegar manualmente entre las 6 rutas en `npm run dev`,
   cada página muestra su contenido, `npx vitest run` sigue en verde.

### Bloque B — Code-splitting real

1. Sustituir el `import` estático de cada gráfica dentro de su página
   (`src/pages/*.jsx`) por `React.lazy(() => import(...))`.
2. Envolver el `<Route element={...}>` de cada página (o el contenido
   lazy dentro de la página) en `<Suspense fallback={...}>`. Fallback
   simple y consistente (ej. el mismo spinner/skeleton que ya usa
   `ChartCard` en su estado de carga) — es una ventana muy corta
   (descarga del chunk JS, típicamente unas decenas/cientos de KB),
   distinta del `loading` interno de `useChartData` (que sigue
   cubriendo la carga de datos una vez el chunk ya está descargado).
3. Verificar con `npm run build`: chunks separados por gráfica en vez
   de un único bundle de +900 kB — comprobar la lista de `dist/assets/`
   y que el aviso de Vite ("chunks larger than 500 kB") ya no aplica al
   chunk principal.
4. Verificar con las devtools (pestaña Network, filtrando JS) que solo
   se descarga el chunk de la ruta visitada, no los 5 de golpe.

### Bloque C — `Header` (md+), `BottomNav` (móvil) y `ThemeToggle`

1. `src/components/layout/Header.jsx` (nuevo) — barra superior, **solo
   md+** (`hidden md:flex`), con 6 `NavLink` a las rutas (usa el estado
   `isActive` nativo de `NavLink`, sustituye por completo al
   `IntersectionObserver` de `App.jsx`, que se borra) y aloja
   `ThemeToggle`.
2. `BottomNav.jsx` — se adapta, no se reescribe:
   - `NAV_ITEMS` gana dos ítems nuevos, "Salarios" (`/salarios`) y "Top
     Skills" (`/top-skills`) → pasa de 5 a 7 items (Inicio, Tendencias,
     Salarios, Mapa, Skills, Top Skills, Filtros).
   - Los 6 items de ruta pasan de `scrollIntoView` a `NavLink` real.
   - El ítem "Filtros" **no cambia de comportamiento** — sigue abriendo
     `MobileFilterSheet` exactamente como hoy, disponible en cualquier
     página (incluida `/`, igual que ahora).
3. `ThemeToggle` — dos puntos de montaje, mismo patrón CSS
   mostrar/ocultar que el resto del chrome (no dos componentes, la
   misma `<ThemeToggle isDark={isDark} onToggle={toggleTheme} />`
   renderizada dos veces):
   - Dentro de `Header` (md+) — dentro del bloque 1.
   - Un segundo montaje en `App.jsx`, **solo móvil** (`md:hidden`),
     `position: fixed` (no `absolute` como hoy, porque debe verse en
     cualquier ruta, no solo dentro del contenedor del hero) en la
     misma esquina donde vive hoy, visible en todas las páginas.
   - `HomePage.jsx` dejará de renderizar su propio `ThemeToggle`
     "hardcodeado" dentro del hero — los dos montajes de arriba lo
     cubren en todos los breakpoints.
4. `App.jsx`: se borra el `useEffect` del `IntersectionObserver` y el
   estado `activeSection` (ya no hace falta, `NavLink` resuelve la ruta
   activa solo).
5. Verificar: `Header` visible solo en desktop/tablet, `BottomNav`
   visible solo en móvil, navegación funcional en ambos, tema
   seleccionable desde cualquier ruta en cualquier tamaño de pantalla.

### Bloque D — `DesktopFilterSidebar` nuevo (md+); `MobileFilterSheet` intacto (móvil); `FilterDrawer`/`FilterFAB` se retiran

`DesktopFilterSidebar` **no es una reescritura de `FilterDrawer.jsx`** — es un
componente nuevo. Lo que hace `FilterDrawer.jsx` hoy que de verdad
tiene valor reutilizable es pequeño: el bucle que renderiza
`FilterSection` por cada filtro + la cabecera con "Resetear". El resto
del archivo — posición `fixed`, overlay con `backdrop-blur`,
`transform: translateX` para el slide-in, el contrato `isOpen`/`onClose`
atado a un FAB externo — es exactamente la mecánica de "panel oculto
que aparece flotando sobre el contenido al pulsar un botón externo",
que ya no aplica a nada: no hay FAB, y el nuevo sidebar no flota sobre
el contenido, vive siempre en el layout de la página. Mantener el
nombre/archivo `FilterDrawer.jsx` para eso sería confuso (ya no es "un
drawer"). Se construye `DesktopFilterSidebar.jsx` nuevo, usando esa cabecera +
bucle de `FilterDrawer.jsx` como referencia visual directa (mismo
look), y `FilterDrawer.jsx` se borra una vez `DesktopFilterSidebar` cubre las
5 páginas — no queda huérfano ni duplicado.

1. `src/components/Filters/DesktopFilterSidebar.jsx` (nuevo) — reutiliza
   `FilterSection.jsx` tal cual (no se toca) para las 6 secciones de
   filtro (`FILTERS` de `src/config/filters.js`). Props: `filters`,
   `onFilterChange`, `onReset`.
2. Comportamiento y estilo:
   - Columna en el lateral izquierdo, **abierta por defecto**.
   - Colapsable/cerrable al pulsar un icono (posición exacta del icono,
     ancho colapsado/expandido, curva de animación — con margen para
     ajustar, no un contrato cerrado).
   - Sin overlay ni backdrop — es parte del layout de la página, no
     flota encima del contenido.
   - Solo en las 5 páginas de gráfica; `/` sigue sin ella.
   - **Estilo: Halo, dark + light, reutilizando lo que ya existe** — no
     se deja sin estilizar a la espera de un diseño desde cero. Se
     reutilizan los mismos tokens que ya usa `FilterDrawer.jsx` hoy
     (`bg-elevated`, `border-border`, radios `--radius-*`) y los
     mismos subcomponentes de `FilterSection.jsx` (`FilterChip`,
     `FilterToggleRow`, sin tocar) — ambos ya pasaron por Halo en la
     fase 004 (`spec/features/004-halo-filters/`), así que no hay
     paleta que inventar, solo reacomodar ese mismo lenguaje visual en
     el layout de columna nuevo. Se intenta un acabado real en las dos
     variantes de tema; si no convence, el usuario lo ajusta desde ahí
     en vez de desde cero.
3. `src/components/layout/ChartPageLayout.jsx` (nuevo, opcional) —
   wrapper compartido por las 5 páginas de gráfica si conviene evitar
   repetir el mismo grid `sidebar + contenido` 5 veces.
4. `MobileFilterSheet.jsx` — **sin cambios de comportamiento.** Sigue
   controlada por el mismo `filtersOpen`/`onOpenFilters` que hoy,
   ahora vía `BottomNav` en cualquier página (móvil no tiene páginas
   con/sin sidebar — es un mecanismo global, como ya es hoy).
5. Eliminar `FilterFAB` y `FilterDrawer.jsx` (incluye el export
   `FilterFAB`) y sus usos en `App.jsx`.
6. Verificar: en cada una de las 5 páginas de gráfica, cambiar un
   filtro dispara una única petición nueva (no 5), el valor persiste en
   `localStorage` y se refleja también en `/` al volver (mismo
   `filters` compartido) — tanto desde `DesktopFilterSidebar` (md+) como desde
   `MobileFilterSheet` (móvil).

### Bloque E — Limpieza, extras opcionales, tests, documentación

1. Confirmar que no queda código muerto: `MainContent.jsx`, `FilterFAB`,
   `FilterDrawer.jsx`, el `IntersectionObserver` y `activeSection` de
   `App.jsx`. `MobileFilterSheet.jsx` **no** entra en esta lista — se
   mantiene sin cambios.
2. **Opcional:** prefetch del chunk de una ruta al hacer hover sobre su
   link del header (`onMouseEnter` disparando el mismo `import()`
   dinámico usado por `React.lazy`).
3. **Opcional:** `startTransition` (React 19) envolviendo la navegación
   del header/`BottomNav`.
4. Tests unitarios: crear `DesktopFilterSidebar.test.jsx` (nuevo) y
   `Header.test.jsx` (nuevo); retirar `FilterDrawer.test.jsx` (el
   componente desaparece); actualizar `BottomNav.test.jsx` a la nueva
   mecánica de `NavLink` + 6 items. `FilterSection.test.jsx` no debería
   necesitar cambios (el componente no se toca).
   `MobileFilterSheet.jsx` no tiene test hoy — no hace falta crearlo solo por
   esta feature (no cambia su comportamiento).
5. E2E (`e2e/dashboard.spec.js`): reescribir los tests que interactúan
   con el FAB/drawer desktop (líneas 171-210 aprox.) para el nuevo flujo
   (navegar a una página de gráfica → usar `DesktopFilterSidebar`); los tests
   que hacen `scrollIntoViewIfNeeded()` sobre headings pasan a
   navegación por ruta. Los flujos de móvil (`MobileFilterSheet` vía
   `BottomNav`) deberían necesitar cambios mínimos, si acaso ninguno.
6. Documentación: actualizar `spec/constitution/tech-stack.md` (carpeta
   `pages/`, `Header.jsx`, `DesktopFilterSidebar.jsx`, `ChartPageLayout.jsx`
   nuevos; `MainContent.jsx`/`FilterFAB`/`FilterDrawer.jsx` retirados;
   `MobileFilterSheet.jsx` sin cambios; nota de que `ThemeToggle` vive en
   `Header` en md+ y flotante en móvil, ya no en el hero) y
   `spec/constitution/mission.md` (la frase *"El toggle dark/light se
   mantiene en el hero del dashboard"* queda desactualizada, se
   sustituye por la ubicación real) y `spec/constitution/roadmap.md`
   (mover 016 a "Hecho" al cerrar).
7. `npx vitest run` al 100%, `npm run build` sin errores, `npx
   playwright test` en verde.

## Decisiones

- **`react-router-dom` en modo declarativo clásico** (`BrowserRouter`),
  no el modo "data router" (`createBrowserRouter` + loaders/actions) —
  esta app no necesita SSR ni loaders; adoptar ese modo obligaría a
  migrar `useChartData`/`useHeatmapData` a una API distinta sin ninguna
  ganancia real aquí.
- **La landing se queda fuera del router**, como hoy — es un gate de
  sessionStorage sobre una zona congelada, no una página navegable con
  URL propia; meterla en el router sería tocar `src/components/landing/`
  sin necesidad.
- **Móvil y desktop/tablet usan sistemas de navegación y de filtros
  completamente separados**, no un único componente responsive: en
  móvil, `BottomNav` (adaptado, +Salarios) y `MobileFilterSheet` (sin
  cambios) siguen resolviendo ambos trabajos, igual que hoy — no hace
  falta `Header` ahí. En md+, `Header` (nuevo) y `DesktopFilterSidebar` (nuevo)
  los sustituyen.
- **`DesktopFilterSidebar` es un componente nuevo, no una reescritura de
  `FilterDrawer.jsx`** — ver la explicación al principio del bloque D.
  Se reutiliza el contenido pequeño y genuinamente reutilizable
  (`FilterSection` + cabecera), no el archivo completo; `FilterDrawer.jsx`
  se retira una vez `DesktopFilterSidebar` lo sustituye, igual que `FilterFAB`.
- **`MobileFilterSheet.jsx` no se toca** — confirmado explícitamente: el
  patrón de móvil (bottom sheet con gesto de arrastre, abierto desde
  `BottomNav`) sigue vigente sin cambios de comportamiento.
- **`ThemeToggle` sale del hero por completo** — vive en `Header` en
  md+, y como montaje flotante independiente en móvil (visible en
  cualquier página, no solo `/`). `mission.md`/`tech-stack.md` se
  actualizan para reflejar la ubicación real (bloque E). El componente
  `ThemeToggle.jsx` no se toca ni se elimina, solo cambia dónde y
  cuántas veces se monta — cumple `AGENTS.md` ("no eliminar
  ThemeToggle").
- **Mecánica fina del colapso de `DesktopFilterSidebar`** (ancho exacto,
  posición del icono, curva de animación) — con margen para ajustarla
  después; lo fijo a nivel funcional es "columna izquierda, abierta por
  defecto, colapsable, sin overlay" — la mecánica concreta de
  interacción queda abierta. El **estilo visual** (color, borde,
  radios, tipografía) **sí se intenta en serio desde ahora** —
  reutilizando los tokens Halo que `FilterDrawer.jsx`/`FilterSection.jsx`
  ya usan (fase 004), en dark y light, en vez de dejarlo sin estilizar
  a la espera de un diseño desde cero: es un sistema ya existente y ya
  aprobado, no una mecánica de interacción nueva.
- **`ChartPageLayout` como wrapper compartido** — las 5 páginas de
  gráfica repetirían el mismo grid `sidebar + contenido` si no se
  extrae; un componente compartido respeta "un componente, una
  responsabilidad" (`tech-stack.md`).
- **`/` sin sidebar ni acceso a filtros propio en md+** — consecuencia
  explícita y aceptada de "no habrá sidebar en la home". `/` no tiene
  ninguna gráfica que filtrar, así que no hace falta sidebar ahí. En
  desktop/tablet el usuario ajusta filtros desde cualquier página de
  gráfica (las 5, `filters` es estado compartido por encima del
  router). En móvil esto no aplica — `BottomNav`/`MobileFilterSheet`
  siguen disponibles en `/` igual que hoy, es un mecanismo global, no
  por página.
- **Filtros no se sincronizan con la URL en esta feature** — se quedan
  en `localStorage` como hoy; es un cambio de alcance mayor (rutas
  "compartibles" con su estado) que no se ha pedido y no bloquea
  ninguno de los dos problemas reales que motivan esta feature (bundle,
  peticiones simultáneas).

## Riesgos

- **Cambiar de ruta durante una petición lenta** — ya cubierto por el
  `AbortController` existente en `useChartData`/`useHeatmapData`
  (fases 010/015), pero se verifica explícitamente con una gráfica
  lenta real (`SalaryChart`/`skills/cooccurrence`) durante el bloque B,
  no se asume solo por lectura de código.
- **Chunk de `EuropeMap`** (D3 + topojson) puede seguir siendo grande
  en solitario al separarlo — aceptable: el objetivo no es que cada
  chunk sea diminuto, es que no se descarguen los 5 de golpe. Se
  documenta el tamaño real de cada chunk tras el bloque B en
  `016-tasks.md`, no se fija un umbral arbitrario de antemano.
- **`BottomNav` con 7 elementos en pantallas muy estrechas** (6 rutas +
  Filtros) — puede quedar apretado; el ajuste fino de tamaños/iconos es
  parte del diseño visual que hace el usuario aparte, no bloquea la
  funcionalidad.
- **Tests E2E son los que más cambian** (interactúan hoy directamente
  con el FAB/drawer desktop) — mitigación: se reescriben en el bloque
  E, no se parchean a medias; si algo queda pendiente se documenta
  explícitamente en el cierre, no se deja un test en verde falso.
