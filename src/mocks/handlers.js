import { http, HttpResponse } from "msw";

// handlers.js
// Define los handlers de MSW: qué respuesta devolver para cada URL.
// Se usan en todos los tests que implican peticiones fetch al backend.
//
// Los datos de prueba son suficientemente representativos para testear
// la lógica del componente, pero no tan detallados que sean difíciles
// de mantener. Si un endpoint cambia su formato, solo hay que actualizar
// el handler correspondiente aquí.

// URL base que usa la app. En tests, VITE_API_URL no está definida,
// así que las peticiones van a una URL relativa o vacía.
// MSW intercepta por path, así que el origen no importa.
const BASE = "";

export const handlers = [
  // GET /api/stats/summary
  // Usado por SummaryStats
  http.get(`${BASE}/api/stats/summary`, () => {
    return HttpResponse.json({
      total_active_jobs: 26023,
      total_countries: 8,
      total_skills: 312,
      pct_with_salary: "34.5",
      last_updated: "2025-05-15T10:30:00.000Z",
    });
  }),

  // GET /api/skills/list
  // Usado por EuropeMap (autocomplete)
  http.get(`${BASE}/api/skills/list`, () => {
    return HttpResponse.json([
      { name: "Python", category: "language" },
      { name: "React", category: "framework" },
      { name: "PostgreSQL", category: "database" },
      { name: "AWS", category: "cloud" },
      { name: "Docker", category: "tool" },
    ]);
  }),

  // GET /api/jobs/offers-by-country
  // Usado por EuropeMap
  http.get(`${BASE}/api/jobs/offers-by-country`, () => {
    return HttpResponse.json({
      rows: [
        { country_code: "de", country_name: "Germany", total_jobs: 5350 },
        { country_code: "fr", country_name: "France", total_jobs: 5355 },
        { country_code: "es", country_name: "Spain", total_jobs: 3200 },
        { country_code: "nl", country_name: "Netherlands", total_jobs: 2100 },
      ],
      total_matching_jobs: 16005,
    });
  }),

  // GET /api/skills/top
  // Usado por TopSkillsChart y useHeatmapData. Sin pct_of_all_jobs (fase
  // 013: campo eliminado del backend — se calculaba mal con category
  // activo y ningún componente lo consumía).
  http.get(`${BASE}/api/skills/top`, () => {
    return HttpResponse.json({
      rows: [
        { skill: "Python", skill_category: "language", job_count: 2065 },
        { skill: "SQL", skill_category: "language", job_count: 1890 },
        { skill: "JavaScript", skill_category: "language", job_count: 1750 },
        { skill: "React", skill_category: "framework", job_count: 1540 },
        { skill: "AWS", skill_category: "cloud", job_count: 1320 },
      ],
      total_matching_jobs: 26023,
    });
  }),

  // GET /api/jobs/demand-by-role
  // Usado por DemandByRoleChart. Sin country_code (fase 011: el backend
  // dejó de agrupar por país — ver api/src/demandQuery.js).
  http.get(`${BASE}/api/jobs/demand-by-role`, () => {
    return HttpResponse.json({
      rows: [
        {
          month: "2025-02-01T00:00:00.000Z",
          role_category: "backend",
          job_count: 175,
        },
        {
          month: "2025-02-01T00:00:00.000Z",
          role_category: "devops",
          job_count: 98,
        },
        {
          month: "2025-03-01T00:00:00.000Z",
          role_category: "backend",
          job_count: 190,
        },
        {
          month: "2025-03-01T00:00:00.000Z",
          role_category: "devops",
          job_count: 110,
        },
      ],
      total_matching_jobs: 573,
    });
  }),

  // GET /api/salary/by-role-country
  // Usado por SalaryChart
  http.get(`${BASE}/api/salary/by-role-country`, () => {
    return HttpResponse.json({
      rows: [
        {
          country_code: "de",
          country_name: "Germany",
          role_category: "backend",
          job_count: 450,
          avg_salary_eur: 68000,
          median_salary_eur: 65000,
        },
        {
          country_code: "de",
          country_name: "Germany",
          role_category: "data_science",
          job_count: 280,
          avg_salary_eur: 72000,
          median_salary_eur: 69000,
        },
        {
          country_code: "fr",
          country_name: "France",
          role_category: "backend",
          job_count: 380,
          avg_salary_eur: 58000,
          median_salary_eur: 55000,
        },
      ],
      total_matching_jobs: 1110,
    });
  }),

  // GET /api/skills/cooccurrence
  // Usado por useHeatmapData
  // Sin role_category: el backend ya no lo devuelve (agruparlo por rol
  // fragmentaba cada par en varias filas con un co_count parcial en vez
  // del total real — ver el comentario en api/src/index.js).
  //
  // Los 5 pares conectan las 5 skills de /api/skills/top entre sí con
  // grado >= 2 cada una (Python-SQL, Python-AWS, React-JavaScript,
  // Python-JavaScript, SQL-AWS, React-Python) para que sobrevivan al
  // umbral de conectividad mínima de filterSkillsWithCoOccurrence
  // (minDegree=2, minEdgeCount=2 por defecto) — igual que en datos
  // reales, donde las skills más populares suelen estar bien conectadas
  // entre sí. Antes solo había 3 pares (dos pares "aislados" de grado 1),
  // suficiente para el criterio antiguo de "al menos 1 conexión" pero no
  // representativo de un dataset real bajo el criterio k-core actual.
  http.get(`${BASE}/api/skills/cooccurrence`, () => {
    return HttpResponse.json({
      pairs: [
        {
          skill: "Python",
          co_skill: "SQL",
          co_count: 890,
        },
        {
          skill: "Python",
          co_skill: "AWS",
          co_count: 654,
        },
        {
          skill: "React",
          co_skill: "JavaScript",
          co_count: 1200,
        },
        {
          skill: "Python",
          co_skill: "JavaScript",
          co_count: 500,
        },
        {
          skill: "SQL",
          co_skill: "AWS",
          co_count: 400,
        },
        {
          skill: "React",
          co_skill: "Python",
          co_count: 300,
        },
      ],
      total_matching_jobs: 26023,
    });
  }),
];
