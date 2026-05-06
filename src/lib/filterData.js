import { skillCategories } from "@/data/mockData";

// Filtra el array de top skills según la categoría seleccionada.
// Si la categoría es "Todas" devuelve todos los datos sin filtrar.
export function filterTopSkills(data, { skillCategoria }) {
  if (skillCategoria === "Todas") return data;
  return data.filter(({ skill }) => skillCategories[skill] === skillCategoria);
}

// Filtra los datos de salario por país seleccionado.
// Si el país es "Todos" devuelve todos los países.
export function filterSalary(data, { pais }) {
  if (pais === "Todos") return data;
  return data.filter(({ country }) => country === pais);
}

// Filtra los datos de ofertas por país para el mapa.
// Si el país es "Todos" devuelve todos los países.
export function filterOffers(data, { pais }) {
  if (pais === "Todos") return data;
  return data.filter(({ country }) => country === pais);
}

// Filtra los meses mostrados según el periodo seleccionado.
// Los datos vienen ordenados del más antiguo al más reciente.
export function filterDemandByRole(data, { periodo }) {
  const sliceMap = {
    "Últimos 30 días": 1,
    "Últimos 90 días": 3,
    "Últimos 6 meses": 6,
    "Todo el histórico": data.length,
  };
  const months = sliceMap[periodo] ?? data.length;
  // Tomamos los últimos N meses del array
  return data.slice(-months);
}
