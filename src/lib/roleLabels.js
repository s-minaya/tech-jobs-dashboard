// Mapeo de los nombres de rol que vienen de la BD (snake_case)
// a las etiquetas legibles que se muestran en el frontend.
export const ROLE_LABELS = {
  data_engineer: "Data Engineer",
  data_scientist: "Data Scientist",
  data_analyst: "Data Analyst",
  ml_engineer: "ML Engineer",
};

// Convierte un snake_case key al label legible.
// Si no encuentra el key devuelve el original como fallback.
export function getRoleLabel(key) {
  return ROLE_LABELS[key] ?? key;
}
