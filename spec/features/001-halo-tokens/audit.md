# 001 · Auditoría del proyecto

> Generado como parte del Bloque A de la feature 001. Solo cubre `src/` (frontend).
> `api/` queda fuera de alcance según `spec.md`.

## Resumen

| Severidad | Hallazgos | Aplicados |
| --- | --- | --- |
| 🔴 Bloqueante | 0 | — |
| 🟡 Recomendado | 8 | 6 (2 diferidos a fases futuras) |
| ⚪ Cosmético | 3 | 0 (solo documentados) |

**Estado: cerrado.** Ver sección "Cierre" al final del documento.

---

## 🔴 Bloqueante

Ninguno. La estructura del proyecto es sólida: no hay imports rotos, no hay
rutas relativas profundas (`@/` ya se usa de forma consistente en 41 archivos),
y no hay violaciones de las zonas congeladas ni del límite de efectos WebGL
(Aurora/DarkVeil solo aparecen en `LandingPage.jsx` y en el hero de
`MainContent.jsx`, tal y como exige `tech-stack.md`).

---

## 🟡 Recomendado

### 1. `activeFilterCount` + `NEUTRAL` duplicados (riesgo de desincronización)

**Dónde:** `src/components/Filters/FilterDrawer.jsx` y
`src/components/layout/BottomNav.jsx` definen, cada uno por su cuenta, un
objeto `NEUTRAL` idéntico y una función `activeFilterCount` casi idéntica
para contar filtros activos (para el badge del FAB y del bottom nav).

`useFilters.js` ya tiene un `initialFilters` equivalente y usa
`PERIODO_DEFAULT` (de `filterUtils.js`) precisamente para que el valor por
defecto del periodo nunca se desincronice. `NEUTRAL` en los otros dos
archivos hardcodea `"Últimos 90 días"` de nuevo, sin pasar por
`PERIODO_DEFAULT` — si alguien cambia el default en el futuro, los badges de
filtros activos empezarán a mentir silenciosamente.

**Acción:** mover `activeFilterCount` (usando `PERIODO_DEFAULT`) a
`src/lib/filterUtils.js` y que ambos componentes lo importen de ahí.

**Estado:** ✅ aplicado. Tests añadidos en `filterUtils.test.js`.

### 2. `extractRoles` duplicada

**Dónde:** `src/components/Charts/DemandByRoleChart.jsx` y
`src/components/Charts/SalaryChart.jsx` definen la misma función:
```js
function extractRoles(rows) {
  return [...new Set(rows.map((r) => r.role_category))];
}
```

**Acción:** mover a `src/lib/roleLabels.js`, junto a `getRoleLabel` /
`getRoleColor` (ya centralizan lógica de roles).

**Estado:** ✅ aplicado. Tests añadidos en `roleLabels.test.js`.

### 3. `mapConfig.js` tiene 4 exports muertos que no coinciden con `EuropeMap.jsx`

**Dónde:** `src/lib/mapConfig.js` exporta `MAP_COLOR_INTERPOLATOR` ("YlGn"),
`SELECTED_COUNTRY_STROKE` (`var(--primary)`), `SELECTED_COUNTRY_STROKE_WIDTH`
(2.5) y `UNSELECTED_OPACITY_WHEN_FILTERED` (0.45). Ninguno se importa en
ningún archivo del proyecto — `EuropeMap.jsx` implementa su propia lógica con
valores distintos (`d3.interpolateRdYlGn`, `var(--border)`/`#ffffff`, stroke
`0.5`/`2`, opacidad `0.4`). Son constantes "fantasma": documentan una
intención que el componente no sigue.

**Acción:** eliminar los 4 exports sin uso. **No** se ha tocado
`EuropeMap.jsx` — cambiar sus colores/opacidades reales es una decisión
visual que corresponde a la fase 007 (Halo Charts Internals), no a esta
auditoría.

**Estado:** ✅ aplicado (solo eliminación de código muerto; `EuropeMap.jsx`
no se ha tocado).

### 4. `HeatmapLeyenda.jsx` mezcla español e inglés en el nombre de archivo

**Dónde:** `src/components/Charts/HeatmapLeyenda.jsx`. La convención del
proyecto (`AGENTS.md`) es nombres de archivo en inglés; el resto de
componentes de `Charts/` siguen esa regla (`HeatmapSvg`, `SkillHeatmap`,
`SalaryChart`...).

**Acción:** renombrar a `HeatmapLegend.jsx` y actualizar el import en
`SkillHeatmap.jsx` (único consumidor).

**Estado:** ✅ aplicado (identificador interno también renombrado a
`HeatmapLegend`).

### 5. Nombres de test que no reflejan la capitalización del componente

**Dónde:**
- `src/tests/components/Charts/Skillheatmap.test.jsx` → el componente es
  `SkillHeatmap.jsx` (H mayúscula).
- `src/tests/components/layout/summaryStats.test.jsx` → el componente es
  `SummaryStats.jsx` (S mayúscula).

**Acción:** renombrar ambos archivos de test para que reflejen exactamente
el nombre del componente que testean.

**Estado:** ✅ aplicado.

### 6. Nombres ambiguos: `res` y `d`

**Dónde:**
- `src/services/jobServices.js` — `const res = await fetch(...)` dentro de
  `fetchJson`.
- `src/components/Charts/DemandByRoleChart.jsx:42` — `const d = new Date(...)`
  dentro de `generarMesesRango`.

Nota: los `(d) => ...` dentro de callbacks de D3 (`HeatmapSvg.jsx`,
`EuropeMap.jsx`) **no** se han tocado — `d` para el dato vinculado
("datum") es la convención estándar de D3, no un nombre ambiguo.

**Acción:** renombrar `res` → `response`, `d` → `date`.

**Estado:** ✅ aplicado.

### 7. Detección de tema oscuro duplicada en 5 componentes de gráficas

**Dónde:** `document.documentElement.classList.contains("dark")` se repite
en `DemandByRoleChart.jsx`, `SalaryChart.jsx`, `HeatmapLeyenda.jsx`,
`HeatmapSvg.jsx` y (envuelto en un hook propio con `MutationObserver`) en
`TopSkillsChart.jsx` (`useIsDark`). Es candidato claro a
`src/hooks/useIsDark.js` compartido.

**Acción:** **diferido a la fase 007 (Halo Charts Internals)** — esa fase ya
va a tocar el color interno de cada gráfica, así que deduplicar esta lógica
ahora se pisaría con ese trabajo. Documentado aquí para no perderlo de
vista.

**Estado:** 🕓 diferido, no aplicado.

### 8. `FilterDrawer.jsx` y `FilterSheet.jsx` comparten estructura (overlay, cabecera, footer)

**Dónde:** ambos paneles de filtros repiten el patrón overlay + cabecera
con "Resetear"/cerrar + `GlowButton` de footer, con JSX muy similar pero no
idéntico (drawer lateral vs. sheet inferior con gestos de drag).

**Acción:** **diferido a la fase 004 (Halo Filtros)** — extraer la
estructura compartida ahora implicaría reescribir JSX de ambos componentes,
algo que el plan de esta fase excluye explícitamente ("no reescribir
componentes... el objetivo es que el cambio de tokens ya mejore el aspecto
sin tocar JSX").

**Estado:** 🕓 diferido, no aplicado.

---

## ⚪ Cosmético

### 1. `src/test/setup.js` (singular) vs. `src/tests/` (plural)

`tech-stack.md` solo documenta `src/tests/`. El setup file de Vitest vive en
`src/test/setup.js` (carpeta separada, singular) — es un patrón común para
distinguir "infraestructura de test" de "specs", y así lo trata
`vite.config.js`, pero no está documentado explícitamente. Se deja como
está: moverlo obliga a tocar `vite.config.js` (`setupFiles`) por una mejora
puramente organizativa de bajo impacto.

**Estado:** documentado, no aplicado.

### 2. `button.jsx` y `table.jsx` sin usar en `components/ui/`

Son primitivas generadas por shadcn/ui (`components.json` confirma que el
proyecto usa shadcn) que no se importan en ningún sitio — a diferencia de
`chart.jsx`, que sí se usa en 3 gráficas. El propio `vite.config.js` ya las
excluye de coverage con el comentario "Componentes shadcn/ui generados — no
son código nuestro", lo que sugiere que se mantienen a propósito como
piezas pre-generadas para fases futuras.

**Estado:** documentado, no aplicado — se mantienen como están; se pueden
eliminar en cualquier momento sin riesgo (no las importa nadie) si se
prefiere no arrastrarlas.

### 3. Comentario en `chart.jsx` con un color de ejemplo del sistema antiguo

`src/components/ui/chart.jsx` tiene un comentario ilustrativo
(`--color-count: hsl(249, 100%, 69%)`) que usa el tono púrpura del sistema
de tokens anterior. No es código funcional, pero se actualiza en el Bloque B
al hacer el grep de verificación de referencias huérfanas.

**Estado:** se corrige en el Bloque B (no es un hallazgo de organización,
es parte del propio trabajo de tokens).

---

## Cierre

Los 6 hallazgos 🟡 marcados como propuestos se aplicaron, con tests añadidos
para las dos funciones movidas a `lib/` (`activeFilterCount`,
`extractRoles`). Los 2 diferidos quedan documentados con su fase de destino.
298/298 tests y `npm run build` en verde tras todos los cambios (auditoría +
tokens).

### Hallazgo adicional detectado durante la verificación visual (no estaba en el barrido original)

Al verificar el dashboard con el dev server aparecieron 2 errores de consola
en `FilterSheet.jsx` (React 19: "A props object containing a key prop is
being spread into JSX"), causados por `<FilterSection {...byKey.pais} .../>`
— `byKey.pais` incluye la propiedad `key` de `FILTERS` (`config/filters.js`)
y se spreadea sin extraerla antes, a diferencia de `FilterDrawer.jsx` que sí
hace `({ key, ...rest }) => ...`. **No se ha tocado**: es un archivo que esta
feature no modifica en ningún otro punto, no tiene relación con tokens CSS, y
arreglarlo implica tocar la lógica de props de `FilterSheet.jsx` — trabajo de
componente, fuera de alcance de esta fase. Queda anotado aquí para que la
fase 004 (Halo Filtros), que ya va a tocar `FilterSheet.jsx`, lo resuelva de
paso (aplicar el mismo patrón `({ key, ...rest })` que ya usa `FilterDrawer`).

## Nota para el Bloque B (no es un hallazgo de auditoría)

`src/components/layout/MainContent.jsx` referencia `var(--primary)` y
`var(--background)` directamente en estilos inline del título del hero. El
plan ya anticipa esto (ver "Riesgos" en `001-plan.md`): se resuelve
definiendo `.hero-bg-dark` / `.hero-bg-light` en `index.css` y actualizando
esas líneas para usar los nombres de token Halo — no es una mala práctica
de organización, es parte natural de sustituir el sistema de variables.
