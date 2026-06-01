/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json({ limit: "25Mb" }));

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

// buildFilters
// Convierte los query params en condiciones SQL para el WHERE.
// Solo genera condiciones sobre el alias 'j' (tabla jobs).
// Los filtros que implican otras tablas (ej: skills alias 's') se añaden
// fuera de esta función para no contaminar los values de otras queries.
function buildFilters(query, existingValues = []) {
  const conditions = [];
  const values = [...existingValues];

  conditions.push("j.is_active = TRUE");

  if (query.country) {
    values.push(query.country.toLowerCase());
    conditions.push(`j.country_code = $${values.length}`);
  }

  const periodoMap = { "30d": "30 days", "90d": "90 days", "180d": "180 days" };
  const intervalo = periodoMap[query.periodo];
  if (intervalo) {
    values.push(intervalo);
    conditions.push(`j.posted_at >= NOW() - $${values.length}::interval`);
  }

  if (query.contrato) {
    values.push(query.contrato.toLowerCase());
    conditions.push(`j.contract_type = $${values.length}`);
  }

  if (query.jornada) {
    values.push(query.jornada.toLowerCase());
    conditions.push(`j.contract_time = $${values.length}`);
  }

  if (query.remote === "true" || query.remote === "false") {
    values.push(query.remote === "true");
    conditions.push(`j.remote = $${values.length}`);
  }

  return { conditions, values };
}

// errorHandler
// Devuelve el mensaje real de PostgreSQL al cliente para facilitar el diagnóstico.
function errorHandler(res, err, context) {
  console.error(`[${context}]`, err.message);
  res.status(500).json({ error: `Error en ${context}`, detail: err.message });
}

// GET /api/jobs/offers-by-country
// Filtros que aplican: periodo, contrato, jornada, remote.
// País NO aplica: el mapa siempre muestra todos los países.
app.get("/api/jobs/offers-by-country", async (req, res) => {
  try {
    const { country: _ignored, ...restQuery } = req.query;
    const { conditions, values } = buildFilters(restQuery);

    const result = await pool.query(
      `SELECT j.country_code, c.name AS country_name, COUNT(*) AS total_jobs
       FROM jobs j
       JOIN countries c ON c.code = j.country_code
       WHERE ${conditions.join(" AND ")}
       GROUP BY j.country_code, c.name
       ORDER BY total_jobs DESC`,
      values,
    );

    const total = result.rows.reduce((sum, r) => sum + Number(r.total_jobs), 0);
    res.json({ rows: result.rows, total_matching_jobs: total });
  } catch (err) {
    errorHandler(res, err, "offers-by-country");
  }
});

// GET /api/jobs/demand-by-role
// Filtros que aplican: país, periodo, contrato, remote.
// Jornada NO aplica: la tendencia mensual de roles no cambia significativamente por jornada.
// Categoría de skill NO aplica: los roles no dependen de la categoría de skill.
app.get("/api/jobs/demand-by-role", async (req, res) => {
  try {
    const { jornada: _j, ...filtrosAplicables } = req.query;
    const { conditions, values } = buildFilters(filtrosAplicables);
    conditions.push("j.role_category IS NOT NULL");
    conditions.push("j.posted_at IS NOT NULL");

    const [demandResult, totalResult] = await Promise.all([
      pool.query(
        `SELECT
           DATE_TRUNC('month', j.posted_at) AS month,
           j.country_code,
           j.role_category,
           COUNT(*) AS job_count
         FROM jobs j
         WHERE ${conditions.join(" AND ")}
         GROUP BY DATE_TRUNC('month', j.posted_at), j.country_code, j.role_category
         ORDER BY month ASC`,
        values,
      ),
      pool.query(
        `SELECT COUNT(DISTINCT j.id)::int AS total
         FROM jobs j WHERE ${conditions.join(" AND ")}`,
        values,
      ),
    ]);

    res.json({
      rows: demandResult.rows,
      total_matching_jobs: totalResult.rows[0].total,
    });
  } catch (err) {
    errorHandler(res, err, "demand-by-role");
  }
});

// GET /api/salary/by-role-country
// Filtros que aplican: país, periodo, contrato, jornada, remote.
// Categoría de skill NO aplica: el salario no depende de qué categoría de skill se busca.
// Excluye salary_mid < 1000 porque son datos corruptos del pipeline
// (salarios por hora o mensuales importados sin convertir a escala anual).
app.get("/api/salary/by-role-country", async (req, res) => {
  try {
    const { conditions, values } = buildFilters(req.query);
    conditions.push("j.role_category IS NOT NULL");
    conditions.push("j.salary_mid IS NOT NULL");
    conditions.push("j.salary_is_predicted = FALSE");
    conditions.push("j.salary_mid >= 1000");

    const [salaryResult, totalResult] = await Promise.all([
      pool.query(
        `SELECT
           j.country_code,
           c.name AS country_name,
           j.role_category,
           COUNT(*) AS job_count,
           ROUND(AVG(j.salary_mid)) AS avg_salary_eur,
           ROUND(
             PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY j.salary_mid)::numeric
           ) AS median_salary_eur
         FROM jobs j
         JOIN countries c ON c.code = j.country_code
         WHERE ${conditions.join(" AND ")}
         GROUP BY j.country_code, c.name, j.role_category
         ORDER BY j.country_code, median_salary_eur DESC NULLS LAST`,
        values,
      ),
      pool.query(
        `SELECT COUNT(DISTINCT j.id)::int AS total
         FROM jobs j WHERE ${conditions.join(" AND ")}`,
        values,
      ),
    ]);

    res.json({
      rows: salaryResult.rows,
      total_matching_jobs: totalResult.rows[0].total,
    });
  } catch (err) {
    errorHandler(res, err, "salary-by-role-country");
  }
});

// GET /api/skills/top
// Filtros que aplican: país, periodo, contrato, remote, category.
// Jornada NO aplica: las skills más demandadas no cambian significativamente por jornada.
// Sin periodo explícito aplica 90 días por defecto.
//
// ESTRUCTURA DE VALUES CRÍTICA:
// valuesForCount se clona ANTES de añadir el valor de category a values.
// Si se clonara después, la query COUNT recibiría un valor extra ($N) que
// no referencia ningún placeholder en su SQL, y PostgreSQL devuelve:
// "bind message supplies N parameters, but prepared statement requires M".
app.get("/api/skills/top", async (req, res) => {
  try {
    const { jornada: _j, ...filtrosAplicables } = req.query;
    const { conditions: conditionsJobs, values } =
      buildFilters(filtrosAplicables);

    if (!filtrosAplicables.periodo || filtrosAplicables.periodo === "all") {
      conditionsJobs.push("j.posted_at >= NOW() - INTERVAL '90 days'");
    }

    // Clonamos values ANTES de añadir category.
    // La query COUNT usa solo conditionsJobs (sin alias 's') y recibe este clon.
    // Si añadiéramos category a values antes de clonar, la query COUNT recibiría
    // un parámetro extra que su SQL no referencia → error de PostgreSQL.
    const valuesForCount = [...values];

    const conditionsWithSkills = [...conditionsJobs];
    if (filtrosAplicables.category) {
      values.push(filtrosAplicables.category.toLowerCase());
      conditionsWithSkills.push(`s.category = $${values.length}`);
    }

    const limit = filtrosAplicables.category ? 50 : 20;

    const [skillsResult, totalResult] = await Promise.all([
      pool.query(
        `SELECT
           s.name AS skill,
           s.category AS skill_category,
           COUNT(*) AS job_count,
           ROUND(
             COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0),
           2) AS pct_of_all_jobs
         FROM job_skills js
         JOIN jobs j ON j.id = js.job_id
         JOIN skills s ON s.id = js.skill_id
         WHERE ${conditionsWithSkills.join(" AND ")}
         GROUP BY s.name, s.category
         ORDER BY job_count DESC
         LIMIT $${values.length + 1}`,
        [...values, limit],
      ),
      pool.query(
        `SELECT COUNT(DISTINCT j.id)::int AS total
         FROM job_skills js
         JOIN jobs j ON j.id = js.job_id
         WHERE ${conditionsJobs.join(" AND ")}`,
        valuesForCount,
      ),
    ]);

    res.json({
      rows: skillsResult.rows,
      total_matching_jobs: totalResult.rows[0].total,
    });
  } catch (err) {
    errorHandler(res, err, "skills-top");
  }
});

// GET /api/skills/cooccurrence
// Filtros que aplican: periodo, contrato, remote.
// País NO aplica: las co-ocurrencias se calculan globalmente para tener
// suficientes datos estadísticos (por país habría muy pocos pares).
// Jornada NO aplica: marginal en co-ocurrencias.
// Sin periodo explícito aplica 90 días por defecto.
app.get("/api/skills/cooccurrence", async (req, res) => {
  try {
    const { country: _c, jornada: _j, ...filtrosAplicables } = req.query;
    const { conditions, values } = buildFilters(filtrosAplicables);

    if (!filtrosAplicables.periodo || filtrosAplicables.periodo === "all") {
      conditions.push("j.posted_at >= NOW() - INTERVAL '90 days'");
    }

    const [coOccResult, totalResult] = await Promise.all([
      pool.query(
        `SELECT
           s1.name AS skill,
           s2.name AS co_skill,
           j.role_category,
           COUNT(DISTINCT js1.job_id) AS co_count
         FROM job_skills js1
         JOIN job_skills js2 ON js1.job_id = js2.job_id AND js1.skill_id < js2.skill_id
         JOIN skills s1 ON s1.id = js1.skill_id
         JOIN skills s2 ON s2.id = js2.skill_id
         JOIN jobs j ON j.id = js1.job_id
         WHERE ${conditions.join(" AND ")}
         GROUP BY s1.name, s2.name, j.role_category
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
