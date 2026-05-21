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
