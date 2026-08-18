# 017 · Rediseño landing — versión móvil — Spec

**Estado:** implementación completa (bloques A-D), todos los criterios
de aceptación cumplidos — pendiente de aprobación final del usuario
antes del commit/push de cierre.

> Primera feature del "resto de la fase 3" tras el cierre de la 016.
> Alcance: **solo móvil** (<640px). Tablet/desktop de la landing quedan
> para una feature futura sin numerar.
>
> Esta feature desbloquea `src/components/landing/` (congelada hasta
> ahora en `AGENTS.md`/`mission.md`), mismo patrón que el desbloqueo de
> `api/` en la fase 010 — se documenta en "Decisiones ya tomadas".

## Contexto

`LandingPage.jsx`, hoy, en móvil:

1. **Sin scroll** — contenedor `fixed inset-0 flex items-center
   justify-center` sin `overflow`; hero + 3 `StatCard` + CTA no caben
   en el viewport y quedan cortados.
2. **Identidad desalineada con la dirección nueva** (imagen de
   referencia aportada por el usuario): título "Tech Jobs Dashboard" en
   vez de "Radar del Mercado Tech"; cards con borde/fondo de cristal
   plano, disposición interna distinta.

## Qué hace

1. Arregla el scroll roto en móvil.
2. Título → "Radar del" + "Mercado Tech" (con AuroraText). El hero del
   dashboard (`HomePage.jsx`, ruta `/`) no se toca.
3. Traduce `AuroraText` a JSX + Tailwind del proyecto, aplicado solo a
   "Mercado Tech".
4. Reordena disposición interna de las 3 stat cards (icono en círculo,
   número en jerarquía más grande, franja inferior con indicador) para
   acercarse a la imagen de referencia. El borde/fondo de cristal
   (`border-white/20 bg-white/10 backdrop-blur-sm`) se queda como está.
5. Ningún dato se hardcodea: mismo mapeo card→dato que hoy.

## Mapeo dato → card (sin cambios)

| Card | Dato(s) | Fuente |
|---|---|---|
| Explora el mercado por país | `total_countries`, `total_active_jobs`, `last_updated` | `useSummaryStats` |
| Compara salarios en Europa | `median_salary_90d` | `useSummaryStats` |
| Descubre dónde está la demanda | `top_skills_30d` (top 3) | `useSummaryStats` |

El punto verde de estado en la imagen de referencia es decorativo, no
un dato nuevo.

## Fuera de alcance

- Tablet/desktop de la landing.
- `HomePage.jsx` / hero del dashboard.
- Fondo `Lightfall`, componente `GlowButton` (solo se ajusta su copy).
- Cualquier endpoint, query o campo de datos nuevo.
- Reactividad a `useTheme` en la landing, si no la tiene hoy.

## Decisiones ya tomadas (no se reabren en el plan)

- `src/components/landing/` deja de estar congelada desde esta feature
  — `AGENTS.md` y `mission.md` se actualizan al cierre.
- Los componentes de referencia son material de partida, no código a
  importar tal cual.

## Criterios de aceptación

- [x] En móvil, toda la landing es visible y navegable con scroll.
- [x] Título "Radar del" + "Mercado Tech" (con efecto de gradiente
      animado); "Tech Jobs Dashboard" desaparece de la landing.
- [x] Efecto de texto implementado como JSX propio del proyecto, sin
      TypeScript ni dependencia en runtime de los archivos de referencia.
- [x] Las 3 cards conservan su `backdrop-blur`/borde de cristal
      original, sin ningún efecto de borde animado.
- [x] Las 3 cards siguen 100 % dinámicas vía `useSummaryStats`, mismo
      mapeo de hoy.
- [x] `HomePage.jsx` y el resto del dashboard sin cambios.
- [x] `AGENTS.md`/`mission.md` reflejan el desbloqueo de la landing
      (`tech-stack.md` también, ver `017-tasks.md` Bloque D).
- [x] `npx vitest run` al 100 % — 405/405, 31/31 archivos. `npm run
      build` sin errores.
- [x] `.env.local` nunca leído ni impreso.

## Ver también

- Imagen de referencia aportada por el usuario (versión móvil deseada).
- `spec/features/010-salary-chart-quality/010-spec.md` — precedente del
  desbloqueo de una zona congelada (`api/`).
