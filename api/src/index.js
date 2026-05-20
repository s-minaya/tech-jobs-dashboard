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
