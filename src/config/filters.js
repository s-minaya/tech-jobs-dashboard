// Configuración estática de los filtros del dashboard.
// Cuando se conecte la base de datos, estos datos podrán venir de una API
// y este archivo se podrá eliminar o usar solo como fallback.
export const FILTERS = [
  // fullWidth: true hace que las opciones se muestren en columna en lugar de en fila
  {
    title: "País",
    options: ["Todos", "GB", "DE", "FR", "ES", "NL", "PL", "IT", "AT", "BE"],
  },
  {
    title: "Periodo",
    options: [
      "Últimos 30 días",
      "Últimos 90 días",
      "Últimos 6 meses",
      "Todo el histórico",
    ],
    fullWidth: true,
  },
  {
    title: "Tipo de contrato",
    options: ["Todos", "Permanent", "Contract"],
    fullWidth: true,
  },
  {
    title: "Jornada",
    options: ["Todos", "Full time", "Part time"],
    fullWidth: true,
  },
  {
    title: "Remote",
    options: ["Todos", "Sí", "No"],
    fullWidth: true,
  },
  {
    title: "Categoría de skills",
    options: [
      "Todas",
      "Language",
      "Framework",
      "Cloud",
      "Database",
      "Tool",
      "Methodology",
    ],
  },
];
