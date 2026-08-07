# 001 · Halo tokens + auditoría — Tareas

## Bloque A — Auditoría

- [ ] Comparar la estructura de `src/` contra `spec/constitution/tech-stack.md` y documentar discrepancias.
- [ ] Revisar nombres de archivos: detectar inconsistencias de mayúsculas/minúsculas, idioma mezclado o nombres poco descriptivos.
- [ ] Revisar nombres internos: variables/funciones con nombres ambiguos (`e`, `d`, `res`, `tmp`, `data` sin contexto).
- [ ] Detectar utilidades duplicadas entre componentes que deberían estar en `src/lib/`.
- [ ] Detectar rutas relativas profundas (`../../..`) que deberían usar el alias `@/`.
- [ ] Generar `spec/features/001-halo-tokens/audit.md` con hallazgos categorizados: 🔴 bloqueante / 🟡 recomendado / ⚪ cosmético.
- [ ] Aplicar correcciones bloqueantes y recomendadas.
- [ ] Actualizar tests e imports afectados por renombrados.
- [ ] Ejecutar `npx vitest run` — debe pasar al 100% tras los cambios de auditoría.

## Bloque B — Tokens

- [ ] Instalar fuentes: `npm install @fontsource/inter @fontsource/jetbrains-mono`
- [ ] Importar en `src/main.jsx`:
  ```js
  import "@fontsource/inter/400.css";
  import "@fontsource/inter/500.css";
  import "@fontsource/inter/600.css";
  import "@fontsource/inter/700.css";
  import "@fontsource/jetbrains-mono/400.css";
  import "@fontsource/jetbrains-mono/500.css";
  import "@fontsource/jetbrains-mono/600.css";
  ```
- [ ] Grep de variables actuales en uso: `grep -r "var(--" src/ --include="*.jsx" --include="*.css" | sort -u`
- [ ] Reemplazar el bloque `:root` de `src/index.css` con los tokens Halo completos:
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
- [ ] Añadir bloque `.light` con los valores de light mode coherentes con Halo y los fondos actuales del proyecto.
- [ ] Definir clases `.hero-bg-dark` y `.hero-bg-light` para los fondos del título hero.
- [ ] Actualizar clases custom de `index.css` para referenciar los nuevos tokens. Las que se rediseñarán en fases futuras se marcan con `/* TODO: fase NNN */`.
- [ ] Grep de comprobación: `grep -r "var(--primary\|var(--background\|var(--foreground\|var(--muted\|oklch\|hsl(249" src/ --include="*.jsx" --include="*.css"` — el resultado debe estar vacío.
- [ ] Arrancar dev server y verificar visualmente: dashboard carga, datos aparecen, landing sin cambios.
- [ ] Verificar que la consola no tiene errores de variables CSS.
- [ ] Ejecutar `npx vitest run` — todos los tests deben pasar.
- [ ] Ejecutar `npm run build` — el build de producción debe completarse sin errores.

## Cierre

- [ ] Validar contra todos los criterios de aceptación de `spec.md`.
- [ ] Actualizar `spec/features/001-halo-tokens/audit.md` con el estado final de cada hallazgo.
- [ ] Mover la feature a "Hecho" en `spec/constitution/roadmap.md`.
- [ ] Commit: `feat: apply Halo design tokens and dual theme, audit and fix project structure`
