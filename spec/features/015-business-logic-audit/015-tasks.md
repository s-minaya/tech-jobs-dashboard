# Tasks — Feature 015 — Auditoría de semántica de negocio y cierre de deuda técnica

> Cada tarea se confirma antes de pasar a la siguiente (`AGENTS.md`). Los
> resultados de las verificaciones en vivo se pegan aquí como evidencia,
> mismo patrón que las fases 010-014.

## 0. Housekeeping previo

- [x] Borrar `api/_diag_remote2.mjs` (residuo sin trackear de la
      investigación descartada de "modelo híbrido" de esta sesión). Hecho
      durante el planning de esta feature.

## 1. Verificaciones en vivo — semántica temporal

- [x] Script temporal contra la BD real: edad máxima real de ofertas
      activas. Resultado (228.673 ofertas activas, 2026-08-13):

  ```
  oldest_posted_at: 2026-05-15 | median_age: 42.1d | p95_age: 84.4d
  older_than_90d: 212 (0.09%) | older_than_98d: 0
  ```

  Hallazgo adicional: las 10 ofertas activas más antiguas (todas IT)
  tienen `first_seen_at = last_seen_at`, ~85 días congelado, y siguen
  `is_active = TRUE` — confirma que la ventana es por `posted_at`, no
  por "seguir viéndose en el scraping".
- [x] Contrastado contra fases 013/014: **confirmado con medición
      directa** — el límite de ~90-98 días es real, no una inferencia.
      Documentado en `015-spec.md` sección 1.2/1.3.
- [x] Script temporal borrado al terminar.

## 2. Verificaciones en vivo — semántica de salario

- [x] Percentiles de `salary_mid` por país (activas, declarado, no
      predicho) — medianas entre 28.800€ (IT) y 80.000€ (ES), consistente
      con salarios anuales en los 8 países. Ver tabla completa en
      `015-spec.md` sección 2.1.
- [x] Distribución `<5000€` en tramos de 500€ — sin vacío limpio, cola
      continua. Umbral de 1.000€ mantenido con evidencia real (muestra
      de valores `salary_min≈salary_max` en rangos como `840-1140` para
      puestos senior — patrón de error de escala ×100). Ver `015-spec.md`
      sección 2.2.
- [x] Extremo alto revisado (spec 2.3) — **32 filas corruptas
      encontradas** (31×500.000€ en NL, 1×1.904.448€ en FR, todas con
      `salary_min = salary_max` y `contract_time` nulo). Decisión: techo
      dirigido (no un corte numérico plano). Implementado en
      `salaryQualityConditions()`.
- [x] Scripts temporales borrados al terminar.

## 3. Documentación de semántica temporal (`015-spec.md`)

- [x] Tabla comparativa de ventanas de fecha por KPI/endpoint (sección 1.1).
- [x] Decisión oficial sobre atribución mensual en "evolución mensual"
      (sección 1.1).
- [x] Decisión oficial sobre por qué las ventanas de los KPIs difieren
      entre sí a propósito (sección 1.1).
- [x] Sección 1.2 actualizada con el resultado real (edad máxima, p95,
      212/228.673 >90d, 0 >98d).
- [x] Documentar `is_active` como límite conocido del pipeline externo,
      precisado con la evidencia de 1.2 (sección 1.3).
- [x] Reconfirmar y documentar por qué `periodo=all` no incluye
      inactivas (sección 1.4).

## 4. Documentación de semántica de salario (`015-spec.md`)

- [x] Sección 2.1 (unidad anual) actualizada con percentiles reales por país.
- [x] Sección 2.2 (umbral 1000€) actualizada con la distribución real y
      la muestra de valores corruptos.
- [x] Sección 2.3 (outliers) actualizada con el hallazgo de las 32 filas,
      la decisión tomada y la verificación post-implementación (avg NL:
      65.582€ → 58.142€, -11.3%).
- [x] `notaJornada` implementada en `SalaryChart.jsx`, con el texto
      basado en la evidencia real (mediana part_time ≈ mitad de
      full_time: 25.002€ vs. 50.000€).
- [x] Tests nuevos en `src/tests/components/Charts/SalaryChart.test.jsx`
      ("nota de jornada": aparece solo con `jornada !== "Todos"`).
- [x] Documentar moneda EUR como asunción de diseño no verificable desde
      este repo (sección 2.5).
- [x] Documentar bruto/neto como limitación conocida (sección 2.6).
- [x] Documentar `salary_is_predicted` como condición defensiva sin
      casos vivos en producción (sección 2.7).

## 5. Fixes de código — cierre de deuda técnica

- [x] `getSkillCoOccurrence` (`jobServices.js`) no aceptaba `signal` —
      añadido (`getTopSkills` ya lo aceptaba desde antes).
- [x] `useHeatmapData.js` — `AbortController` en los dos efectos (carga
      de pares + carga de skills por categoría), mismo patrón que
      `useChartData.js`.
- [x] Tests nuevos en `src/tests/hooks/useHeatmapData.test.js`
      ("AbortController (fase 015)": signal pasado a ambos servicios,
      cancelación de la petición anterior al cambiar periodo/categoría,
      `AbortError` no se expone como error).
- [x] Techo de outliers de salario — 4ª condición en
      `salaryQualityConditions()` (`api/src/salaryQuery.js`), heredada
      por `GET /api/salary/by-role-country` y las 2 subconsultas de
      `GET /api/stats/summary`. Tests actualizados en
      `api/__tests__/salaryQuery.test.js`.
- [x] `api/schema.sql` — eliminado el bloque completo de las 6 vistas
      sin usar, sustituido por una nota corta explicando la limpieza.
- [x] `DROP VIEW` ejecutado contra la BD real para las 6 vistas — **más 2
      vistas adicionales encontradas** (`v_demand_by_role_monthly`,
      `v_salary_by_role_country`) que las fases 010/011 ya habían
      retirado de `schema.sql` pero nunca se habían podido borrar de la
      BD real por el mismo bloqueo de conexión de esa época. Las 8 en
      total, confirmadas eliminadas (`pg_views` vacío tras la limpieza).

## 6. DDL pendiente contra la BD real

- [x] `idx_jobs_salary_by_role_country` (010) — **APLICADO** (117.6s,
      sin timeout).
- [x] `idx_jobs_demand_by_role` (011) — **APLICADO** (33.6s).
- [x] Ampliación de `idx_jobs_active_summary` con `company`/`role_category`
      (014) — **APLICADO** (DROP 157ms + CREATE 17.8s, sin timeout esta
      vez). `ANALYZE jobs` ejecutado tras los 3 índices.
- [x] Los 3 se aplicaron con éxito — no hace falta ningún script
      consolidado nuevo. `010-apply-index.sql`/`011-apply-index.sql`
      marcados como "✅ APLICADO" (registro histórico, no se borran).
      `schema.sql` actualizado con el resultado en los comentarios de
      cada índice.

## 7. `devCache.js` — re-confirmación

- [x] Re-evaluar la condición de retirada con evidencia de esta sesión
      (queries de 15-45s) — se mantiene (spec 3.1).
- [x] Comentario de cabecera de `devCache.js` actualizado con la
      re-confirmación fechada de esta fase.

## 8. Cierre de documentación

- [x] `spec/README.md` — `015-business-logic-audit/` añadida a la lista,
      responsive renombrado a `016-halo-responsive-pulido`.
- [x] `spec/constitution/roadmap.md` — entrada de esta feature movida a
      "En curso" al empezar; se mueve a "Hecho" al cerrar esta fase, con
      el resumen completo. Backlog renumerado a `016`.
- [x] Todos los ítems de las secciones 3 y 4 de `015-spec.md` reflejados
      en `roadmap.md`.

## 10. Ronda 2 — Reconciliación de totales entre gráficas y KPIs

> Iniciada tras la pregunta directa ("¿estamos seguros que todas nuestras
> tablas cumplen toda la semántica de negocio?") — la respuesta honesta
> era que faltaba comprobar si los "totales" que muestran las distintas
> gráficas/KPIs son coherentes entre sí bajo el mismo estado de filtros,
> la preocupación original de la feature.

- [x] Mapa completo de qué filtra cada endpoint (`stats/summary`,
      `offers-by-country`, `demand-by-role`, `salary/by-role-country`,
      `skills/top`, `skills/cooccurrence`) — ver `015-spec.md` sección 5.1.
- [x] Verificación en vivo (filtros por defecto): EuropeMap, TopSkillsChart
      y SkillHeatmap coinciden EXACTOS (228.430 = 228.430 = 228.430) bajo
      la misma condición base.
- [x] Verificación en vivo con `jornada=full_time`: TopSkillsChart la
      ignora correctamente (228.430, idéntico al caso sin filtro) mientras
      EuropeMap sí la aplica (92.215).
- [x] Verificación en vivo con `país=de`: SkillHeatmap la ignora
      correctamente (228.430) mientras TopSkillsChart sí la aplica
      (72.205).
- [x] Confirmado que ambos "ignorados" ya tienen aviso ⓘ en la UI
      (`getWarningNodes` en `TopSkillsChart.jsx`/`SkillHeatmap.jsx`) — no
      es una divergencia silenciosa.
- [x] Aritmética interna verificada: `SUM(job_count)` de las filas
      devueltas por `demand-by-role` (211.766) y `salary/by-role-country`
      (75.075, incluyendo el techo de outliers de esta misma fase) coincide
      exacto con su propio `total_matching_jobs`.
- [x] Granularidad verificada: los 16 `role_category`, las 478 skills y
      los 8 países siguen todos representados dentro de la ventana de 90
      días — nada desaparece invisible por el recorte temporal de las
      gráficas frente al KPI global.
- [x] `total_skills` verificado con dos formulaciones SQL distintas
      (`JOIN`+`COUNT DISTINCT` del KPI vs. `EXISTS` de `skills/list`) —
      coinciden exactas (478 = 478).
- [x] `pct_with_salary` verificado aritméticamente: 81.692/228.673 = 35,7%
      exacto.
- [x] **Único hallazgo real**: las KPI cards del hero no reaccionan a
      ningún filtro (decisión ya tomada en fase 014) y no había ningún
      texto en pantalla que lo aclarase — solo un comentario en el código.
      Decisión: añadir una nota breve.
- [x] `SummaryStats.jsx` — nota añadida: "Datos globales del mercado — no
      varían con los filtros."
- [x] Test nuevo en `SummaryStats.test.jsx` cubriendo la nota.
- [x] `015-spec.md` — sección 5 completa (mapa de filtros, evidencia en
      vivo, decisión).

## 9. Verificación final

- [x] `npx vitest run` (frontend) al 100% — 400/400.
- [x] `npx vitest run` (`api/`) al 100% — 77/77.
- [x] `npm run build` sin errores.
- [ ] Revisar el diff completo — sin `.env*`, sin credenciales, sin
      cambios visuales, sin cambios en `src/components/landing/`.
- [ ] Presentar resumen.
- [ ] Commit (solo tras confirmación explícita).
