# 017 · Rediseño landing — versión móvil — Plan

## Ubicación del componente nuevo

Efecto visual genérico sin dominio — mismo criterio que
`GlowButton`/`Aurora`/`DecryptedText` (`ui/` = reutilizable sin
dominio), no va dentro de `landing/`:

| Componente | Ubicación | Traducido de |
|---|---|---|
| `AuroraText.jsx` | `src/components/ui/AuroraText.jsx` | `AuroraText.tsx` + `.css` |

Su `@keyframes`/token de animación va a `src/index.css`, junto a
`auroraFlow`/`auroraHue` — el proyecto no usa `.css` por componente.

## Traducción — decisiones técnicas

**`AuroraText.jsx`** — mismas props que la referencia (`children`,
`className`, `colors`, `speed`), sin TypeScript. Token
`--animate-aurora` + `@keyframes aurora` en el bloque `@theme inline`
ya existente de `index.css`. Colores: por defecto del componente de
referencia.

## Cambios en `LandingPage.jsx`

1. **Scroll** — contenedor raíz pasa de `fixed inset-0 flex
   items-center justify-center` (sin overflow) a admitir scroll
   vertical cuando el contenido excede el alto disponible
   (`overflow-y-auto` + `min-h-full` en vez de centrado estricto).
2. **Título** — `Radar del` + `<AuroraText>Mercado Tech</AuroraText>`.
3. **`StatCard`** — disposición interna rediseñada (icono en círculo,
   número principal en jerarquía más grande, franja inferior con texto
   + punto decorativo `bg-success`), sin tocar su borde/fondo de
   cristal (`bg-white/10 backdrop-blur-sm`). Mapeo dato→card sin cambios.
4. **CTA** — copy de `GlowButton` a "Explorar dashboard" (sin "el").

## Documentación (parte del alcance)

- `AGENTS.md` — la entrada de `src/components/landing/` en "Zonas
  congeladas" pasa a una nota de desbloqueo desde la 017 (mismo formato
  que la ya existente para `api/`).
- `mission.md` — la frase sobre la landing en "Qué NO es" se actualiza
  para reflejar que entra en rediseño desde la fase 3.

## Enfoque

En capas, validando con `npx vitest run` entre cada una:

1. Traducir `AuroraText` + keyframe + test propio (aislado, sin tocar
   la landing).
2. Aplicarlo en `LandingPage.jsx` (título).
3. Arreglar scroll + disposición interna de las cards.
4. Documentación (`AGENTS.md`, `mission.md`) + validación final.
