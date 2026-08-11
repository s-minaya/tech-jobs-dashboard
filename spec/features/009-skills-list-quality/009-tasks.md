# 009 · Calidad de datos en el autocomplete de skills del mapa — Tareas

## Preparación

- [x] `api/schema.sql` (compartido por el usuario para depurar) protegido
  en `.gitignore` — nunca se sube a GitHub.
- [x] Investigación con datos reales vía API: 34 de 35 coincidencias de
  "react" en `skills.name` tienen 0 ofertas activas; solo "React"
  (exacta) tiene ofertas reales (4464). `api/schema.sql` confirma que
  `skills` es un catálogo poblado progresivamente por NLP — las entradas
  sucias son artefactos de extracción, no datos que redistribuir.


## Implementación

- [x] `api/src/index.js`: `GET /api/skills/list` reescrito con `WHERE
  EXISTS (...)` exigiendo al menos 1 oferta activa vinculada vía
  `job_skills`. Comentario de cabecera actualizado.

## Análisis de impacto (a petición del usuario)

- [x] Análisis exhaustivo de todo lo que depende del comportamiento
  anterior: avisos ⓘ del mapa, descripción de `EuropeMap`, filtro de
  categoría de skill del sidebar, KPI "Skills rastreadas". Único hallazgo
  real: el KPI tenía el mismo root cause exacto. El resto (avisos,
  descripción, filtro de categoría) revisado y confirmado sin relación
  con este cambio — ver `009-spec.md`, sección "Análisis de impacto".
- [x] `api/src/index.js`: `GET /api/stats/summary` (`total_skills`)
  reescrito con el mismo criterio. No toca ningún archivo de
  `src/components/landing/` — cambio de backend puro.
- [x] `src/components/ui/SkillAutocomplete.jsx`: comentario de prop
  desactualizado ("con todas las skills de la BD") corregido. Sin
  cambio de comportamiento.

## Hallazgo post-implementación — 500 en devtools del usuario

- [x] El usuario reportó en su propio navegador `500 Internal Server
  Error` en `/api/salary/by-role-country` **y** en `/api/stats/summary`.
  Investigado con reproducciones directas contra el backend real:
  - `/api/salary/by-role-country`: **no relacionado con esta feature**
    — ya documentado desde la fase 006
    (`spec/sugerencia-optimizacion-query-salario.md`), query sin índice
    de soporte que salta el `statement_timeout` de Postgres bajo carga.
    No se tocó en esta sesión.
  - `/api/stats/summary`: el error real devuelto fue
    `"canceling statement due to statement timeout"` — confirmado con el
    body de la respuesta, no un bug de sintaxis/lógica. Por seguridad se
    optimizó igualmente el `WHERE EXISTS` correlacionado original
    (evaluaba una subconsulta por cada una de las 4557 filas de
    `skills`) a `COUNT(DISTINCT js.skill_id)` sobre un `JOIN` directo —
    mismo resultado (688), una sola pasada en vez de miles de
    subconsultas.
  - Tras optimizar, se comprobó `/api/skills/list` (endpoint no tocado
    en este cambio concreto) y **también** tardó >60s sin responder —
    confirma que la causa es degradación general de la conexión a la BD
    real en este sandbox en ese momento, el mismo patrón documentado en
    todas las fases anteriores de la sesión, no algo específico de esta
    query.
  - `npx vitest run` en `api/` tras el cambio: 20/20, sin regresiones.
  - Esta investigación motivó una conversación aparte con el usuario
    sobre restructurar la carga del dashboard (header con rutas por
    sección + carga bajo demanda, en vez de todas las gráficas pidiendo
    datos a la vez al montar) para atacar la causa de fondo — anotado
    como posible feature futura, sin planificar todavía.

## Verificación

- [x] Backend real: "react" baja de 35 a 1 resultado (solo "React").
- [x] Backend real: repetido con "angular" (2 resultados reales:
  "Angular" y "angularjs" — ambas tecnologías distintas legítimas),
  "python" (1: "Python") y "sql" (13 resultados, todos tecnologías
  reales distintas: MySQL, PostgreSQL, SQL Server, SQLite, PL/SQL,
  SQLAlchemy... sin ningún compuesto/fragmento). Ninguna skill real
  conocida se perdió.
- [x] Backend real: tamaño total de la lista bajó de **4557 a 688**
  filas (85% de reducción).
- [x] Backend real: `/api/stats/summary` → `total_skills: 688`, idéntico
  al tamaño de `/api/skills/list` — KPI y autocomplete consistentes.
- [x] `npx vitest run` en frontend — 316/316 (un primer intento dio 7
  timeouts de worker por contención de recursos del sandbox, mismo
  patrón visto en fases anteriores de la sesión — confirmado no real al
  repetir en limpio).
- [x] `npx vitest run` en `api/` — 20/20, sin regresiones.
- [x] `npm run build` sin errores.
- [x] `api/schema.sql` confirmado fuera de git (`git status --short` no
  lo lista).
- [x] Confirmado que la landing no se ha tocado
  (`git status --short -- src/components/landing/` vacío).

## Cierre

- [x] Validado contra todos los criterios de aceptación de `009-spec.md`
  (ver detalle abajo).
- [x] `spec/README.md` actualizado — `009-skills-list-quality/` insertado
  en el listado de estructura, `halo-responsive-pulido` renumerado a 010.
- [x] `spec/constitution/roadmap.md` actualizado — feature 008 movida a
  "Hecho" (quedó pendiente de esa actualización tras su commit anterior),
  feature 009 en "En curso 🔜" con resumen, backlog renumerado
  (`Halo Responsive y Pulido` pasa a 010).
- [ ] Commit (solo tras confirmación del usuario):
  `fix: exclude skills with no active job postings from the map autocomplete and skills KPI`

### Validación contra `009-spec.md`

- [x] `GET /api/skills/list` solo devuelve skills con ≥1 oferta activa
  real (`WHERE EXISTS`).
- [x] Forma de la respuesta sin cambios (`[{name, category}, ...]`).
- [x] Ningún archivo de frontend cambia de comportamiento (solo un
  comentario de documentación en `SkillAutocomplete.jsx`).
- [x] Verificado con datos reales: "react" 35→1, sin perder skills
  reales en 3 términos adicionales probados.
- [x] `GET /api/stats/summary` (`total_skills`) usa el mismo criterio y
  coincide con `/api/skills/list` (688 en ambos).
- [x] Tamaño total reducido sustancialmente: 4557→688.
- [x] `npx vitest run` 100% en frontend y `api/`.
- [x] `npm run build` sin errores.
- [x] Landing sin modificar.
- [x] `api/schema.sql` protegido en `.gitignore`.
