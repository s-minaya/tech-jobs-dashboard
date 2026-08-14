-- =============================================================================
-- Feature 010 — índice para GET /api/salary/by-role-country
-- =============================================================================
-- ✅ APLICADO — fase 015 (Business Logic Audit) reintentó este índice
-- contra la BD real con éxito (117.6s, sin timeout). Se deja este
-- archivo como registro histórico; ya no hace falta ejecutarlo de nuevo
-- (CREATE INDEX ... IF NOT EXISTS lo haría un no-op igualmente).
--
-- Instrucciones originales (fase 010, cuando seguía pendiente), sin
-- modificar por debajo de esta línea:
--
-- Aplicar manualmente en el SQL editor de Supabase si el agente no pudo
-- ejecutarlo directamente (conexiones salientes directas a Postgres con
-- credenciales embebidas están bloqueadas en el entorno de desarrollo).
--
-- Por qué hace falta: la query agrupa por (country_code, role_category) y
-- calcula PERCENTILE_CONT sobre salary_mid. El índice existente
-- idx_jobs_salary_mid (country_code, salary_mid) no cubre role_category,
-- así que Postgres no puede usarlo para este GROUP BY — confirmado con
-- pruebas reales de esta sesión: el endpoint responde en 16-22s con la BD
-- sana, o falla con "canceling statement due to statement timeout" bajo
-- carga. Ya se había sugerido en spec/sugerencia-optimizacion-query-salario.md
-- (fase 006) y nunca se aplicó.
--
-- CONCURRENTLY evita bloquear lecturas mientras se construye el índice.
-- No se puede ejecutar dentro de una transacción explícita — si el editor
-- de Supabase envuelve las queries en una transacción automáticamente,
-- ejecutar esta sentencia sola, no junto a otras.
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_by_role_country
    ON jobs (country_code, role_category, salary_mid)
    INCLUDE (posted_at, contract_type, contract_time, remote)
    WHERE is_active = TRUE
      AND salary_is_predicted = FALSE
      AND salary_mid >= 1000
      AND role_category IS NOT NULL;

-- Refresca las estadísticas del planificador para que empiece a
-- considerar el índice nuevo inmediatamente en vez de esperar al
-- autovacuum.
ANALYZE jobs;

-- Verificación opcional — antes de aplicar, comparar con:
--   EXPLAIN (ANALYZE, BUFFERS)
--   SELECT country_code, role_category, COUNT(*), AVG(salary_mid),
--          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary_mid)
--   FROM jobs
--   WHERE is_active = TRUE AND salary_mid IS NOT NULL
--     AND salary_is_predicted = FALSE AND salary_mid >= 1000
--     AND role_category IS NOT NULL
--   GROUP BY country_code, role_category;
-- Debería pasar de un Seq Scan (o un Sort costoso antes de cada
-- PERCENTILE_CONT por grupo) a un Index Scan sobre
-- idx_jobs_salary_by_role_country.
