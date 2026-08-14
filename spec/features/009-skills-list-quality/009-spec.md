# 009 · Calidad de datos en el autocomplete de skills del mapa

**Estado:** en curso

> Igual que la 008, no es parte del rediseño Halo — es un fix de
> integridad de datos, esta vez descubierto en el autocomplete de skills
> de `EuropeMap` ("Ofertas por país en Europa"). Se documenta con la
> misma rigurosidad SDD por tocar `api/` y cambiar el comportamiento
> observable de un endpoint ya existente.

## Qué hace

El autocomplete de skills del mapa (`SkillAutocomplete.jsx`) deja de
sugerir entradas basura sin ningún uso real — fragmentos de texto de
ofertas, nombres compuestos ("React/Angular"), títulos de puesto y demás
ruido acumulado en la tabla `skills`. Solo se muestran skills con al
menos una oferta activa real detrás.

De paso, tras un análisis exhaustivo de todo lo que depende de este
mismo dato, se corrige también el KPI "Skills rastreadas"
(`GET /api/stats/summary`, campo `total_skills`),
que tenía exactamente el mismo problema con la misma causa raíz — ver
"Análisis de impacto" más abajo.

**Archivos afectados:** `api/src/index.js` (endpoints `GET
/api/skills/list` y `GET /api/stats/summary`). En el frontend, un único
comentario de documentación desactualizado en `SkillAutocomplete.jsx`
(sin cambio de comportamiento).

### El problema, con datos reales

- La tabla `skills` tiene 4557 filas. `GET /api/skills/list`
  (`api/src/index.js:44-55`) las devuelve **todas**, sin ningún filtro:
  `SELECT name, category FROM skills ORDER BY name ASC`.
- `SkillAutocomplete.jsx` filtra en cliente con un `includes()`
  case-insensitive sobre lo que reciba — su lógica es correcta, el
  problema es la calidad de los datos que le llegan.
- Verificado con la API real: de las 35 filas de `skills` que contienen
  "react", **34 tienen 0 ofertas activas** vinculadas (comprobado una a
  una contra `GET /api/jobs/offers-by-country?skill=<nombre exacto>`,
  que hace coincidencia exacta). Solo la fila limpia "React" tiene
  ofertas reales (4464). El mismo patrón se repite con otras búsquedas
  (Python, Angular, Agile...).
- `api/schema.sql` confirma que `skills` es un "catálogo normalizado...
  se puebla progresivamente a medida que el NLP detecta nuevos
  términos" — las entradas sucias son artefactos acumulados de
  extracción NLP, no información real que haya que reinterpretar o
  redistribuir.
- Los demás endpoints que consumen skills (`/api/skills/top`,
  `/api/skills/cooccurrence`) ya son inmunes a este problema: al hacer
  `JOIN job_skills`/`JOIN jobs`, una skill sin ofertas reales
  simplemente no genera fila de salida. Solo `/api/skills/list` vuelca
  la tabla `skills` cruda, precisamente porque su comentario actual dice
  explícitamente que no filtra por ofertas activas.

### Análisis de impacto — qué más depende de este dato

Análisis exhaustivo de todo lo que pudiera quedar desactualizado por
este cambio:

- **KPI "Skills rastreadas"** (`GET /api/stats/summary`, campo
  `total_skills`) — mismo root cause exacto: `(SELECT COUNT(*) FROM
  skills)` sin filtrar. Se muestra en `SummaryStats.jsx` (hero del
  dashboard) **y** en `LandingPage.jsx` (zona congelada), ambos leyendo
  el mismo campo de la misma respuesta. **Ahora corregido** con el mismo
  patrón `WHERE EXISTS`, en el mismo endpoint que ya se estaba tocando.
  No requiere tocar ningún archivo de `src/components/landing/` — el
  fix es puramente de backend, la landing solo deja de recibir un
  número desactualizado.
- **Descripción del mapa** (`ChartDescription` en `EuropeMap.jsx`) —
  revisada, no afirma nada sobre "todas las skills conocidas" ni sobre
  cantidades. No estaba desactualizada, no requiere cambios.
- **Avisos ⓘ de filtros ignorados** (`FilterWarningPopover` en el mapa)
  — solo cubren el filtro de país; no tienen relación con la calidad del
  catálogo de skills. No requieren cambios.
- **Filtro de categoría de skill** (sidebar, `skillCategoria`) — lista
  estática hardcodeada en `config/filters.js`, no se alimenta de
  `/api/skills/list`. No afectado.
- **Comentario de prop en `SkillAutocomplete.jsx`** — decía "con todas
  las skills de la BD"; actualizado para reflejar el nuevo criterio (sin
  cambio de comportamiento, solo documentación).

## Por qué

Buscar cualquier skill en el mapa (ej. "React") devuelve un aluvión de
entradas sin sentido ("React/Angular", "WEB(React)", "React Typescript
CSS"). Se investigó con datos reales del backend (no simulados) antes de
proponer el fix.

## Criterios de aceptación

- [ ] `GET /api/skills/list` solo devuelve skills con al menos una
      oferta **activa** real vinculada vía `job_skills`.
- [ ] La forma de la respuesta no cambia (`[{name, category}, ...]`).
- [ ] Ningún archivo de frontend cambia de comportamiento —
      `SkillAutocomplete.jsx`, `EuropeMap.jsx` y `getSkillsList()` siguen
      igual (el único cambio en `SkillAutocomplete.jsx` es un comentario
      de documentación desactualizado, sin efecto funcional).
- [ ] Verificado con datos reales del backend: buscar "react" en la
      lista filtrada devuelve solo la entrada limpia "React" (1 de 35).
      Repetido con al menos 2 términos más sin perder ninguna skill real.
- [ ] El tamaño total de la lista se reduce de forma sustancial (de
      4557 filas a un orden de magnitud menor), señal de que el filtro
      tiene efecto real sin vaciar el autocomplete.
- [ ] `GET /api/stats/summary` (`total_skills`) usa el mismo criterio
      que `/api/skills/list` y devuelve el mismo número — consistencia
      entre el KPI y el autocomplete.
- [ ] `npx vitest run` (frontend y `api/`) sin regresiones.
- [ ] `npm run build` sin errores.
- [ ] La landing no ha sido modificada.
- [ ] `api/schema.sql` protegido en `.gitignore` — nunca se sube a
      GitHub.

## Fuera de alcance

- Cualquier limpieza de la tabla `skills` en sí (borrar filas, añadir
  tabla de alias/normalización) — no es competencia de este repo, la BD
  es de un proyecto externo; el fix vive enteramente en la query del
  endpoint, sin tocar el esquema ni los datos.
- Cambios en `SkillAutocomplete.jsx`/`EuropeMap.jsx` — su lógica ya es
  correcta, el problema era puramente la calidad de los datos recibidos.
