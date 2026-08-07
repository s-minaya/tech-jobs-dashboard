# 001 · Halo tokens + auditoría — Plan

## Enfoque

Dos flujos en orden: primero la auditoría (solo lectura, sin tocar código), luego
los tokens (modificaciones en `index.css` y `main.jsx`). La auditoría va primero
porque puede revelar renombrados que afecten a los imports, que a su vez podrían
romper el grep de variables CSS.

## Implementación

### Bloque A — Auditoría (solo lectura primero, cambios después)

1. **Revisar organización de carpetas** — comparar `src/` contra la estructura definida en `constitution/tech-stack.md`. Documentar discrepancias en `audit.md`.
2. **Revisar nomenclatura de archivos** — detectar archivos con nombres poco descriptivos, inconsistentes o en idioma mezclado.
3. **Revisar nomenclatura interna** — variables, funciones y props con nombres ambiguos o demasiado cortos (`e`, `d`, `tmp`, etc.).
4. **Detectar código duplicado** — utilidades definidas dentro de componentes que deberían estar en `src/lib/`.
5. **Detectar imports rotos o rutas frágiles** — imports que usan rutas relativas profundas donde debería usarse el alias `@/`.
6. **Generar `audit.md`** con la lista de hallazgos categorizados por severidad (bloqueante / recomendado / cosmético).
7. **Aplicar los cambios acordados** — solo los bloqueantes y recomendados; los cosméticos quedan documentados para el futuro.
8. **Actualizar tests afectados** por renombrados.

### Bloque B — Tokens

1. **Instalar fuentes** — `npm install @fontsource/inter @fontsource/jetbrains-mono` en el frontend.
2. **Importar en `src/main.jsx`** — Inter 400/500/600/700 y JetBrains Mono 400/500/600.
3. **Grep de variables en uso** — `grep -r "var(--" src/ --include="*.jsx" --include="*.css" | sort -u` para saber qué se va a romper.
4. **Reemplazar `:root` en `src/index.css`** — bloque completo de tokens Halo (colores dark, tipografía, espaciado, radio, elevación, motion).
5. **Añadir bloque light mode** — `.light` o `[data-theme="light"]` con los valores de superficie y texto para el modo claro, coherentes con Halo y los fondos actuales del proyecto.
6. **Actualizar clases custom en `index.css`** — las clases `.glow-button-*`, `.chart-card-*`, `.aurora-*`, `.glow-kpi-*` se actualizan para referenciar los nuevos tokens. Las que pertenezcan a componentes que se rediseñarán en fases 002–008 se marcan con un comentario `/* TODO: rediseñar en fase NNN */`.
7. **Verificar referencias huérfanas** — segundo grep para confirmar que no queda ninguna `var(--primary)`, `var(--background)` o similar del sistema antiguo.
8. **Verificar en el navegador** — arrancar dev server, confirmar que el dashboard carga, los datos aparecen y la landing no ha cambiado.
9. **Ejecutar tests** — `npx vitest run` debe pasar al 100%.

## Decisiones

- **`@fontsource` en lugar de Google Fonts** — funciona offline, sin petición externa, compatible con CSP. Google Fonts descartado por latencia y dependencia de red.
- **Variables CSS para tokens, no objetos Tailwind** — las variables CSS son más portables: funcionan en clases custom, en JSX inline y en cualquier selector. Los colores Tailwind pueden apuntar a las variables después (`primary: 'var(--color-primary)'`).
- **Dual theme con clase en lugar de `prefers-color-scheme`** — el ThemeToggle ya usa una clase en `<html>`; mantener esa mecánica evita refactorizar `useTheme.js`.
- **Auditoría antes que tokens** — los renombrados de archivos podrían afectar a los greps de variables. Hacerlo primero evita trabajo doble.
- **No reescribir componentes en esta fase** — el objetivo es que el cambio de tokens ya mejore el aspecto sin tocar JSX. Los componentes se rediseñan en 002–008.

## Riesgos

- **Clases Tailwind semánticas (`bg-primary`, `text-muted-foreground`)** rotas si Tailwind no tiene esos tokens. Mitigación: revisar `tailwind.config.js` y registrar los tokens Halo como colores Tailwind apuntando a las variables CSS.
- **Fondos del hero** (gradientes actuales del título "Tech Jobs Dashboard") podrían quedar desconectados de los nuevos tokens. Mitigación: definirlos explícitamente como clases `.hero-bg-dark` y `.hero-bg-light` en `index.css` referenciando los tokens Halo.
- **Renombrados en la auditoría que rompan tests**. Mitigación: actualizar imports en los tests inmediatamente tras cada renombrado, antes de pasar al siguiente.
