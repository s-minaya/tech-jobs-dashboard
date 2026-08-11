# 010 · Calidad de datos y rendimiento — Salario mediano por rol y país

**Estado:** en curso

> Segunda ronda de "tabla por tabla" (tras 008 co-ocurrencia, 009
> autocomplete de skills). Tampoco es parte del rediseño Halo.
>
> **Cambio de proceso**: a partir de esta feature, `api/` deja de ser
> zona congelada — el usuario dio acceso completo para leer y editar el
> backend. La única excepción permanente que queda es `.env.local`
> (nunca leerlo, ni siquiera para depurar). Ver `AGENTS.md`.

## Qué hace

Auditoría exhaustiva de `SalaryChart.jsx` ("Salario mediano anual por rol
y país") y su endpoint `GET /api/salary/by-role-country`, arreglando todo
lo encontrado en una sola feature:

1. **Selección de roles por defecto** deja de ser un efecto colateral del
   `ORDER BY` del backend (país alfabético, salario descendente) y pasa a
   calcularse por volumen real de ofertas (`job_count` sumado entre
   países).
2. **`job_count`** (ya calculado por el backend, descartado hasta ahora)
   se muestra siempre en el tooltip, con una señal visual (opacidad
   reducida) para combinaciones país×rol con menos de 5 ofertas.
3. **`avg_salary_eur`** (ya calculado, descartado hasta ahora) se añade al
   tooltip junto a la mediana.
4. **Eje X** usa el nombre del país en español (`NOMBRES_PAISES`, ya usado
   en el resto de la UI) en vez del código crudo (`DE`).
5. **Nota del filtro de contrato** deja de mezclar inglés ("contract") y
   español en la misma frase.
6. **Mensaje "sin datos"** — con `rows: []` se muestra el mismo mensaje
   que `TopSkillsChart` en vez de un mensaje que culpa al usuario de no
   elegir un rol.
7. **Errores de timeout/pool agotado** del backend se traducen a un
   mensaje comprensible en `ChartCard` (genérico, no solo esta gráfica).
8. **Aviso de carga lenta** — `ChartCard` puede avisar "esto puede tardar"
   tras 6s de carga inicial si el chart lo activa (`SalaryChart` lo
   activa).
9. **`AbortController`** en `useChartData` cancela peticiones obsoletas —
   corrige un agotamiento real del pool de conexiones observado en esta
   sesión (`unable to check out connection from the pool after 15000ms`)
   al cambiar filtros rápido. Afecta a las 4 gráficas que usan el hook.
10. **Backend**: se añade el índice ya propuesto en
    `spec/sugerencia-optimizacion-query-salario.md`
    (`idx_jobs_salary_by_role_country`) y se combinan las dos queries del
    endpoint (agregación + `COUNT(DISTINCT j.id)`) en una sola con
    `SUM(COUNT(*)) OVER ()`.
11. **`v_salary_by_role_country`** (vista SQL duplicada y no usada por
    ningún endpoint) se elimina de `schema.sql`.
12. **`schema.sql`** se sincroniza con la BD real: el `CHECK` de
    `role_category` pasa de 12 a los 16 valores reales (documentación,
    no se ejecuta contra producción, que ya los acepta).

13. **Caché temporal de desarrollo** (`api/src/devCache.js`) — ver la
    sección "⚠️ Añadido temporal" más abajo. No es parte de la
    auditoría/fix en sí, es una herramienta para poder seguir
    trabajando mientras la BD real está lenta/inestable.

**Archivos afectados:** `src/components/Charts/SalaryChart.jsx`,
`src/components/ui/ChartCard.jsx`,
`src/components/ui/ChartDescription.jsx`, `src/hooks/useChartData.js`,
`src/services/jobServices.js`, `src/lib/roleLabels.js`,
`src/lib/filterUtils.js`, `src/lib/errorMessages.js` (nuevo),
`src/components/Charts/DemandByRoleChart.jsx`,
`src/components/Charts/TopSkillsChart.jsx`,
`src/components/Charts/EuropeMap.jsx` (estos tres, solo la línea que
reenvía `signal` — ver `010-plan.md`), `api/src/index.js`,
`api/src/salaryQuery.js` (nuevo), `api/schema.sql`, `AGENTS.md`,
`api/src/devCache.js` (nuevo, temporal), `.gitignore` (entrada para
`api/.dev-cache/`).

## Por qué

El usuario pidió una auditoría exhaustiva de esta gráfica concreta tras
detectar en devtools el timeout ya documentado en la fase 006. La
auditoría (ver `010-plan.md` para el detalle con datos reales de hoy)
encontró problemas de lógica, datos descartados sin razón, UX y
rendimiento que van más allá del índice ya sugerido.

**Datos reales que confirman los hallazgos** (periodo=90d, hoy):
- Los "5 roles por defecto" del gráfico en Austria (primer país
  alfabético) serían `data_engineering, erp_sap, qa_testing, cloud,
  security` — `qa_testing` con solo 3 ofertas, mientras `backend` (62
  ofertas) quedaría fuera.
- 121 combinaciones país×rol; 13.2% tienen &lt;5 ofertas, 22.3% &lt;10, 33.9%
  &lt;20 — un tercio del gráfico se apoya en muestras débiles, mostradas con
  el mismo peso visual que las robustas.
- 16 `role_category` distintos en la respuesta real, frente a los 12
  documentados en el `CHECK` de `schema.sql`.
- El endpoint responde en 16-22s con la BD sana, o falla directamente
  bajo carga (`statement timeout`, pool agotado — ambos reproducidos en
  vivo en esta sesión).

## ⚠️ Añadido temporal — RECORDAR QUITAR

Durante la verificación de esta feature, la BD real estuvo fallando o
tardando 15-120s+ de forma tan consistente (ver "Por qué" arriba) que se
volvió difícil seguir trabajando — cada prueba manual o verificación
repetía la misma query pesada contra Postgres.

Se añadió `api/src/devCache.js`: middleware que cachea en disco (no en
memoria — `node --watch` reinicia el proceso en cada guardado, lo que
borraría una caché en memoria constantemente) todas las respuestas `GET`
con `200 OK`, TTL de 5 minutos, en `api/.dev-cache/` (gitignorado).
Verificado con datos reales: `/api/skills/list` pasó de 40.3s a 14.8ms en
la segunda petición, y sigue en caché incluso tras reiniciar el servidor.

**Esto NO es parte de la auditoría de `SalaryChart` ni debería llegar a
producción tal cual.** Se documenta aquí explícitamente para no
olvidarnos de quitarlo:

- Borrar `api/src/devCache.js`.
- Quitar la línea `app.use(devCacheMiddleware)` (con su import) de
  `api/src/index.js`.
- Quitar la entrada `api/.dev-cache/` de `.gitignore`.
- Borrar la carpeta `api/.dev-cache/` si existe localmente.

No tiene criterio de aceptación propio ni afecta a los de abajo — es
infraestructura de desarrollo, no comportamiento del producto.

## Criterios de aceptación

- [ ] Los roles seleccionados por defecto en `SalaryChart` son los 5 con
      más `job_count` total sumado entre países, no los 5 primeros en el
      orden de llegada de la API.
- [ ] El tooltip muestra siempre el número de ofertas de esa combinación
      país×rol.
- [ ] Las barras de combinaciones país×rol con menos de 5 ofertas se
      renderizan con opacidad reducida.
- [ ] El tooltip muestra la media junto a la mediana.
- [ ] El eje X muestra el nombre del país en español (`NOMBRES_PAISES`),
      no el código de 2 letras ni el nombre en inglés que manda el
      backend.
- [ ] Con el filtro de contrato activo, la nota no contiene ningún valor
      en inglés ("permanent"/"contract").
- [ ] Con `rows: []`, se muestra "No hay datos para los filtros
      seleccionados. Prueba a ampliar el periodo o quitar algún filtro."
      en vez del mensaje de "selecciona un rol".
- [ ] Un error de `statement timeout` o de pool de conexiones agotado se
      muestra traducido y sin el prefijo "Error:" crudo en `ChartCard`;
      un error no reconocido conserva el formato actual (`Error:
      &lt;mensaje&gt;`).
- [ ] Tras 6 segundos de carga inicial, `SalaryChart` muestra un aviso
      adicional de que la consulta puede tardar; las demás gráficas no
      muestran nada nuevo (prop opt-in).
- [ ] Cambiar de filtro rápidamente en cualquiera de las 4 gráficas que
      usan `useChartData` cancela la petición anterior (`AbortController`)
      en vez de dejarla viva.
- [ ] `GET /api/salary/by-role-country` responde con una sola query en
      vez de dos.
- [ ] `api/schema.sql` incluye `idx_jobs_salary_by_role_country`
      (documentado; aplicación manual vía Supabase SQL editor si no se
      puede ejecutar desde este entorno) y ya no incluye
      `v_salary_by_role_country`.
- [ ] `npx vitest run` (frontend y `api/`) sin regresiones.
- [ ] `npm run build` sin errores.
- [ ] `api/schema.sql` sigue protegido en `.gitignore`.
- [ ] `.env.local` nunca leído en ningún momento de la feature.
- [ ] `AGENTS.md` refleja el nuevo acceso a `api/`.
- [ ] La landing no ha sido modificada.

## Fuera de alcance

- **`DemandByRoleChart.jsx`** — mismo patrón roto de "5 roles por
  defecto" (`ORDER BY month ASC` sin relación con demanda real, pese a
  que su propio texto dice "los 5 roles más demandados"). Detectado
  durante esta auditoría pero el usuario pidió ir "tabla por tabla" — se
  abordará en su propia ronda futura.
- **`useHeatmapData.js`** — mismo problema de falta de `AbortController`
  que tenía `useChartData`, pero es un hook independiente sin overlap con
  esta feature.
- **`v_salary_stats_by_country`** — tiene la misma inconsistencia de
  umbral (`salary_mid >= 1000` ausente) que tenía
  `v_salary_by_role_country`, pero es una vista distinta no consumida por
  este endpoint. Se documenta, no se corrige aquí.
- **Filtro de `jornada`** — tiene el mismo problema de traducción que
  `contrato` (`filters.jornada.toLowerCase()` sin traducir en
  `describeFiltros`), pero no fue parte de la auditoría original.
- **Límite/paginación de barras** — evaluado y descartado; ver
  "Decisiones" en `010-plan.md`.
- **Rediseño de la paleta `ROLE_COLORS`** — pertenece al design system
  Halo (fase 007), no a esta feature de calidad de datos.
- **Eliminar `idx_jobs_salary_mid`** — sin visibilidad de si algún
  proceso externo (pipeline de ingesta) lo usa; solo se añade el índice
  nuevo, no se retira el existente.
