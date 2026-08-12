# 011 · Calidad de datos y rendimiento — Evolución mensual de ofertas por rol

**Estado:** hecho

> Cuarta ronda de "tabla por tabla" (tras 008 co-ocurrencia, 009
> autocomplete de skills, 010 salario por rol y país). Tampoco es parte
> del rediseño Halo.

## Qué hace

Auditoría exhaustiva de `DemandByRoleChart.jsx` ("Evolución mensual de
ofertas por rol") y su endpoint `GET /api/jobs/demand-by-role`, arreglando
todo lo encontrado en una sola feature:

1. **Bug de agregación real con el filtro de país en "Todos" (el valor por
   defecto)**: el backend agrupaba por `(month, country_code,
   role_category)`, fragmentando cada combinación mes+rol en una fila por
   país. El frontend nunca desglosa por país (la gráfica solo tiene mes ×
   rol) pero tampoco sumaba esas filas — se quedaba solo con la última que
   llegaba de Postgres, perdiendo la demanda del resto de países sin
   ningún error visible. Se corrige en el origen: el backend deja de
   seleccionar/agrupar por `country_code` (el filtro `country=` sigue
   funcionando igual, es una condición del `WHERE`).
2. **Selección de roles por defecto** deja de ser el orden de llegada de
   la API (`ORDER BY month ASC`, sin relación con demanda real) y pasa a
   calcularse por volumen real de ofertas, reusando `rankRolesByVolume`
   (ya existía, fase 010, solo para `SalaryChart`).
3. **Backend**: se combinan las dos queries del endpoint (agregación +
   `COUNT(DISTINCT j.id)`) en una sola con `SUM(COUNT(*)) OVER()` — mismo
   patrón que la fase 010.
4. **Índice nuevo** `idx_jobs_demand_by_role` en `(role_category,
   posted_at)` — ningún índice existente cubre ambas columnas juntas.
5. **`v_demand_by_role_monthly`** (vista SQL duplicada, no usada por
   ningún endpoint y desincronizada — le falta `is_active = TRUE`) se
   elimina de `schema.sql`, mismo criterio que `v_salary_by_role_country`
   en la fase 010.
6. **Mensaje "sin datos"** — con `rows: []` se muestra el mismo mensaje
   que `TopSkillsChart`/`SalaryChart` en vez de una gráfica vacía sin
   explicación.
7. **Aviso de carga lenta** — `DemandByRoleChart` activa `slowHint` en
   `ChartCard` (prop ya existente desde la fase 010).
8. **Nota sobre el mes en curso**: el último mes mostrado siempre es el
   mes actual (a medio cerrar), que puede aparecer con menos ofertas que
   los anteriores sin que la demanda esté realmente cayendo — solo porque
   la ingesta de datos es continua. Se añade una nota explicativa.
9. **Limpieza**: `extractRoles` (`roleLabels.js`) se elimina — se queda
   sin ningún consumidor una vez `DemandByRoleChart` pasa a usar
   `rankRolesByVolume`.

**Añadido en la revisión post-implementación** (ver sección homónima en
`011-tasks.md` para el detalle completo):

10. **Filtro de `jornada` habilitado**: estaba excluido sin ninguna razón
    técnica real (`contract_time` es una columna de `jobs` igual que
    `contrato`/`remote`, que sí se aplicaban). El texto que se mostraba al
    usuario era una nota genérica compartida, escrita para el heatmap de
    co-ocurrencia (que sí necesita excluirlo por volumen estadístico), 
    reutilizada aquí sin verificar si aplicaba. Ahora se aplica igual que
    contrato/remote.
11. **Consulta desperdiciada eliminada**: con "Últimos 30 días"
    (`periodoInsuficiente`), el gráfico nunca se renderiza — solo el
    aviso — pero antes se seguía pidiendo igualmente al backend. Ahora se
    salta la petición por completo en ese estado.

**Archivos afectados:** `src/components/Charts/DemandByRoleChart.jsx`,
`src/lib/roleLabels.js`, `src/mocks/handlers.js`, `src/services/jobServices.js`,
`api/src/index.js`, `api/src/demandQuery.js` (nuevo), `api/schema.sql`.

## Por qué

El usuario pidió el mismo tipo de auditoría exhaustiva ya aplicada a
`SalaryChart` (fase 010), esta vez para la gráfica de evolución mensual de
ofertas por rol: lógica incorrecta o inconsistente, aspectos sin sentido
de negocio, mejoras de UX, buenas prácticas, queries más eficientes.

La auditoría (ver `011-plan.md` para el detalle) encontró un bug de
agregación real (no solo cosmético): con el filtro de país en su valor
neutro por defecto, el frontend perdía silenciosamente la demanda de todos
los países salvo el último que llegaba de Postgres para cada combinación
mes+rol — confirmado por lectura del código (`pivotData` sobrescribe en
vez de sumar, y el backend fragmentaba innecesariamente por país). El
resto de hallazgos son variaciones ya conocidas de fases anteriores
(selección de roles por orden de llegada en vez de volumen, dos queries en
vez de una, índice que falta, vista SQL duplicada) aplicadas a este
segundo componente, más un hallazgo de negocio nuevo específico de las
series temporales mensuales (mes en curso incompleto).

**Nota sobre esta feature en concreto**: a diferencia de las fases 008-010,
los hallazgos de esta ronda se confirmaron por lectura exhaustiva del
código real (backend, frontend, `schema.sql`) en fase de planificación, no
con datos en vivo de la BD (no se intentó consultar la BD real durante la
planificación). La verificación contra el backend real se realiza durante
la implementación, con el mismo patrón de transparencia de toda la sesión
si el sandbox no puede completarla.

## Criterios de aceptación

- [x] Con el filtro de país en "Todos" (valor por defecto) y varios países
      con ofertas del mismo rol en el mismo mes, la demanda mostrada suma
      todos los países en vez de mostrar solo uno.
- [x] Los roles seleccionados por defecto en `DemandByRoleChart` son los 5
      con más `job_count` total, no los 5 primeros en el orden de llegada
      de la API.
- [x] `GET /api/jobs/demand-by-role` responde con una sola query en vez de
      dos, y ya no selecciona ni agrupa por `country_code`.
- [x] `api/schema.sql` incluye `idx_jobs_demand_by_role` (documentado;
      aplicación manual vía Supabase SQL editor si no se puede ejecutar
      desde este entorno) y ya no incluye `v_demand_by_role_monthly`.
- [x] Con `rows: []`, se muestra "No hay datos para los filtros
      seleccionados. Prueba a ampliar el periodo o quitar algún filtro."
      en vez de una gráfica vacía sin mensaje.
- [x] Tras 6 segundos de carga inicial, `DemandByRoleChart` muestra el
      aviso de `slowHint` de `ChartCard`.
- [x] La nota del gráfico menciona que el criterio de selección es por
      volumen total y que el último mes puede estar incompleto.
- [x] `extractRoles` ya no existe en `roleLabels.js` ni en sus tests.
- [x] El filtro de `jornada` afecta a los datos de `DemandByRoleChart`
      (verificado contra la BD real: `full_time` y `part_time` devuelven
      totales distintos entre sí y del total sin filtrar).
- [x] Con "Últimos 30 días", `GET /api/jobs/demand-by-role` no se llama
      (verificado con test de conteo de llamadas a la API mockeada).
- [x] `npx vitest run` (frontend y `api/`) sin regresiones.
- [x] `npm run build` sin errores.
- [x] `api/schema.sql` sigue protegido en `.gitignore`.
- [x] `.env.local` nunca leído en ningún momento de la feature.
- [x] La landing no ha sido modificada.

## Fuera de alcance

- **Filtro de `jornada` sin traducir en `describeFiltros`** — mismo gap ya
  documentado y diferido en la fase 010, sigue aplicando en general
  (afecta al pill de jornada quando está activo en cualquier gráfica que
  lo muestre). Ya no es relevante como "fuera de alcance" específico de
  esta gráfica: la revisión post-implementación (ver `011-tasks.md`)
  habilitó `jornada` como filtro real aquí, así que su pill sí puede
  llegar a mostrarse — con el mismo texto sin traducir que ya tienen el
  resto de gráficas. Se mantiene fuera de alcance como deuda transversal,
  no se corrige en esta feature.
- **`/api/skills/top` también excluye `jornada` sin razón aparente** —
  mismo tipo de hallazgo detectado durante la revisión post-implementación
  de esta feature (ver `011-tasks.md`), pero es una gráfica distinta
  (`TopSkillsChart`) ya cerrada en una fase anterior. Se documenta como
  candidato a su propia ronda futura, no se toca aquí.
- **Ocultar el mes en curso** — evaluado y descartado; ver "Decisiones" en
  `011-plan.md`. Se avisa con una nota en vez de quitar datos reales.
- **Suma defensiva en `pivotData`** — evaluado y descartado; el fix real
  vive en el backend (quitar `country_code` del `GROUP BY`), no en el
  frontend. Ver "Decisiones" en `011-plan.md`.
- **Rediseño de `ROLE_COLORS`** — pertenece al design system Halo (fase
  007), no a esta feature de calidad de datos.
- **Eliminar `idx_jobs_posted_at`/`idx_jobs_role_category`** — cada uno
  cubre un patrón de acceso distinto al del índice nuevo; sin visibilidad
  de qué más los usa, solo se añade el nuevo.
