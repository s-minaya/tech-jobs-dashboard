# Plan — Feature 015 — Auditoría de semántica de negocio y cierre de deuda técnica

## Enfoque general

A diferencia de las rondas 008-014 (auditar UNA gráfica/endpoint de
principio a fin), esta feature tiene dos tipos de trabajo distintos y se
plantean por separado:

1. **Documentación pura** (secciones 1 y 2 de `015-spec.md`) — la
   mayoría de las decisiones de negocio ya están bien implementadas en
   el código, solo nunca se pusieron por escrito juntas ni se
   verificaron con evidencia directa. Este trabajo no toca código de
   producción, salvo donde una verificación revele una inconsistencia
   real (poco probable dado que la auditoría previa por agentes ya
   revisó el código con detalle, pero se deja abierto).
2. **Fixes concretos y cierre de deuda** (secciones 3 y 4) — cambios de
   código pequeños y acotados, más intentos de aplicar DDL contra la BD
   real, más limpieza de archivos.

Orden de trabajo recomendado (cada paso verificable de forma
independiente, resultado en `tasks.md`):

### Paso 1 — Verificaciones en vivo (antes de escribir nada definitivo)

Scripts `.mjs` temporales en `api/` (mismo patrón ya usado en fases
013/014: se escriben, se ejecutan contra la BD real vía `dotenv` +
`pg.Pool`, se borran al terminar, nunca se commitean):

- Edad máxima real de ofertas activas (query de `015-spec.md` sección
  1.2).
- Histograma de `salary_mid` por país en tramos razonables, para el
  sanity check de unidad anual (2.1) y la justificación del umbral de
  1000€ (2.2) — incluye el extremo alto para outliers (2.3).

Los resultados se pegan literalmente en `015-tasks.md` (evidencia,
mismo patrón que `EXPLAIN ANALYZE` en fases anteriores) y se resumen en
`015-spec.md` si cambian alguna decisión ya escrita.

### Paso 2 — Fixes de código (pequeños, independientes entre sí)

- **`src/components/Charts/SalaryChart.jsx`** — añadir `notaJornada`
  (mismo patrón que `notaContrato`, líneas 170-173), incluirla en el
  array `nota={[...].filter(Boolean).join(" ")}` ya existente.
- **`src/hooks/useHeatmapData.js`** — añadir `AbortController`/`signal`
  a las dos llamadas (`getSkillCoOccurrence`, `getTopSkills` en ambos
  efectos), siguiendo el patrón ya usado en `useChartData.js`
  (`src/hooks/useChartData.js`, fase 010). Los dos servicios
  (`getSkillCoOccurrence`, `getTopSkills` en `jobServices.js`) ya
  aceptan un segundo argumento `signal` — confirmar antes de tocar el
  hook, y si no lo aceptan añadirlo ahí también, mismo patrón que el
  resto de `jobServices.js`.
- **`api/schema.sql`** — eliminar las 6 vistas sin usar
  (`v_offers_by_country`, `v_salary_stats_by_country`,
  `v_remote_pct_by_country`, `v_job_trends_monthly`,
  `v_skill_cooccurrence`, `v_skills_with_market_context`) y el bloque de
  comentario que las documentaba, dejando un comentario corto que
  explique que se eliminaron en esta fase y por qué (mismo patrón que
  el bloque ya existente para las vistas eliminadas en 010/011/013).

### Paso 3 — DDL contra la BD real

- Reintentar `idx_jobs_salary_by_role_country` (`010-apply-index.sql`) y
  `idx_jobs_demand_by_role` (`011-apply-index.sql`) tal cual están
  documentados — sin cambios de definición, solo reintento.
- Reintentar la ampliación de `idx_jobs_active_summary` con
  `company`/`role_category` (definición objetivo ya en el comentario de
  `schema.sql`, fase 014) — requiere `DROP INDEX CONCURRENTLY` +
  `CREATE INDEX CONCURRENTLY` porque Postgres no tiene `ALTER INDEX`
  para `INCLUDE`.
- Si alguno vuelve a fallar por `statement timeout`: no reintentar más
  de 2-3 veces (mismo criterio que fases anteriores), y consolidar
  **todos** los que sigan pendientes en un único
  `spec/features/015-business-logic-audit/015-apply-indexes.sql` — se
  retiran `010-apply-index.sql`/`011-apply-index.sql` si quedan
  totalmente redundantes con el nuevo archivo consolidado, o se dejan
  con una nota apuntando al nuevo si prefiere mantenerse el historial.

### Paso 4 — Housekeeping

- Confirmar que `api/_diag_remote2.mjs` ya no existe (se borró durante
  el planning de esta feature).
- Revisar `devCache.js` — no se borra (ver 015-spec.md 3.1), solo se
  actualiza su comentario de cabecera con la fecha de esta
  re-confirmación si aporta claridad.

### Paso 5 — Cierre de documentación

- `spec/README.md` — añadir la carpeta `015-business-logic-audit/` a la
  lista, renombrar la entrada de responsive a `016-halo-responsive-pulido`.
- `spec/constitution/roadmap.md` — sección "En curso" durante la
  implementación, luego se mueve a "Hecho" al terminar, con el resumen
  completo (mismo formato que las 14 entradas anteriores). Backlog:
  renumerar "Halo Responsive y Pulido" a `016`.

## Archivos afectados

| Archivo | Tipo de cambio |
|---|---|
| `src/components/Charts/SalaryChart.jsx` | Añadir nota de jornada |
| `src/hooks/useHeatmapData.js` | Añadir `AbortController` |
| `src/services/jobServices.js` | Verificar/añadir `signal` en `getSkillCoOccurrence`/`getTopSkills` si falta |
| `src/tests/hooks/useHeatmapData.test.js` (si existe) o test nuevo | Cubrir la cancelación |
| `src/tests/components/Charts/SalaryChart.test.jsx` | Cubrir la nota de jornada |
| `api/schema.sql` | Eliminar 6 vistas sin usar; reintentar 3 índices |
| `spec/features/015-business-logic-audit/015-apply-indexes.sql` (si hace falta) | Nuevo — consolidado de índices pendientes |
| `spec/README.md` | Nueva carpeta en la lista, renumeración |
| `spec/constitution/roadmap.md` | Nueva entrada, renumeración del backlog |

No se toca: nada de `src/components/landing/` (sigue congelada, sin
excepción esta vez), nada puramente visual/Halo, `devCache.js` (se
mantiene).

## Verificación

1. Scripts de verificación en vivo (paso 1) ejecutados y resultado
   documentado antes de cerrar la spec.
2. `npx vitest run` (frontend y `api/`) al 100% tras los fixes del paso 2.
3. `npm run build` sin errores.
4. Confirmar en vivo (o documentar el fallo) el resultado de cada intento
   de índice del paso 3.
5. Revisar el diff completo antes de proponer commit — confirmar que no
   aparece ningún `.env*` ni credencial, y que no se tocó nada de
   `src/components/landing/` ni nada visual.
