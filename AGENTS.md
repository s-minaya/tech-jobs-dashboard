# AGENTS.md — Tech Jobs Dashboard

Instrucciones para agentes de IA (Claude Code, OpenCode) que trabajen en este proyecto.
Lee este archivo completo antes de tocar cualquier código.

---

## Proyecto

Dashboard de datos del mercado laboral tech europeo. Visualiza ofertas de empleo,
skills demandadas, salarios y tendencias geográficas en tiempo real desde una BD
PostgreSQL real (Supabase).

**Spec completa:** `spec/` — léela antes de implementar cualquier cosa.
**Constitución:** `spec/constitution/` — las reglas que nunca se rompen.
**Feature activa:** mira `spec/constitution/roadmap.md` para saber qué toca ahora.

---

## Flujo de trabajo obligatorio

1. Leer `spec/constitution/mission.md` y `spec/constitution/tech-stack.md`.
2. Leer el `spec.md`, `plan.md` y `tasks.md` de la feature activa.
3. Implementar **solo** las tareas de la feature activa, en el orden del `tasks.md`.
4. Confirmar cada tarea con el usuario antes de pasar a la siguiente.
5. No tocar archivos fuera del alcance de la feature activa.
6. Al terminar: actualizar `roadmap.md` y hacer commit con Conventional Commits.
7. **NUNCA hagas commit ni push sin confirmación explícita del usuario.**
Al terminar una tarea o un bloque, presenta un resumen de los cambios
y espera aprobación antes de ejecutar `git commit` o `git push`.

**Nunca empieces una feature nueva sin que el usuario lo confirme explícitamente.**

---

## Idioma y convenciones

- **Código:** inglés — nombres de variables, funciones, componentes, props y archivos.
- **Comentarios de código:** español — explican el "por qué", no el "qué".
- **Spec y documentación:** español.
- **Commits:** inglés, formato Conventional Commits:
  - `feat:` nueva funcionalidad
  - `fix:` corrección de bug
  - `refactor:` cambio de estructura sin cambio de comportamiento
  - `test:` añadir o corregir tests
  - `chore:` tareas de mantenimiento (deps, config)
  - `docs:` documentación

---

## Seguridad — CRÍTICO

- **NUNCA leas, imprimas ni reproduzcas** el contenido de `.env`, `.env.local`, `.env.*.local` ni ningún archivo de credenciales.
- Si necesitas saber qué variables de entorno usa el proyecto, lee `.env.example` (sin valores reales).
- Las credenciales de BD y API nunca deben aparecer en código, spec, comentarios ni commits.
- Si por accidente ves una credencial, no la repitas — avisa al usuario y para.

---

## Zonas congeladas — no tocar

- `src/components/landing/` — la landing está congelada. Ninguna modificación.
- `api/` — el backend es responsabilidad de otra persona. Solo leer si es necesario para entender la API.
- Ningún archivo `.env*` — solo lectura de `.env.example`.

---

## Stack y restricciones técnicas

- **Frontend:** React 19 + Vite 7 + Tailwind CSS v4 + CSS custom en `src/index.css`.
- **Sin TypeScript** en el frontend — solo JavaScript (JSX).
- **Design system:** Halo (tokens en `src/index.css`). Ver `spec/constitution/tech-stack.md`.
- **Dual theme:** dark y light mode. Ambos deben funcionar. No eliminar `useTheme.js` ni `ThemeToggle.jsx`.
- **Efectos visuales que se conservan:** `GlowButton`, `Aurora`, `DecryptedText`. No eliminarlos.
- **No añadir dependencias** sin confirmación explícita del usuario.
- **No hardcodear datos** — todo viene de la API a través de `src/services/jobServices.js`.
- **No usar efectos WebGL** (Aurora, DarkVeil, Lightfall) fuera de la landing y el hero del dashboard.

---

## Tests

- Todos los tests deben pasar antes de dar una tarea por terminada: `npx vitest run`.
- Si modificas un componente, actualiza su test correspondiente en `src/tests/`.
- Si renombras un archivo, actualiza todos sus imports y sus tests.
- No borres tests existentes — adáptalos si el componente cambia.
- Los E2E se ejecutan con `npx playwright test` — solo son necesarios al final de una feature completa.

---

## Organización de carpetas

```
src/
├── components/
│   ├── Charts/       ← gráficas individuales
│   ├── Filters/      ← sistema de filtros
│   ├── layout/       ← estructura de página
│   ├── landing/      ← CONGELADA, no tocar
│   └── ui/           ← componentes reutilizables sin dominio
├── hooks/            ← hooks custom
├── lib/              ← utilidades puras
├── services/         ← acceso a la API
├── config/           ← configuración estática
├── mocks/            ← MSW para tests
└── tests/            ← tests, espejando la estructura de src/
```

Si necesitas crear un archivo nuevo, respeta esta estructura.

---

## Antes de cada commit

1. Verificar que `npx vitest run` pasa al 100%.
2. Verificar que `npm run build` no da errores.
3. Revisar el diff — confirmar que no aparece ningún `.env*` ni credencial.
4. Mensaje de commit en inglés, formato Conventional Commits.
