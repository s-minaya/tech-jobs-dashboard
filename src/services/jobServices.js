const API_URL = import.meta.env.VITE_API_URL;

// Función base para todas las peticiones a la API.
// Lanza un error si la respuesta no es OK (4xx, 5xx)
// para que los componentes puedan capturarlo con .catch()
async function fetchJson(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Error ${res.status} en ${path}`);
  return res.json();
}

// Devuelve las skills más demandadas globalmente.
// Si skillCategoria está definida y no es "Todas", filtra por categoría
// pasando el parámetro a la API para que filtre en la BD.
export async function getTopSkills({ skillCategoria } = {}) {
  const params = new URLSearchParams();
  if (skillCategoria && skillCategoria !== "Todas")
    params.set("category", skillCategoria.toLowerCase());
  return fetchJson(`/api/skills/top?${params}`);
}

// Devuelve la evolución mensual de ofertas por rol.
// Si pais está definido y no es "Todos", filtra por país en la BD.
export async function getDemandByRole({ pais } = {}) {
  const params = new URLSearchParams();
  if (pais && pais !== "Todos") params.set("country", pais.toLowerCase());
  return fetchJson(`/api/jobs/demand-by-role?${params}`);
}

// Devuelve el salario medio y mediana por rol y país.
// Si pais está definido y no es "Todos", filtra por país en la BD.
export async function getSalaryByRoleAndCountry({ pais } = {}) {
  const params = new URLSearchParams();
  if (pais && pais !== "Todos") params.set("country", pais.toLowerCase());
  return fetchJson(`/api/salary/by-role-country?${params}`);
}

// Devuelve el total de ofertas activas por país.
// Alimenta el mapa coroplético de Europa.
export async function getOffersByCountry() {
  return fetchJson("/api/jobs/offers-by-country");
}

// Devuelve los pares de skills que aparecen juntas frecuentemente.
// Alimenta el heatmap de co-ocurrencia.
export async function getSkillCoOccurrence() {
  return fetchJson("/api/skills/cooccurrence");
}
