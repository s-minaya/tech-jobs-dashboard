# 016 · Setup de rutas por gráfica + header de navegación

**Estado:** en curso — implementación en progreso (bloques A y B
completados). El bloque B incorporó una ruta nueva, `/top-skills`, tras
feedback del usuario: `TopSkillsChart` sale de `/` y pasa a tener
página propia con `DesktopFilterSidebar` (bloque D), igual que las
demás gráficas — `/` se queda como portada sin ninguna gráfica (hero +
KPIs). Este documento ya refleja las 6 rutas finales, no las 5
originales.

> Primera feature de la **fase 3** del roadmap general (rediseño total
> de la página para optimizar velocidad y experiencia de usuario). La
> fase 2 de auditorías "tabla por tabla" cerró con la 015
> (`spec/constitution/roadmap.md`). Esta feature sienta la base
> estructural de toda la fase 3: cada gráfica pasa a vivir en su propia
> ruta, con code-splitting real por ruta y navegación nueva. El resto de
> la fase 3 (rediseño visual/UX del contenido de cada ruta) se apoya en
> esta base y se numera a medida que se planifica. "Halo Responsive y
> Pulido" (backlog, antes etiquetada 016) pasa a ser la última feature
> de todo el proyecto, sin número fijo todavía — se numerará cuando se
> sepa cuántas features suma la fase 3 completa, para no tener que
> reescribirla cada vez que se añada una feature nueva antes.

## Contexto

Hoy el dashboard es una sola página con scroll (`App.jsx` →
`MainContent.jsx`), dividida en 4 secciones ancladas por `id`
(`inicio`, `tendencias`, `mapa`, `skills`) que `BottomNav.jsx` recorre
con `scrollIntoView` y que `App.jsx` detecta con un `IntersectionObserver`
para resaltar el item activo — no existe ningún router; `react-router-dom`
no está instalado (verificado en `package.json`).

Las 5 gráficas (`TopSkillsChart`, `DemandByRoleChart`, `SalaryChart`,
`EuropeMap`, `SkillHeatmap`) están todas montadas en el DOM desde que
carga el dashboard, repartidas así:

| Sección (`id`) | Gráficas |
|---|---|
| `inicio` | Hero + KPIs (`SummaryStats`) + `TopSkillsChart` |
| `tendencias` | `DemandByRoleChart` + `SalaryChart` |
| `mapa` | `EuropeMap` |
| `skills` | `SkillHeatmap` |

Dos problemas reales y ya documentados, no solo "mejor rendimiento" en
abstracto:

1. **Bundle sin dividir.** `npm run build` (ejecutado en esta misma
   sesión) emite un único chunk de **920.84 kB** (285.31 kB gzip) y el
   aviso nativo de Vite: *"Some chunks are larger than 500 kB after
   minification"*. Las 5 gráficas (Recharts + D3 + lógica propia) se
   descargan de golpe al cargar la página, se usen o no en esa visita.
2. **5 peticiones simultáneas contra una BD que ya sabemos que va
   justa de recursos.** Al montar, las 5 gráficas disparan su fetch a
   la vez vía `useChartData`. En la fase 010
   (`spec/features/010-salary-chart-quality/010-spec.md`) esto llegó a
   agotar el pool de conexiones de Postgres en producción de verdad
   (*"unable to check out connection from the pool after 15000ms"*,
   comentario todavía presente en `useChartData.js:18-23`). Con rutas,
   solo la sección visitada pide sus datos — de 5 peticiones
   simultáneas a 1.

`filters` (`useFilters.js`, persistido en `localStorage` bajo
`dashboard_filters`) y `useSummaryStats` (KPIs del hero, con
deduplicación de petición en vuelo a nivel de módulo, fase 014) ya viven
en `App.jsx`, por encima de `MainContent` — un nivel más arriba que
cualquier ruta futura, así que no hace falta moverlos, solo no
bajarlos dentro del árbol de rutas.

`useChartData.js` (fase 010) y `useHeatmapData.js` (fase 015) ya
cancelan con `AbortController` la petición en curso al desmontar su
componente — con rutas, "desmontar" pasa a incluir también "el usuario
navegó a otra ruta antes de que la query lenta terminara". El mecanismo
ya existe y no necesita cambios para cubrir este caso nuevo.

## Qué hace (alcance de esta feature)

1. **Instala `react-router-dom`** — única dependencia nueva de esta
   feature, aprobada explícitamente por el usuario en la conversación
   que originó esta spec (`AGENTS.md`: *"No añadir dependencias sin
   confirmación explícita"*). Es la librería estándar de rutas para
   React y encaja con el tamaño de esta app — sin alternativas a
   evaluar.
2. **Introduce un router en el árbol de `App.jsx`**, con una ruta por
   grupo de gráficas — mismos grupos que ya existen como secciones (con
   `SalaryChart` y `TopSkillsChart` separados en su propia ruta cada
   una), no se inventa contenido nuevo, solo se resegmenta el
   existente:
   - `/` → hero + KPIs (sin gráficas)
   - `/top-skills` → `TopSkillsChart`
   - `/tendencias` → `DemandByRoleChart`
   - `/salarios` → `SalaryChart`
   - `/mapa` → `EuropeMap`
   - `/skills` → `SkillHeatmap`

   `TopSkillsChart` vivía en `/` en el diseño original de esta feature;
   se movió a su propia ruta porque `/` no lleva sidebar de filtros en
   tablet/desktop (ver más abajo) — dejarla en `/` la habría dejado sin
   ningún control de filtro propio ahí. Con ruta propia, participa del
   mismo patrón que el resto de gráficas: `DesktopFilterSidebar` en
   tablet/desktop (bloque D), filtros vía `BottomNav`/`MobileFilterSheet`
   en móvil.

   La landing (`LandingPage.jsx`, congelada) se queda **fuera** del
   router, exactamente como hoy (gateada por `sessionStorage` en
   `App.jsx`) — no confundir con `/`, que es la home del *dashboard*,
   no la landing de marketing.
3. **Code-splitting real por ruta** — cada gráfica se importa con
   `React.lazy()` + `Suspense`, con un fallback de carga coherente con
   los skeletons que ya usa `ChartCard`. Verificable con
   `npm run build`: chunks separados en vez de un único bundle de
   +900 kB.
4. **`filters` y `useSummaryStats` se quedan por encima del árbol de
   rutas** — no se remontan ni vuelven a pedir datos al cambiar de
   sección.
5. **Móvil y tablet/desktop usan sistemas de navegación y de filtros
   completamente separados** (no un único componente respondiendo a
   media queries):

   | | Móvil (<768px) | Tablet/Desktop (≥768px) |
   |---|---|---|
   | Navegación | `BottomNav` (ya existe, se adapta a `NavLink` real; gana el ítem "Salarios", que hoy no existe) | `Header` nuevo, con enlaces a las 5 rutas |
   | Filtros | `MobileFilterSheet` (ya existe, **sin cambios de comportamiento** — sigue abriéndose desde el ítem "Filtros" de `BottomNav`, en cualquier página) | `DesktopFilterSidebar` nuevo — columna izquierda, **abierta por defecto**, colapsable con un icono, sin overlay; solo en las 5 páginas de gráfica, no en `/` |
   | `ThemeToggle` | Montaje flotante independiente, visible en cualquier página | Dentro de `Header` |

   `DesktopFilterSidebar` es un componente **nuevo** — no una reescritura de
   `FilterDrawer.jsx`. Lo único de `FilterDrawer.jsx` con valor
   reutilizable es pequeño (el bucle de `FilterSection` + la cabecera);
   el resto de ese archivo es la mecánica de "panel oculto que aparece
   flotando al pulsar un botón externo" (overlay, `transform`
   slide-in, `isOpen`/`onClose` atado al FAB), que no aplica a nada una
   vez que el FAB desaparece y el sidebar nuevo vive siempre en el
   layout de la página, sin flotar sobre el contenido. `FilterDrawer.jsx`
   y `FilterFAB` se retiran una vez `DesktopFilterSidebar` los sustituye.
6. **El diseño visual exacto** (colores, espaciado, mecánica fina del
   colapso del sidebar) lo hace el usuario aparte — esta spec fija el
   comportamiento (qué existe, dónde, con qué datos), no el pixel a
   pixel.
7. **Deseable, no bloqueante:** precarga del chunk de una ruta al hacer
   hover sobre su link del header.
8. **Deseable, no bloqueante:** `startTransition` (React 19) al
   navegar entre rutas, para que el clic no se sienta congelado
   mientras Recharts/D3 pintan la gráfica de destino.

## Por qué

Mismo criterio que toda la fase 2: no cambiar algo "porque sí", sino
porque ataca un problema real y ya medido. Aquí React (bien usado)
resuelve los dos problemas de la sección "Contexto" — bundle sin
dividir y 5 peticiones simultáneas contra una BD que ya demostró poder
agotar su pool de conexiones — no solo "mejora el rendimiento" en
abstracto. La reducción de peticiones simultáneas es la ganancia mayor
de las dos: ataca un bug que ya ocurrió en producción, no solo un
aviso de build.

## Decisiones ya tomadas (no se reabren en plan.md)

- `react-router-dom` como librería de rutas, modo declarativo clásico.
- `filters` y `useSummaryStats` viven por encima del árbol de rutas.
- Cada grupo de gráficas = su propia ruta + su propio chunk `lazy`.
- Las 6 rutas (`/`, `/top-skills`, `/tendencias`, `/salarios`, `/mapa`,
  `/skills`) cubren los mismos grupos de contenido que las 4 secciones
  actuales, con `SalaryChart` separado de `DemandByRoleChart` y
  `TopSkillsChart` separado de `/` en su propia ruta cada una. `/` se
  queda como portada sin ninguna gráfica (hero + KPIs).
- La landing se queda fuera del árbol de rutas, exactamente como hoy.
- **Móvil no lleva `Header` ni el sidebar nuevo** — `BottomNav`
  (adaptado, +Salarios) y `MobileFilterSheet` (intacto) siguen resolviendo
  navegación y filtros ahí, igual que hoy.
- **Tablet/desktop llevan `Header` + `DesktopFilterSidebar`** (ambos nuevos).
  `FilterFAB` y `FilterDrawer.jsx` se retiran — nada los usa ya.
- `ThemeToggle` sale del hero: vive en `Header` (md+) y como montaje
  flotante independiente en móvil (visible en cualquier página, no
  solo `/`). El componente `ThemeToggle.jsx` no se toca ni se elimina,
  solo cambia dónde se monta (`AGENTS.md`: no eliminar `ThemeToggle`).
- `/` no lleva `DesktopFilterSidebar` en tablet/desktop (consecuencia de "no
  habrá sidebar en la home"); en móvil esto no aplica —
  `BottomNav`/`MobileFilterSheet` son un mecanismo global, disponible en
  cualquier página incluida `/`, igual que hoy.

## Fuera de alcance

- Rediseño visual del contenido de cada gráfica/página — corresponde a
  features posteriores de la fase 3, a definir después de cerrar esta.
- El diseño pixel a pixel del `Header` y de `DesktopFilterSidebar` — esta
  feature fija su función (navegación por rutas, code-splitting,
  prefetch en hover, filtros funcionando en las 4 páginas de gráfica),
  el detalle visual final lo hace el usuario aparte, dentro de Halo.
- Sincronizar filtros con query params de la URL — se queda en
  `localStorage` como hoy; queda como candidato futuro, no bloqueante
  para esta feature.
- Tocar `src/components/landing/` — sigue congelada, sin excepción en
  esta feature. El router de esta feature no incluye la landing.
- Cualquier gráfica o sección de datos nueva — `mission.md`: *"No se
  añaden nuevas secciones de datos en este ciclo de rediseño."*
- Backend (`api/`) — el problema de las 5 peticiones simultáneas se
  resuelve reduciendo cuántas rutas están montadas a la vez en el
  frontend, no tocando queries ni el pool de conexiones en `api/`.
- "Halo Responsive y Pulido" (backlog) — sigue sin número fijo, al
  final de todo el proyecto, después del resto de la fase 3.

## Criterios de aceptación

- [ ] `react-router-dom` instalado y usado para las 6 rutas del
      dashboard (`/`, `/top-skills`, `/tendencias`, `/salarios`,
      `/mapa`, `/skills`). La landing (`LandingPage.jsx`) se queda
      fuera del árbol de rutas, sin cambios.
- [ ] Cada gráfica (`TopSkillsChart`, `SalaryChart`,
      `DemandByRoleChart`, `EuropeMap`, `SkillHeatmap`) se importa con
      `React.lazy()` + `Suspense`, generando su propio chunk —
      verificado con `npm run build` (chunks separados, no un único
      bundle de +900 kB).
- [ ] Al entrar en una ruta, solo se disparan las peticiones de datos
      de las gráficas de esa ruta — verificado que ya no hay 5
      peticiones simultáneas al cargar el dashboard.
- [ ] `filters` y `useSummaryStats` no se remontan ni vuelven a pedir
      datos al cambiar de ruta.
- [ ] `useChartData`/`useHeatmapData` cancelan (`AbortController`) la
      petición en curso si el usuario cambia de ruta antes de que
      resuelva — mismo mecanismo ya existente para cambios de filtro,
      sin duplicar lógica.
- [ ] `Header` (nuevo, solo md+) navega entre las 6 rutas. `BottomNav`
      (solo móvil) pasa de scroll + anclas a la misma navegación por
      ruta y gana los ítems "Salarios" y "Top Skills".
- [ ] `FilterFAB` y `FilterDrawer.jsx` eliminados del código.
      `DesktopFilterSidebar` (nuevo) se usa en las 5 páginas de gráfica en
      tablet/desktop (no en `/`), abierto por defecto, colapsable.
- [ ] `MobileFilterSheet.jsx` sigue funcionando en móvil exactamente igual
      que hoy, sin cambios de comportamiento.
- [ ] `ThemeToggle` accesible desde cualquier página en cualquier
      tamaño de pantalla (dentro de `Header` en md+, flotante en
      móvil) — el componente en sí no se modifica.
- [ ] `npx vitest run` al 100%, con los tests de `BottomNav.jsx`
      actualizados y tests nuevos para `Header.jsx`/
      `DesktopFilterSidebar.jsx`.
- [ ] `npm run build` sin errores — el aviso de chunk >500 kB deja de
      aplicar al bundle principal (o se documenta explícitamente por
      qué persiste, si algún chunk individual sigue superándolo).
- [ ] `.env.local` nunca leído ni impreso.
- [ ] Zona congelada (`src/components/landing/`) sin cambios.

**Opcionales — no bloquean el cierre de la feature:**
- [ ] Precarga del chunk de una ruta al hacer hover sobre su link del
      header.
- [ ] `startTransition` envolviendo la navegación entre rutas.
