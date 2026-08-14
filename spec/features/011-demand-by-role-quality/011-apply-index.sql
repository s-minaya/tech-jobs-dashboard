-- =============================================================================
-- Feature 011 — índice para GET /api/jobs/demand-by-role
-- =============================================================================
-- ✅ APLICADO — fase 015 (Business Logic Audit) reintentó este índice
-- contra la BD real con éxito (33.6s, sin timeout). Se deja este archivo
-- como registro histórico; ya no hace falta ejecutarlo de nuevo (CREATE
-- INDEX ... IF NOT EXISTS lo haría un no-op igualmente).
--
-- Instrucciones originales (fase 011, cuando seguía pendiente), sin
-- modificar por debajo de esta línea:
--
-- Aplicar manualmente en el SQL editor de Supabase si el agente no pudo
-- ejecutarlo directamente (conexiones salientes directas a Postgres con
-- credenciales embebidas están bloqueadas en el entorno de desarrollo).
--
-- Por qué hace falta: la query agrupa por (role_category) y filtra/agrupa
-- por DATE_TRUNC('month', posted_at). Ningún índice existente cubre ambas
-- columnas juntas: idx_jobs_posted_at es un btree plano sin role_category;
-- idx_jobs_role_category es (role_category, country_code), sin posted_at.
-- Mismo síntoma estructural que motivó idx_jobs_salary_by_role_country en
-- la fase 010 (spec/features/010-salary-chart-quality/010-apply-index.sql).
--
-- role_category encabeza el índice (siempre filtrado con IS NOT NULL y
-- siempre parte del GROUP BY); posted_at es el segundo campo porque se usa
-- tanto para el filtro de rango (periodo) como para el DATE_TRUNC del
-- GROUP BY. country_code queda en INCLUDE (fase 011: dejó de formar parte
-- del SELECT/GROUP BY del endpoint — antes fragmentaba cada mes+rol en una
-- fila por país sin que el frontend lo necesitara — pero sigue siendo un
-- filtro WHERE opcional) junto con contract_type/remote, los otros dos
-- filtros opcionales de buildFilters.js.
--
-- CONCURRENTLY evita bloquear lecturas mientras se construye el índice.
-- No se puede ejecutar dentro de una transacción explícita — si el editor
-- de Supabase envuelve las queries en una transacción automáticamente,
-- ejecutar esta sentencia sola, no junto a otras.
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_demand_by_role
    ON jobs (role_category, posted_at)
    INCLUDE (country_code, contract_type, remote)
    WHERE is_active = TRUE
      AND role_category IS NOT NULL
      AND posted_at IS NOT NULL;

-- Refresca las estadísticas del planificador para que empiece a
-- considerar el índice nuevo inmediatamente en vez de esperar al
-- autovacuum.
ANALYZE jobs;

-- Verificación opcional — antes de aplicar, comparar con:
--   EXPLAIN (ANALYZE, BUFFERS)
--   SELECT DATE_TRUNC('month', posted_at), role_category, COUNT(*)
--   FROM jobs
--   WHERE is_active = TRUE AND role_category IS NOT NULL
--     AND posted_at IS NOT NULL
--   GROUP BY DATE_TRUNC('month', posted_at), role_category;
-- Debería pasar de un Seq Scan a un Index Scan (o Index Only Scan) sobre
-- idx_jobs_demand_by_role.
