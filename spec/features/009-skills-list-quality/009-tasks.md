# 009 · Calidad de datos en el autocomplete de skills del mapa — Tareas

## Preparación

- [x] `api/schema.sql` protegido en `.gitignore` — nunca se sube a GitHub.
- [x] Investigación con datos reales vía API: 34 de 35 coincidencias de
  "react" en `skills.name` tienen 0 ofertas activas; solo "React"
  (exacta) tiene ofertas reales (4464). `skills` es un catálogo poblado
  progresivamente por NLP — las entradas sucias son artefactos de
  extracción, no datos que redistribuir.

## Implementación

- [x] `api/src/index.js`: `GET /api/skills/list` reescrito con `WHERE
  EXISTS (...)` exigiendo al menos 1 oferta activa vinculada vía
  `job_skills`. Comentario de cabecera actualizado.

## Análisis de impacto

- [x] Revisado todo lo que depende del comportamiento anterior: avisos ⓘ
  del mapa, descripción de `EuropeMap`, filtro de categoría de skill del
  sidebar, KPI "Skills rastreadas". Único hallazgo real: el KPI tenía el
  mismo root cause exacto. El resto (avisos, descripción, filtro de
  categoría) confirmado sin relación con este cambio — ver `009-spec.md`.
- [x] `api/src/index.js`: `GET /api/stats/summary` (`total_skills`)
  reescrito con el mismo criterio. No toca ningún archivo de
  `src/components/landing/` — cambio de backend puro.
- [x] `src/components/ui/SkillAutocomplete.jsx`: comentario de prop
  desactualizado ("con todas las skills de la BD") corregido. Sin
  cambio de comportamiento.

## Hallazgo post-implementación — dos 500 en producción

Investigados con reproducciones directas contra el backend real:

- **`/api/salary/by-role-country`** — no relacionado con esta feature, ya
  documentado desde la fase 006: query sin índice de soporte que salta el
  `statement_timeout` de Postgres bajo carga. No se tocó aquí.
- **`/api/stats/summary`** — mismo error de fondo
  (`statement timeout`), no un bug de sintaxis/lógica. Se optimizó de
  paso el `WHERE EXISTS` correlacionado original (una subconsulta por
  cada una de las 4557 filas de `skills`) a `COUNT(DISTINCT js.skill_id)`
  sobre un `JOIN` directo — mismo resultado (688), una sola pasada.
- Tras optimizar, `/api/skills/list` (endpoint no tocado en este cambio)
  también tardó >60s sin responder — confirma degradación general de la
  conexión a la BD en ese momento, no algo específico de esta query.
- Idea anotada para el futuro, sin planificar: restructurar la carga del
  dashboard (rutas por sección + carga bajo demanda, en vez de todas las
  gráficas pidiendo datos a la vez al montar) para atacar la causa de
  fondo de estos timeouts.

## Verificación

- [x] Backend real: "react" baja de 35 a 1 resultado (solo "React").
- [x] Backend real: "angular" (2: "Angular", "angularjs" — tecnologías
  distintas legítimas), "python" (1), "sql" (13, todas tecnologías
  reales: MySQL, PostgreSQL, SQL Server, SQLite, PL/SQL, SQLAlchemy...).
  Ninguna skill real conocida se perdió.
- [x] Backend real: tamaño total de la lista bajó de **4557 a 688** filas
  (85% de reducción).
- [x] Backend real: `/api/stats/summary` → `total_skills: 688`, idéntico
  al tamaño de `/api/skills/list` — KPI y autocomplete consistentes.
- [x] `npx vitest run` en frontend — 316/316.
- [x] `npx vitest run` en `api/` — 20/20, sin regresiones.
- [x] `npm run build` sin errores.
- [x] `api/schema.sql` confirmado fuera de git.
- [x] Landing sin modificar.

## Cierre

- [x] Validado contra todos los criterios de aceptación de `009-spec.md`.
- [x] `spec/README.md` y `spec/constitution/roadmap.md` actualizados.
- [ ] Commit (solo tras confirmación explícita):
  `fix: exclude skills with no active job postings from the map autocomplete and skills KPI`
