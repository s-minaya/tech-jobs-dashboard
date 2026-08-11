// devCache.js
// ⚠️ TEMPORAL — herramienta de desarrollo, no forma parte de ninguna
// feature ni debería llegar a producción tal cual.
//
// Caché en disco (no en memoria) para las respuestas GET de la API.
// Objetivo: mientras trabajamos con la BD real tan lenta/inestable,
// evitar repetir la misma query pesada cada vez que recargamos la
// página, volvemos a probar el mismo filtro, o el propio servidor se
// reinicia — que con `node --watch` pasa en cada guardado de archivo, lo
// que borraría una caché en memoria constantemente durante el propio
// desarrollo. Al ser en disco, sobrevive a esos reinicios.
//
// No invalida por escritura (aquí no hay escrituras desde el dashboard,
// así que no hace falta) y el TTL es corto a propósito para no esconder
// cambios reales de datos durante mucho tiempo.
//
// Para quitarlo cuando ya no haga falta: borrar este archivo, la línea
// `app.use(devCacheMiddleware)` en index.js, y la carpeta `.dev-cache/`
// (ya está en .gitignore).
import fs from "fs";
import path from "path";
import crypto from "crypto";

const CACHE_DIR = path.join(process.cwd(), ".dev-cache");
const TTL_MS = 5 * 60 * 1000; // 5 minutos — ajustable

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function keyToFile(key) {
  const hash = crypto.createHash("md5").update(key).digest("hex");
  return path.join(CACHE_DIR, `${hash}.json`);
}

export function devCacheMiddleware(req, res, next) {
  if (req.method !== "GET") return next();

  const file = keyToFile(req.originalUrl);

  if (fs.existsSync(file)) {
    try {
      const { time, body } = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Date.now() - time < TTL_MS) {
        res.setHeader("X-Dev-Cache", "HIT");
        return res.json(body);
      }
    } catch {
      // archivo corrupto o a medio escribir — lo ignoramos y seguimos
      // como si fuera un miss, se sobrescribirá abajo.
    }
  }

  res.setHeader("X-Dev-Cache", "MISS");
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Solo cacheamos respuestas 200 — un error no debería quedar servido
    // durante 5 minutos si el problema real ya se solucionó.
    if (res.statusCode === 200) {
      fs.writeFileSync(file, JSON.stringify({ time: Date.now(), body }));
    }
    return originalJson(body);
  };
  next();
}
