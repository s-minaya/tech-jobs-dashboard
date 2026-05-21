import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

// Cargamos las variables de entorno desde .env.local
dotenv.config({ path: ".env.local" });

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json({ limit: "25Mb" }));

// Pool de conexiones a PostgreSQL.
// Reutiliza conexiones en lugar de abrir una nueva por cada query.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // requerido por Supabase
});

// Verificamos que la conexión funciona al arrancar el servidor
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err.message);
    return;
  }
  console.log("Conectado a PostgreSQL");
  release();
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Servidor arrancado en http://localhost:${port}`);
});

app.get("/", (req, res) => {
  res.send("Está todo ok");
});

// GET /api/jobs/offers-by-country
// Total de ofertas activas por país — alimenta el mapa coroplético.
app.get("/api/jobs/offers-by-country", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT country_code, country_name, total_jobs
       FROM v_offers_by_country`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener ofertas por país" });
  }
});

// GET /api/skills/top
// Skills más demandadas globalmente.
// Query params opcionales: category
app.get("/api/skills/top", async (req, res) => {
  const { category } = req.query;

  try {
    const conditions = ["1=1"];
    const values = [];

    if (category) {
      values.push(category.toLowerCase());
      conditions.push(`skill_category = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT skill, skill_category, job_count, pct_of_all_jobs
       FROM v_top_skills_global
       WHERE ${conditions.join(" AND ")}
       ORDER BY job_count DESC
       LIMIT 20`,
      values,
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener skills" });
  }
});
// GET /api/skills/cooccurrence
// Skills que aparecen juntas frecuentemente.
app.get("/api/skills/cooccurrence", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT skill, co_skill, role_category, co_count
       FROM v_skill_cooccurrence
       ORDER BY co_count DESC
       LIMIT 500`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener co-ocurrencias" });
  }
});

// GET /api/jobs/demand-by-role
// Evolución mensual de ofertas por rol.
// Query params opcionales: country
app.get("/api/jobs/demand-by-role", async (req, res) => {
  const { country } = req.query;

  try {
    const conditions = ["1=1"];
    const values = [];

    if (country) {
      values.push(country.toLowerCase());
      conditions.push(`country_code = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT month, country_code, role_category, job_count
       FROM v_demand_by_role_monthly
       WHERE ${conditions.join(" AND ")}
       ORDER BY month ASC`,
      values,
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener demanda por rol" });
  }
});

// GET /api/salary/by-role-country
// Salario medio y mediana por rol y país.
// Query params opcionales: country, role
app.get("/api/salary/by-role-country", async (req, res) => {
  const { country, role } = req.query;

  try {
    const conditions = ["1=1"];
    const values = [];

    if (country) {
      values.push(country.toLowerCase());
      conditions.push(`country_code = $${values.length}`);
    }
    if (role) {
      values.push(role);
      conditions.push(`role_category = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT country_code, country_name, role_category,
              job_count, avg_salary_eur, median_salary_eur
       FROM v_salary_by_role_country
       WHERE ${conditions.join(" AND ")}
       ORDER BY country_code, median_salary_eur DESC NULLS LAST`,
      values,
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener salarios" });
  }
});
