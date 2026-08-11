# spec/ — Spec Driven Development

> Documentación del rediseño del Tech Jobs Dashboard al design system Halo.
> Primero se escribe la spec, luego el plan, luego las tareas, y solo entonces se toca el código.

## Estructura

```
spec/
├── constitution/                      ← reglas estables del proyecto (cambian poco)
│   ├── mission.md                     ← qué construimos y para quién
│   ├── tech-stack.md                  ← tecnologías, convenciones y límites
│   └── roadmap.md                     ← orden de las features
└── features/                          ← una carpeta por feature
    ├── 001-halo-tokens/               ← Fase 1: design tokens y tipografía
    ├── 002-halo-chartcard/            ← Fase 2: ChartCard → Halo card
    ├── 003-halo-stat-tiles/           ← Fase 3: KPI cards → Stat Tile
    ├── 004-halo-filtros/              ← Fase 4: sistema de filtros → Halo
    ├── 005-halo-bottomnav/            ← Fase 5: BottomNav → Halo
    ├── 006-halo-hero/                 ← Fase 6: hero del dashboard → Halo
    ├── 007-halo-charts-internals/     ← Fase 7: colores internos de gráficas
    ├── 008-skills-cooccurrence/       ← Fase 8: integridad de datos del heatmap de co-ocurrencia
    ├── 009-skills-list-quality/       ← Fase 9: calidad de datos del autocomplete de skills del mapa
    └── 010-halo-responsive-pulido/    ← Fase 10: responsive y pulido final
```

## Flujo para cada feature

1. Leer `constitution/` — la constitución manda siempre.
2. Escribir `spec.md`: qué hace y criterios de aceptación.
3. Escribir `plan.md`: cómo se implementa y archivos afectados.
4. Desglosar en `tasks.md` y marcar el progreso tarea a tarea.
5. Implementar **solo** lo que dice `tasks.md` de la feature activa.
6. Validar contra los criterios de aceptación de `spec.md`.
7. Actualizar `constitution/roadmap.md`.

> Una sola feature activa a la vez. No se toca código de fases futuras.
