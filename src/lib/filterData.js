import { skillCategories } from "@/data/mockData";

// PENDIENTE: filterTopSkills y filterDemandByRole no filtran por país
// porque el mock no tiene granularidad por país.
// Cuando lleguen datos de Supabase, añadir { pais } como parámetro de filtrado.

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

// PENDIENTE cuando se conecte Supabase:
// El filtro de periodo pasará a trabajar con dos campos reales:
//   - is_active: boolean → para "Activas ahora"
//   - published_at: date → para filtrar por rango de fechas
// La lógica actual de slice() por meses se sustituirá por queries a Supabase:
//   .eq("is_active", true)
//   .gte("published_at", fechaDesde)
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

// TODO: los filtros de contrato, jornada y remote se aplicarán
// en el lado del servidor cuando la API esté lista.
// La BD filtrará las ofertas individuales antes de agregar los datos,
// por lo que estos valores viajarán como query params en cada fetch.
