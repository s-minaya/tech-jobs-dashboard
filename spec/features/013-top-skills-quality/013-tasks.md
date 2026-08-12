# 013 · Auditoría Top Skills más demandadas — Tareas

Checklist pendiente de implementación — ningún ítem se toca hasta que se
confirme empezar la implementación (ver `AGENTS.md`: no se empieza una
feature nueva sin confirmación explícita).

## Preparación

- [ ] Confirmar con el usuario que se empieza la implementación de esta
      feature (spec/plan ya aprobados en la conversación).
- [ ] `.env.local` no se lee en ningún paso.

## Backend

- [ ] `api/src/index.js`: quitar `|| filtrosAplicables.periodo === "all"`
      del fallback de 90 días en `/api/skills/top` **y**
      `/api/skills/cooccurrence` — "Todo el histórico" deja de ser un
      no-op (hallazgo 1, encontrado tras la pregunta del usuario sobre
      coherencia semántica de los datos).
- [ ] `api/src/buildFilters.js`: nueva `TOP_SKILLS_IGNORED_FILTERS = ["jornada"]`.
- [ ] `api/src/skillsQuery.js` (nuevo): query de `skills/top` extraída,
      sin `pct_of_all_jobs`, usando `stripKeys(req.query, TOP_SKILLS_IGNORED_FILTERS)`
      y ya con el fix de `periodo=all`.
- [ ] `api/__tests__/skillsQuery.test.js` (nuevo): `LIMIT` 20/50 según
      `category`, `category` no se cuela en la query del total, indexación
      de `$N` con distintas combinaciones de filtros, `periodo=all` no
      añade condición de fecha (a diferencia de `periodo` ausente).
- [ ] `api/__tests__/`: test nuevo/actualizado confirmando el mismo
      contrato de `periodo=all` para `/api/skills/cooccurrence`.
- [ ] `api/src/index.js`: el handler de `/api/skills/top` delega en
      `skillsQuery.js`.
- [ ] `EXPLAIN (ANALYZE, BUFFERS)` de la query real (vía el pool ya
      conectado del servidor) — documentar aquí el resultado antes de
      diseñar el índice.
- [ ] `schema.sql`: índice nuevo según lo que confirme el `EXPLAIN`
      (nombre pendiente de decidir con la evidencia real).
- [ ] `schema.sql`: eliminar `v_top_skills_by_country` y
      `v_top_skills_global`, documentar en el bloque de "vistas
      eliminadas" existente.

## Frontend

- [ ] `src/services/jobServices.js`: ajustar `getTopSkills` si aplica.
- [ ] `src/lib/filterUtils.js`: nuevo `SKILL_CATEGORIA_LABELS`.
- [ ] `src/components/Charts/TopSkillsChart.jsx`: `slowHint` en
      `ChartCard`; techo de altura + `overflow-y: auto`; descripción usa
      la categoría traducida.
- [ ] `src/mocks/handlers.js`: ajustar el mock de `/api/skills/top` si
      `pct_of_all_jobs` desaparece de la forma de la respuesta.

## Tests

- [ ] `src/tests/components/Charts/TopSkillsChart.test.jsx`: nuevo caso
      con `skillCategoria` activo (pill traducida, texto de descripción,
      forma de la petición saliente).
- [ ] `src/tests/components/Charts/TopSkillsChart.test.jsx`: nuevo caso —
      aviso ⓘ visible cuando `jornada` está activo.
- [ ] `src/tests/components/Charts/TopSkillsChart.test.jsx`: nuevo caso —
      altura a escala realista (10-50 filas).
- [ ] `npx vitest run` (frontend) — 100%, sin regresiones.
- [ ] `npx vitest run` (`api/`) — 100%, sin regresiones.
- [ ] `npm run build` sin errores.

## Verificación contra el backend real

- [ ] Servidor de desarrollo reiniciado si hace falta; caché de
      desarrollo limpiada para forzar peticiones frescas.
- [ ] `GET /api/skills/top?periodo=all` vs `periodo=90d` — deben diferir
      (confirma el fix del hallazgo 1).
- [ ] `GET /api/skills/cooccurrence?periodo=all` vs `periodo=90d` — deben
      diferir, mismo chequeo para el heatmap.
- [ ] `GET /api/skills/top` (sin filtros) — tiempo de respuesta antes/
      después del índice.
- [ ] `GET /api/skills/top?country=de` — tiempo de respuesta antes/
      después del índice.
- [ ] `GET /api/skills/top?periodo=all` — tiempo de respuesta ya sin el
      cap de 90 días (con el índice puesto).
- [ ] Confirmar que `pct_of_all_jobs` ya no aparece en la respuesta.
- [ ] Confirmar que `jornada` sigue sin efecto tras pasar a `stripKeys`
      (mismo `total_matching_jobs` con y sin `jornada=full_time`).
- [ ] Verificación manual en el navegador: "Todo el histórico" cambia el
      resultado visiblemente; categorías traducidas; scroll con
      `category` activo; badge de carga lenta visible.

## Cierre

- [ ] Validado contra todos los criterios de `013-spec.md`.
- [ ] `spec/README.md` actualizado.
- [ ] `spec/constitution/roadmap.md` actualizado.
- [ ] Commit (solo tras confirmación explícita del usuario).
