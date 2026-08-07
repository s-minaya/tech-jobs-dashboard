# 001 · Halo tokens + auditoría — Tareas

## Bloque A — Auditoría

- [x] Comparar la estructura de `src/` contra `spec/constitution/tech-stack.md` y documentar discrepancias.
- [x] Revisar nombres de archivos: detectar inconsistencias de mayúsculas/minúsculas, idioma mezclado o nombres poco descriptivos.
- [x] Revisar nombres internos: variables/funciones con nombres ambiguos (`e`, `d`, `res`, `tmp`, `data` sin contexto).
- [x] Detectar utilidades duplicadas entre componentes que deberían estar en `src/lib/`.
- [x] Detectar rutas relativas profundas (`../../..`) que deberían usar el alias `@/`.
- [x] Generar `spec/features/001-halo-tokens/audit.md` con hallazgos categorizados: 🔴 bloqueante / 🟡 recomendado / ⚪ cosmético.
- [x] Aplicar correcciones bloqueantes y recomendadas.
- [x] Actualizar tests e imports afectados por renombrados.
- [x] Ejecutar `npx vitest run` — debe pasar al 100% tras los cambios de auditoría.

## Bloque B — Tokens

- [x] Instalar fuentes: `npm install @fontsource/inter @fontsource/jetbrains-mono`
- [x] Importar en `src/main.jsx`:
  ```js
  import "@fontsource/inter/400.css";
  import "@fontsource/inter/500.css";
  import "@fontsource/inter/600.css";
  import "@fontsource/inter/700.css";
  import "@fontsource/jetbrains-mono/400.css";
  import "@fontsource/jetbrains-mono/500.css";
  import "@fontsource/jetbrains-mono/600.css";
  ```
  También se desinstalaron `@fontsource-variable/geist`, `@fontsource/geist` y
  `@fontsource/space-mono` (sin uso tras el cambio).
- [x] Grep de variables actuales en uso: `grep -r "var(--" src/ --include="*.jsx" --include="*.css" | sort -u`
  — hecho vía greps dirigidos durante la investigación (ver hallazgos abajo).
- [x] Reemplazar el bloque `:root` de `src/index.css` con los tokens Halo completos:
  - `--color-background`, `--color-surface`, `--color-elevated`, `--color-overlay`
  - `--color-border`, `--color-border-strong`, `--color-border-soft`
  - `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-inverse`
  - `--color-primary`, `--color-primary-hover`, `--color-primary-pressed`, `--color-primary-soft`
  - `--color-success`, `--color-warning`, `--color-info`, `--color-danger` + variantes `-soft`
  - `--font-body`, `--font-mono` + variables de cada nivel de texto
  - `--space-1` a `--space-12`
  - `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`
  - `--elevation-sm`, `--elevation-md`, `--elevation-lg`, `--elevation-focus`
  - `--duration-fast`, `--duration-base`, `--duration-slow`, `--easing-standard`
- [x] Añadir bloque `.light` con los valores de light mode coherentes con Halo y los fondos actuales del proyecto.
  Nota: `useTheme.js` solo alterna la clase `.dark` (nunca añade `.light`), así que
  el bloque real usa el selector `:root, .light` — hoy actúa vía `:root` (sin clase =
  claro); `.light` queda declarada y lista si algún día se añade la clase explícita.
- [x] Definir clases `.hero-bg-dark` y `.hero-bg-light` para los fondos del título hero.
  Definidas y documentadas con `/* TODO: fase 006 */`; no se han aplicado en
  `MainContent.jsx` todavía (el hero se rediseña en la fase 006 — este bloque solo
  sustituye tokens, no reescribe JSX de componentes).
- [x] Actualizar clases custom de `index.css` para referenciar los nuevos tokens. Las que se rediseñarán en fases futuras se marcan con `/* TODO: fase NNN */`.
  De paso se corrigieron 3 bugs preexistentes de `hsl(var(--card))` /
  `hsl(var(--foreground))` (doble envoltura inválida — ver commit).
- [x] Grep de comprobación: `grep -r "var(--primary\|var(--background\|var(--foreground\|var(--muted\|oklch\|hsl(249" src/ --include="*.jsx" --include="*.css"` — el resultado debe estar vacío.
  Vacío tras arreglar 4 referencias JSX huérfanas que el grep inicial reveló
  (`MainContent.jsx`, `ThemeToggle.jsx`, `HeatmapSvg.jsx`, `EuropeMap.jsx`) y
  simplificar el puente `@theme inline` para que apunte a los tokens Halo
  directamente en vez de a los nombres shadcn sueltos.
- [x] Arrancar dev server y verificar visualmente: dashboard carga, datos aparecen, landing sin cambios.
  Verificado con Playwright headless (landing, dashboard dark/light, hover de
  KPI card) — encontró y permitió arreglar una regresión real (`.chart-card-inner`
  usaba `--color-primary-soft`, semitransparente, en vez de un token opaco, y el
  degradado del borde "sangraba"). La carga de datos reales (API → Postgres) no
  se pudo verificar en este entorno: el backend local no tiene salida de red
  hacia la BD remota en el sandbox (timeout confirmado con curl directo); es una
  limitación de infraestructura del entorno de desarrollo de este agente, no del
  código — no hay cambios en `jobServices.js` que puedan causar esto.
- [x] Verificar que la consola no tiene errores de variables CSS.
  Cero errores de variables CSS. Sí aparecen 2 warnings preexistentes en
  `FilterSheet.jsx` (spread de `key` en props, aviso de React 19) — archivo no
  tocado en esta feature, ver nota en el cierre.
- [x] Ejecutar `npx vitest run` — todos los tests deben pasar. 298/298 ✅.
- [x] Ejecutar `npm run build` — el build de producción debe completarse sin errores. ✅.

## Cierre

- [ ] Validar contra todos los criterios de aceptación de `spec.md`.
- [ ] Actualizar `spec/features/001-halo-tokens/audit.md` con el estado final de cada hallazgo.
- [ ] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [ ] Commit: `feat: apply Halo design tokens and dual theme, audit and fix project structure`
