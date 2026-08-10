# Sugerencia — optimizar `/api/salary/by-role-country`

> Documento de solo lectura/sugerencia. No forma parte del rediseño Halo ni
> de ninguna feature activa. `api/` es zona congelada (ver `AGENTS.md`) —
> este archivo no modifica nada ahí, solo propone un cambio para que quien
> lleve el backend lo revise y aplique si le parece bien.

## Contexto

Durante la verificación de la fase 006 se reportó:

> La tabla de Salario mediano anual por rol y país, sale:
> `Error: canceling statement due to statement timeout`

Probando el endpoint directamente (`GET /api/salary/by-role-country`) desde
este entorno:

| Filtro | Tiempo de respuesta |
| --- | --- |
| `periodo=90d` | 13.8 s |
| `periodo=all` (todo el histórico) | 5.3 s |

Ninguna de las dos veces llegó a hacer timeout en este entorno, pero ambas
son demasiado lentas para una gráfica de un dashboard en vivo — el
`statement_timeout` de Postgres que reportó el error probablemente sea más
agresivo en producción, o la BD estaba bajo más carga en ese momento.

**Importante:** estos tiempos se midieron desde el entorno de este agente,
no desde tu máquina ni desde producción — puede haber latencia de red
adicional hacia Supabase que no es representativa. Esto es una sugerencia
razonada a partir de leer la query, no un benchmark confirmado. Recomiendo
correr `EXPLAIN (ANALYZE, BUFFERS)` antes y después del cambio para
confirmar la mejora real.

## La query (`api/src/index.js`, `GET /api/salary/by-role-country`)

```sql
SELECT
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
 WHERE j.is_active = TRUE
   -- + filtros opcionales: country_code, posted_at, contract_type, contract_time, remote
   AND j.role_category IS NOT NULL
   AND j.salary_mid IS NOT NULL
   AND j.salary_is_predicted = FALSE
   AND j.salary_mid >= 1000
 GROUP BY j.country_code, c.name, j.role_category
 ORDER BY j.country_code, median_salary_eur DESC NULLS LAST
```

Se ejecuta en paralelo (`Promise.all`) junto a una segunda query de
`COUNT(DISTINCT j.id)` con el mismo `WHERE`.

## Por qué es lenta (hipótesis)

- `PERCENTILE_CONT` es un agregado ordenado: Postgres necesita los valores
  de `salary_mid` **ordenados dentro de cada grupo** (`country_code`,
  `role_category`) para calcular la mediana.
- Sin un índice que ya deje las filas en ese orden, el plan probable es un
  **Seq Scan** sobre `jobs` (o un índice parcial que no cubre todas las
  columnas necesarias) + **Sort** completo + **GroupAggregate** — caro si
  `jobs` tiene muchas filas.
- Las condiciones fijas de este endpoint (`is_active`, `salary_is_predicted
  = FALSE`, `salary_mid >= 1000`, `role_category IS NOT NULL`) son siempre
  las mismas, así que un **índice parcial** (que solo indexa las filas que
  cumplen esas condiciones) es más pequeño y barato de mantener que un
  índice sobre toda la tabla.

## Índice sugerido

```sql
-- CONCURRENTLY evita bloquear la tabla mientras se crea el índice —
-- importante si esto se aplica sobre la BD de producción con tráfico.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_by_role_country
  ON jobs (country_code, role_category, salary_mid)
  INCLUDE (posted_at, contract_type, contract_time, remote)
  WHERE is_active = TRUE
    AND salary_is_predicted = FALSE
    AND salary_mid >= 1000
    AND role_category IS NOT NULL;

-- Refresca las estadísticas del planificador para que tenga en cuenta
-- el índice nuevo al decidir el plan de ejecución.
ANALYZE jobs;
```

**Por qué estas columnas y en este orden:**
- `country_code, role_category` primero — son las columnas del `GROUP BY`;
  con el índice ordenado así, Postgres puede recorrer un grupo a la vez sin
  un `Sort` aparte para agrupar.
- `salary_mid` tercero — es la columna que `PERCENTILE_CONT` necesita
  ordenada dentro de cada grupo; al venir ya ordenada por el índice,
  potencialmente se evita un sort adicional por grupo.
- `INCLUDE (posted_at, contract_type, contract_time, remote)` — cubre los
  filtros opcionales más comunes (`periodo`, `contrato`, `jornada`,
  `remote` en el frontend) sin tener que ir al heap a buscarlos, sin
  hacerlos parte de la clave de ordenación del índice (que solo tiene
  sentido para `country_code`/`role_category`/`salary_mid`).
- El `WHERE` del índice replica exactamente las condiciones fijas del
  endpoint — el índice solo contiene filas relevantes para esta query.

## Verificación recomendada (antes de aplicar en producción)

```sql
-- Antes del índice — guardar el plan/tiempo actual.
EXPLAIN (ANALYZE, BUFFERS)
SELECT ... -- la query completa de arriba, con valores de ejemplo

-- Crear el índice (ver arriba), luego repetir el EXPLAIN ANALYZE
-- y comparar. Buscar que el plan pase de Seq Scan a Index Scan/
-- Index Only Scan y que el tiempo total baje significativamente.
```

## Alternativa más invasiva (no recomendada como primer paso)

El endpoint lanza la query principal y el `COUNT(DISTINCT j.id)` como dos
queries separadas con el mismo `WHERE`, es decir, escanea `jobs` dos veces.
Se podrían combinar en una sola query con `COUNT(DISTINCT j.id) OVER ()`
para pedir un solo recorrido — pero esto cambia la forma de la respuesta
del endpoint y merece sus propios tests, no es un cambio de "solo índice".
Se documenta aquí por si interesa como una fase futura, no como parte de
esta sugerencia.
