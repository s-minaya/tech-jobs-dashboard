# Tech stack y convenciones

## Tecnologías

- **Lenguaje:** JavaScript (JSX) — sin TypeScript en el frontend
- **Framework / runtime:** React 19 + Vite 7
- **Estilos:** Tailwind CSS v4 + CSS custom en `src/index.css` para tokens y clases semánticas
- **Gráficas:** Recharts, D3, SVG manual (EuropeMap, HeatmapSvg)
- **Efectos visuales:** Aurora (WebGL canvas), GlowButton (CSS + keyframes), DecryptedText (animación de texto)
- **Estado:** useState / hooks propios — sin Redux ni Zustand
- **Tests unitarios:** Vitest + React Testing Library + MSW
- **Tests E2E:** Playwright (Chromium)
- **Backend:** Express + PostgreSQL (Supabase) — en `api/`
- **CI:** GitHub Actions (`.github/workflows/ci.yml`)
- **Despliegue previsto:** Vercel (frontend) + Render (backend)
- **Design system base:** Halo — tokens en `src/index.css`, adaptado con dual theme y efectos visuales propios

## Archivos / módulos clave

- `src/index.css` — tokens Halo (dark + light), keyframes aurora/glow, clases semánticas custom
- `src/App.jsx` — orquestador: landing/dashboard, filtros, IntersectionObserver, tema
- `src/components/layout/MainContent.jsx` — hero + grid de gráficas
- `src/components/layout/SummaryStats.jsx` — KPI cards (stat tiles)
- `src/components/layout/BottomNav.jsx` — navegación móvil
- `src/components/ui/ChartCard.jsx` — wrapper visual de todas las gráficas; usa DecryptedText en títulos
- `src/components/ui/ChartDescription.jsx` — descripción + pills de filtros activos
- `src/components/ui/GlowButton.jsx` — botón con efecto aurora iridiscente; se mantiene y se adapta a Halo
- `src/components/ui/Aurora.jsx` — efecto WebGL aurora; se mantiene en el hero del dashboard
- `src/components/ui/DecryptedText.jsx` — efecto de descifrado de texto en hover; se mantiene en títulos de gráficas
- `src/components/ui/ThemeToggle.jsx` — toggle dark/light; se mantiene
- `src/components/Filters/FilterDrawer.jsx` — panel de filtros desktop + FAB
- `src/components/Filters/FilterSheet.jsx` — panel de filtros móvil (bottom sheet)
- `src/components/Filters/FilterSection.jsx` — chips de selección por filtro
- `src/hooks/useFilters.js` — estado de filtros + persistencia localStorage
- `src/hooks/useChartData.js` — fetching genérico de datos de gráficas
- `src/hooks/useTheme.js` — gestión del tema dark/light
- `src/services/jobServices.js` — llamadas a la API
- `src/components/landing/` — ZONA CONGELADA, no tocar

## Comandos

- `npm run dev` — arranca el frontend en localhost:5173
- `npm run build` — build de producción
- `npx vitest run` — tests unitarios
- `npx vitest run --coverage` — tests con coverage
- `npx playwright test` — tests E2E
- `cd api && npm run dev` — arranca el backend en localhost:3000

## Modelo de datos relevante

- `filters` — `{ pais, periodo, contrato, jornada, remote, skillCategoria }` — estado global de filtros, persiste en localStorage bajo la clave `dashboard_filters`
- `ChartCard` — props: `title`, `loading`, `isInitialLoad`, `error`, `warning`, `children`
- `ChartDescription` — props: `description`, `filters`, `totalJobs`, `excludeFilters`, `contexto`, `nota`
- `useChartData(endpoint, params)` — devuelve `{ data, loading, isInitialLoad, error }`

## Convenciones

### Código
- **Idioma del código:** inglés — nombres de variables, funciones, componentes, props y archivos en inglés.
- **Idioma de comentarios:** español — los comentarios inline y de bloque explican el "por qué" en español.
- **Idioma de la spec:** español — toda la documentación en `spec/` está en español.
- **Commits y push:** el agente NUNCA ejecuta `git commit` ni `git push` sin
  confirmación explícita del usuario. Al terminar cada bloque, presenta un
  resumen de cambios y espera aprobación.
- **Commits:** inglés, siguiendo Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`).
- **Nombres:** camelCase para variables y funciones; PascalCase para componentes y tipos; kebab-case para archivos no-componente.
- **Archivos de componente:** PascalCase (`ChartCard.jsx`). Archivos de utilidad: camelCase (`filterUtils.js`).

### Organización de carpetas
```
src/
├── components/
│   ├── Charts/       ← componentes de gráficas individuales
│   ├── Filters/      ← sistema de filtros (Drawer, Sheet, Section)
│   ├── layout/       ← estructura de página (MainContent, BottomNav, SummaryStats)
│   ├── landing/      ← landing page (congelada)
│   └── ui/           ← componentes reutilizables sin dominio (ChartCard, GlowButton, etc.)
├── hooks/            ← hooks custom (useFilters, useChartData, useTheme, useHeatmapData)
├── lib/              ← utilidades puras sin efectos (filterUtils, heatmapUtils, roleLabels, etc.)
├── services/         ← capa de acceso a la API (jobServices)
├── config/           ← configuración estática (filters.js con definición de filtros)
├── mocks/            ← MSW handlers para tests
└── tests/            ← tests unitarios, espejando la estructura de src/
```

### Estilo
- **Tokens CSS:** siempre variables CSS (`var(--color-primary)`) — nunca valores de color hardcodeados.
- **Tailwind en JSX:** clases de utilidad de Tailwind para layout y espaciado; las clases semánticas con lógica compleja van en `index.css`.
- **Tests:** viven en `src/tests/` espejando la estructura. Los `vi.mock` van al inicio del archivo de test, antes de los imports del componente.
- **Datos dinámicos:** ningún dato de la BD se hardcodea. Todo pasa por `jobServices.js` y los hooks.
- **Un componente, una responsabilidad** — separar lógica de presentación.

## Estilo visual

### Design system Halo + extensiones del proyecto

**Tema:** dark mode y light mode — ambos definidos como tokens en `index.css`.
- Dark mode: fondo `#0A0B0F`, superficies `#14151C` / `#1E2029`.
- Light mode: fondo claro coherente con Halo, adaptado de los fondos actuales del proyecto (lila claro del hero).
- El toggle dark/light se mantiene en el hero del dashboard.

**Superficie (dark):** tres niveles — `--color-background`, `--color-surface`, `--color-elevated`.
**Borde:** siempre 1px, `--color-border` o `--color-border-strong`.

**Tipografía:**
- Body y UI: Inter.
- Métricas, números y datos tabulares: JetBrains Mono.
- Títulos de gráficas: DecryptedText (efecto hover de descifrado) — se mantiene.

**Colores de acción y señal:**
- Primary: `--color-primary` (#5B6BFF) — acciones, foco, brand.
- Success / Warning / Info / Danger — signal colors para estado y datos.

**Efectos visuales (extensiones del proyecto sobre Halo):**
- **Aurora** (WebGL canvas) — se mantiene en el hero del dashboard como fondo animado.
- **GlowButton** — botón con efecto aurora iridiscente; se mantiene para CTAs y "Ver resultados". Se adapta a los tokens Halo pero conserva su efecto característico.
- **DecryptedText** — efecto de descifrado en hover en los títulos de gráficas (`ChartCard`). Se mantiene.
- **Fondos del hero:** los gradientes/colores de fondo del título "Tech Jobs Dashboard" (dark y light) se mantienen y adaptan a la paleta Halo.

**Formas:** radios sm 6px, md 10px, lg 16px, full 999px. Sin esquinas a 0px.
**Profundidad:** niveles de superficie + bordes hairline. Sin sombras en componentes planos.
**Breakpoints:** <640px móvil, 640–1024px tablet, >1024px desktop. Max-width: 1200px.

## Límites duros

- **No tocar `src/components/landing/`** — zona congelada.
- **No hardcodear datos** — todo viene de la API.
- **No añadir nuevas dependencias de gráficas** — usar Recharts y D3.
- **No subir `.env*`** al repo.
- **No eliminar tests existentes** — si un componente cambia, su test se actualiza.
- **No mezclar tokens del sistema anterior con tokens Halo** — en cada fase se reemplaza por completo.
- **No usar efectos WebGL (Aurora, DarkVeil, Lightfall) fuera de la landing y del hero del dashboard** — el resto del dashboard usa CSS puro.
- **No eliminar GlowButton, DecryptedText ni ThemeToggle** — son elementos visuales que se conservan y adaptan.

## Filosofía de diseño — aclaración importante

Este proyecto **no implementa Halo tal cual** — usa Halo como base
estructural y lo fusiona con los efectos visuales propios del proyecto.
El resultado es una versión propia con personalidad definida.

**Qué viene de Halo:** tokens de color, tipografía (Inter/JetBrains Mono),
niveles de superficie, bordes hairline, radios, espaciado y signal colors.

**Qué es propio del proyecto (se mantiene en dark Y light mode):**
- Aurora animado en el hero del dashboard y en GlowButton.
- GlowButton con efecto iridiscente en CTAs y acciones principales.
- DecryptedText con efecto de descifrado en hover en títulos de gráficas.
- ThemeToggle — el dashboard tiene dual theme (dark y light).
- Fondos del hero con gradiente radial (`.hero-bg-dark`, `.hero-bg-light`).

**Light mode:** sigue los tokens Halo definidos en `index.css` (`:root, .light`),
no el estilo anterior del proyecto. Adaptar ≠ replicar — se puede ajustar
si el resultado no convence, pero siempre usando los tokens como base.

**Criterio de decisión para efectos visuales:** los efectos animados
(aurora, glow, decrypt) se usan en elementos **interactivos o de foco**
(botones, hero, títulos de sección). Las cards de **contenido pasivo**
(ChartCard, stat tiles) usan superficies y bordes estáticos de Halo.
