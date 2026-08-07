# 001 · Halo tokens + auditoría

**Estado:** en curso

## Qué hace

Dos cosas en paralelo que deben hacerse antes de tocar ningún componente:

1. **Tokens:** sustituye el sistema de variables CSS actual (colores aurora/purple, oklch, Space Mono + Geist) por los design tokens de Halo, con soporte dual dark/light mode.
2. **Auditoría:** identifica y corrige malas prácticas acumuladas en el proyecto — organización de carpetas, nombres poco descriptivos, código duplicado, imports rotos — sin alterar la lógica de negocio.

## Por qué

Los tokens son la base de todo el rediseño: sin ellos, cada componente tendría que gestionar sus propios colores. La auditoría se hace ahora porque es más barato corregir la estructura antes de reescribir los componentes que después.

## Criterios de aceptación

### Tokens
- [ ] `src/index.css` define todos los tokens de color Halo en modo dark (`:root`) y light (`.light` o `[data-theme="light"]`): `--color-background`, `--color-surface`, `--color-elevated`, `--color-border`, `--color-border-strong`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-primary` y sus variantes, y los cuatro signal colors con sus variantes `-soft`.
- [ ] `src/index.css` define los tokens de tipografía Halo: `--font-body: 'Inter'`, `--font-mono: 'JetBrains Mono'` y las variables de cada nivel de texto.
- [ ] `src/index.css` define los tokens de espaciado (`--space-*`), radio (`--radius-*`), elevación (`--elevation-*`) y motion (`--duration-*`, `--easing-*`).
- [ ] Inter y JetBrains Mono están instaladas via `@fontsource` e importadas en `src/main.jsx`.
- [ ] Las variables CSS anteriores (oklch, hsl aurora, Space Mono, Geist Variable) han sido eliminadas del `:root`.
- [ ] Los fondos del hero (dark y light) están definidos como tokens o clases propias y funcionan correctamente.
- [ ] El dashboard carga sin errores de consola relacionados con variables CSS no definidas.
- [ ] La landing page no ha sido modificada.
- [ ] Todos los tests siguen pasando (`npx vitest run`).

### Auditoría
- [ ] Se ha generado un informe de malas prácticas detectadas (`spec/features/001-halo-tokens/audit.md`).
- [ ] Los archivos con nombres poco descriptivos o inconsistentes han sido renombrados (si los hay).
- [ ] La organización de carpetas respeta la estructura definida en `tech-stack.md`.
- [ ] No hay imports rotos tras los renombrados.
- [ ] No hay código duplicado obvio entre archivos (utilidades repetidas en componentes que deberían estar en `lib/`).
- [ ] Los tests se han actualizado si algún archivo fue renombrado o movido.

## Fuera de alcance

- Rediseño visual de ningún componente — eso es 002–008.
- Cambios en la lógica de negocio (hooks, servicios, filtros).
- Auditoría del backend (`api/`) — solo el frontend.
- Añadir nuevas features o secciones.
