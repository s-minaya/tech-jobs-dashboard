// Mapeo de los nombres de rol que vienen de la BD (snake_case)
// a las etiquetas legibles que se muestran en el frontend.
export const ROLE_LABELS = {
  data_engineering: "Data Engineering",
  data_science: "Data Science",
  data_analyst: "Data Analyst",
  ai_ml: "AI / ML",
  backend: "Backend",
  frontend: "Frontend",
  fullstack: "Fullstack",
  devops: "DevOps",
  cloud: "Cloud",
  security: "Security",
  mobile: "Mobile",
  sysadmin: "Sysadmin",
  management: "Management",
  qa_testing: "QA / Testing",
  erp_sap: "ERP / SAP",
  other: "Other",
};

// Convierte un snake_case key al label legible.
// Si no encuentra el key devuelve el original como fallback.
export function getRoleLabel(key) {
  return ROLE_LABELS[key] ?? key;
}

// ── Colores por rol ──────────────────────────────────────────────────────────
// Cada rol tiene su propio color, agrupados por familia semántica pero con
// variaciones de tono para que sean distinguibles dentro del mismo grupo.
//
// Familia Dev      → índigos   (backend oscuro → fullstack claro)
// Familia Data     → esmeraldas (data_eng oscuro → data_analyst claro)
// Familia Infra    → ámbar/verde (devops oscuro → sysadmin claro)
// Familia AI/Esp   → rosas/coralEs (ai_ml → erp_sap)
// Cajones de sastre → slate neutro (management, other)
// ────────────────────────────────────────────────────────────────────────────
export const ROLE_COLORS = {
  // Dev — índigos
  backend: "var(--role-backend)",
  frontend: "var(--role-frontend)",
  fullstack: "var(--role-fullstack)",

  // Data — esmeraldas
  data_engineering: "var(--role-data-engineering)",
  data_science: "var(--role-data-science)",
  data_analyst: "var(--role-data-analyst)",

  // Infra — ámbar/teal
  devops: "var(--role-devops)",
  cloud: "var(--role-cloud)",
  sysadmin: "var(--role-sysadmin)",

  // AI / Especialidad — rosas y corales
  ai_ml: "var(--role-ai-ml)",
  security: "var(--role-security)",
  mobile: "var(--role-mobile)",
  qa_testing: "var(--role-qa-testing)",
  erp_sap: "var(--role-erp-sap)",

  // Cajones de sastre — neutros azulados
  management: "var(--role-management)",
  other: "var(--role-other)",
};

export function getRoleColor(key) {
  return ROLE_COLORS[key] ?? "var(--chart-1)";
}

// rankRolesByVolume
// Devuelve los roles presentes en las filas, ordenados de mayor a menor
// según el total de ofertas agregado (sumando job_count entre todos los
// meses/países presentes) — no el orden de llegada de la API, que
// responde al ORDER BY del backend (en SalaryChart: país alfabético,
// salario descendente; en DemandByRoleChart: mes ascendente) y no tiene
// relación con qué roles son más demandados. La usan SalaryChart (fase
// 010) y DemandByRoleChart (fase 011) para calcular la selección de roles
// por defecto. Ejemplo real (periodo=90d, Austria, SalaryChart): con el
// orden de llegada, "qa_testing" entraba en el "top 5" con solo 3 ofertas
// mientras "backend" con 62 quedaba fuera — ver
// spec/features/010-salary-chart-quality/010-spec.md.
export function rankRolesByVolume(rows) {
  const totals = new Map();
  for (const { role_category, job_count } of rows) {
    totals.set(
      role_category,
      (totals.get(role_category) ?? 0) + Number(job_count ?? 0),
    );
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([role]) => role);
}
