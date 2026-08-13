// Configuración estática de los filtros del dashboard.
// Cuando se conecte la base de datos, estos datos podrán venir de una API
// y este archivo se podrá eliminar o usar solo como fallback.
//
// Cada objeto representa un filtro con:
//   key       → identificador único, debe coincidir con las keys de initialFilters en App.jsx
//   title     → texto visible en el sidebar
//   options   → valores seleccionables
//   fullWidth → (opcional) si es true, las opciones se apilan en columna en lugar de en fila
export const FILTERS = [
  {
    key: "pais",
    title: "País",
    options: ["Todos", "DE", "FR", "ES", "NL", "PL", "IT", "AT", "BE"],
  },
  {
    key: "periodo",
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
    key: "contrato",
    title: "Tipo de contrato",
    options: ["Todos", "Permanent", "Contract"],
    fullWidth: true,
  },
  {
    key: "jornada",
    title: "Jornada",
    options: ["Todos", "Full time", "Part time"],
    fullWidth: true,
  },
  {
    key: "remote",
    title: "Remoto",
    options: ["Todos", "Sí", "No"],
    fullWidth: true,
  },
  {
    key: "skillCategoria",
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
