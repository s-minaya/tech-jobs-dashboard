/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import {
  buildFilters,
  stripKeys,
  COOCCURRENCE_IGNORED_FILTERS,
  applyDefaultPeriodoFallback,
} from "./buildFilters.js";
import { buildSalaryByRoleCountryQuery, shapeSalaryRows } from "./salaryQuery.js";
import { buildDemandByRoleQuery, shapeDemandRows } from "./demandQuery.js";
import { buildTopSkillsQueries, shapeTopSkillsResult } from "./skillsQuery.js";
import { devCacheMiddleware } from "./devCache.js";

dotenv.config({ path: ".env.local" });

const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json({ limit: "25Mb" }));
// ⚠️ TEMPORAL — quitar esta línea (y devCache.js) cuando ya no haga
// falta. Ver el comentario de cabecera de devCache.js.
app.use(devCacheMiddleware);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Error conectando a la BD:", err.message);
    return;
  }
  console.log("Conectado a PostgreSQL");
  release();
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`Servidor en http://localhost:${port}`));
app.get("/", (req, res) => res.send("OK"));

function errorHandler(res, err, context) {
  console.error(`[${context}]`, err.message);
  res.status(500).json({ error: `Error en ${context}`, detail: err.message });
}

// GET /api/skills/list
// Devuelve las skills registradas en la BD que tienen al menos una oferta
// activa real vinculada, ordenadas alfabéticamente. Se usa para poblar el
// autocomplete del mapa.
//
// Antes devolvía las 4557 filas de `skills` sin ningún filtro (tabla
// poblada progresivamente por un pipeline NLP de extracción — ver
// api/schema.sql). La mayoría son artefactos sin ninguna oferta real
// detrás: fragmentos de texto de ofertas, nombres compuestos
// ("React/Angular", "WEB (React)"), títulos de puesto. Verificado con
// datos reales: de 35 filas de `skills.name` que contienen "react", 34
// tenían 0 ofertas activas — solo la fila limpia "React" tiene ofertas
// reales. El EXISTS exige al menos una oferta activa real, sin parsear
// ni redistribuir nombres compuestos — el filtro que sí funciona porque
// el mapa (más abajo) también solo muestra ofertas activas, así que una
// skill sin ninguna llevaría siempre a un resultado vacío.
app.get("/api/skills/list", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.name, s.category
       FROM skills s
       WHERE EXISTS (
         SELECT 1
         FROM job_skills js
         JOIN jobs j ON j.id = js.job_id
         WHERE js.skill_id = s.id
           AND j.is_active = TRUE
       )
       ORDER BY s.name ASC`,
    );
    res.json(result.rows);
  } catch (err) {
    errorHandler(res, err, "skills-list");
  }
});

// GET /api/jobs/offers-by-country
// Total de ofertas activas por país con los filtros aplicados.
// Acepta el param 'skill' (nombre exacto de una skill) para filtrar
// las ofertas que incluyen esa tecnología. En ese caso añade los JOINs
// necesarios con job_skills y skills.
// El filtro de país se ignora: el mapa siempre muestra todos los países.
// Devuelve { rows, total_matching_jobs }.
app.get("/api/jobs/offers-by-country", async (req, res) => {
  try {
    const { country: _ignored, ...restQuery } = req.query;
    const { conditions, values } = buildFilters(restQuery);

    let query;

    if (req.query.skill) {
      // Con filtro de skill: necesitamos JOIN a job_skills y skills
      values.push(req.query.skill);
      conditions.push(`s.name = $${values.length}`);

      query = `
        SELECT j.country_code, c.name AS country_name, COUNT(DISTINCT j.id) AS total_jobs
        FROM jobs j
        JOIN countries c ON c.code = j.country_code
        JOIN job_skills js ON js.job_id = j.id
        JOIN skills s ON s.id = js.skill_id
        WHERE ${conditions.join(" AND ")}
        GROUP BY j.country_code, c.name
        ORDER BY total_jobs DESC`;
    } else {
      // Sin filtro de skill: query simple sin JOINs extra
      query = `
        SELECT j.country_code, c.name AS country_name, COUNT(*) AS total_jobs
        FROM jobs j
        JOIN countries c ON c.code = j.country_code
        WHERE ${conditions.join(" AND ")}
        GROUP BY j.country_code, c.name
        ORDER BY total_jobs DESC`;
    }

    const result = await pool.query(query, values);
    const total = result.rows.reduce((sum, r) => sum + Number(r.total_jobs), 0);
    res.json({ rows: result.rows, total_matching_jobs: total });
  } catch (err) {
    errorHandler(res, err, "offers-by-country");
  }
});

// GET /api/jobs/demand-by-role
// Evolución mensual de ofertas por rol.
// Filtros: país, periodo, contrato, jornada, remote. skillCategoria no
// aplica: esta query no hace JOIN con job_skills/skills, no hay columna
// de skill que filtrar (ver spec/features/011-demand-by-role-quality/
// 011-tasks.md, "Hallazgos post-implementación" para el razonamiento
// completo, incluida la corrección de por qué jornada sí debía aplicar).
// No agrupa por country_code (fase 011): el frontend (DemandByRoleChart)
// siempre suma la demanda de un rol/mes entre los países filtrados, nunca
// la desglosa — agrupar por país solo fragmentaba cada (mes, rol) en
// varias filas que había que volver a sumar en el cliente, y con "Todos"
// los países (el filtro por defecto) el pivot del frontend se quedaba solo
// con la última fila que llegaba en vez de sumarlas. Ver demandQuery.js y
// spec/features/011-demand-by-role-quality/011-spec.md.
app.get("/api/jobs/demand-by-role", async (req, res) => {
  try {
    const { conditions, values } = buildFilters(req.query);
    conditions.push("j.role_category IS NOT NULL");
    conditions.push("j.posted_at IS NOT NULL");
    const { text } = buildDemandByRoleQuery(conditions);
    const result = await pool.query(text, values);
    res.json(shapeDemandRows(result.rows));
  } catch (err) {
    errorHandler(res, err, "demand-by-role");
  }
});

// GET /api/salary/by-role-country
// Salario mediano por rol y país.
// Excluye salary_mid < 1000 (datos corruptos del pipeline).
//
// Una sola query en vez de dos (antes: Promise.all con la agregación +
// un COUNT(DISTINCT j.id) aparte, mismo WHERE, dos escaneos de `jobs`
// por cada carga/recarga del gráfico) — total_matching_jobs viaja como
// columna vía SUM(COUNT(*)) OVER(), ver salaryQuery.js.
app.get("/api/salary/by-role-country", async (req, res) => {
  try {
    const { conditions, values } = buildFilters(req.query);
    conditions.push("j.role_category IS NOT NULL");
    conditions.push("j.salary_mid IS NOT NULL");
    conditions.push("j.salary_is_predicted = FALSE");
    conditions.push("j.salary_mid >= 1000");

    const { text } = buildSalaryByRoleCountryQuery(conditions);
    const result = await pool.query(text, values);
    res.json(shapeSalaryRows(result.rows));
  } catch (err) {
    errorHandler(res, err, "salary-by-role-country");
  }
});

// GET /api/skills/top
// Skills más demandadas. Lógica en skillsQuery.js (fase 013) — dos
// queries (filas + total) porque `category` solo afecta a la primera; ver
// el comentario de cabecera de ese archivo para el porqué completo.
app.get("/api/skills/top", async (req, res) => {
  try {
    const { rowsQuery, countQuery } = buildTopSkillsQueries(req.query);
    const [skillsResult, totalResult] = await Promise.all([
      pool.query(rowsQuery.text, rowsQuery.values),
      pool.query(countQuery.text, countQuery.values),
    ]);
    res.json(shapeTopSkillsResult(skillsResult.rows, totalResult.rows));
  } catch (err) {
    errorHandler(res, err, "skills-top");
  }
});

// GET /api/skills/cooccurrence
// Pares de skills que aparecen juntas. Solo aplica el filtro de periodo.
// País, contrato, jornada y remote no aplican (datos globales).
//
// role_category NO va en el SELECT/GROUP BY a propósito: el frontend
// (buildLookup en heatmapUtils.js) nunca lo usa, y agrupar por él
// fragmentaba cada par en varias filas (una por role_category) con un
// co_count parcial en vez del total real. Eso hacía que buildLookup se
// quedara con el valor de la última fragmento que pisaba las anteriores
// (co_count incorrecto) y, peor, que el LIMIT 1000 — ordenado por esos
// co_count ya fragmentados — se gastara en duplicados del mismo par en
// vez de cubrir pares distintos, dejando fuera pares reales (sobre todo
// en categorías de skill menos populares, donde filterSkillsWithCoOccurrence
// terminaba eliminando skills que sí tenían co-ocurrencias reales).
app.get("/api/skills/cooccurrence", async (req, res) => {
  try {
    // Los 4 filtros de COOCCURRENCE_IGNORED_FILTERS se descartan
    // explícitamente (fase 012): antes se hacía con un destructure
    // inline que solo cubría country/jornada, dejando contrato/remote
    // colarse en restQuery — si algún día llegaran en la query string,
    // buildFilters los habría aplicado igual, devolviendo datos
    // silenciosamente más pequeños/sesgados que lo que este mismo
    // comentario y la UI le prometen al usuario. Dormido hasta ahora
    // porque el único caller (getSkillCoOccurrence en jobServices.js) ya
    // los descartaba antes de llamar — pero el contrato de la API en sí
    // estaba roto. Usar stripKeys + la lista exportada (en vez de un
    // destructure inline) permite testear este contrato sin Express/BD.
    const restQuery = stripKeys(req.query, COOCCURRENCE_IGNORED_FILTERS);
    const { conditions, values } = buildFilters(restQuery);

    // applyDefaultPeriodoFallback (buildFilters.js): solo actúa si
    // periodo está totalmente ausente, nunca con "all" explícito. Hasta
    // la fase 013 este endpoint reimplementaba el mismo `if` pero también
    // saltaba con periodo === "all", así que "Todo el histórico" era un
    // no-op silencioso aquí también (mismo bug que /api/skills/top — ver
    // skillsQuery.js). Centralizado para que los dos no puedan volver a
    // desincronizarse.
    applyDefaultPeriodoFallback(conditions, req.query);

    const [coOccResult, totalResult] = await Promise.all([
      pool.query(
        `SELECT
           s1.name AS skill,
           s2.name AS co_skill,
           COUNT(DISTINCT js1.job_id) AS co_count
         FROM job_skills js1
         JOIN job_skills js2 ON js1.job_id = js2.job_id AND js1.skill_id < js2.skill_id
         JOIN skills s1 ON s1.id = js1.skill_id
         JOIN skills s2 ON s2.id = js2.skill_id
         JOIN jobs j ON j.id = js1.job_id
         WHERE ${conditions.join(" AND ")}
         GROUP BY s1.name, s2.name
         ORDER BY co_count DESC
         LIMIT 1000`,
        values,
      ),
      pool.query(
        `SELECT COUNT(DISTINCT j.id)::int AS total
         FROM jobs j WHERE ${conditions.join(" AND ")}`,
        values,
      ),
    ]);

    res.json({
      pairs: coOccResult.rows,
      total_matching_jobs: totalResult.rows[0].total,
    });
  } catch (err) {
    errorHandler(res, err, "skills-cooccurrence");
  }
});

// GET /api/stats/summary
// Indicadores globales del dashboard (KPI cards).
// No aplica ningún filtro: los números representan el estado completo
// de la base de datos, independientemente de lo que el usuario tenga filtrado.
// Esto da contexto sobre el volumen y calidad del dataset.
//
// Devuelve:
//   total_active_jobs    → ofertas activas en este momento
//   total_countries      → países cubiertos por el dataset
//   total_skills         → skills distintas con al menos una oferta activa
//   pct_with_salary      → porcentaje de ofertas activas con salario declarado
//   last_updated         → fecha de la oferta activa más reciente
//
// total_skills usa el mismo criterio que GET /api/skills/list (ver ese
// endpoint): antes contaba las 4557 filas crudas de `skills` sin
// filtrar, casi todo artefactos de extracción NLP sin ninguna oferta
// real detrás (verificado con datos reales — ver
// spec/features/009-skills-list-quality/). Se calcula con
// COUNT(DISTINCT skill_id) sobre un JOIN directo en vez de un EXISTS
// correlacionado por fila de `skills` — mismo resultado, una sola
// pasada en vez de una subconsulta por cada una de las 4557 filas.
app.get("/api/stats/summary", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)                                              AS total_active_jobs,
        COUNT(DISTINCT country_code)                          AS total_countries,
        (SELECT COUNT(DISTINCT js.skill_id)
         FROM job_skills js
         JOIN jobs j ON j.id = js.job_id
         WHERE j.is_active = TRUE)                            AS total_skills,
        ROUND(
          SUM(CASE WHEN salary_mid IS NOT NULL
                    AND salary_is_predicted = FALSE
                    AND salary_mid >= 1000
                   THEN 1 ELSE 0 END) * 100.0
          / NULLIF(COUNT(*), 0)
        , 1)                                                  AS pct_with_salary,
        MAX(posted_at)                                        AS last_updated
      FROM jobs
      WHERE is_active = TRUE
    `);

    res.json(result.rows[0]);
  } catch (err) {
    errorHandler(res, err, "stats-summary");
  }
});
