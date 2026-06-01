/* eslint-disable no-unused-vars */
const API_URL = import.meta.env.VITE_API_URL;

async function fetchJson(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Error ${res.status} en ${path}`);
  }
  return res.json();
}

// buildParams
// Convierte el objeto de filtros del sidebar en URLSearchParams.
// Exportada para poder testearla directamente sin exponerla al usuario
// ni tener que reimplementarla en los tests.
export function buildParams(filters = {}) {
  const params = new URLSearchParams();

  if (filters.pais && filters.pais !== "Todos")
    params.set("country", filters.pais.toLowerCase());

  const periodoMap = {
    "Últimos 30 días": "30d",
    "Últimos 90 días": "90d",
    "Últimos 6 meses": "180d",
    "Todo el histórico": "all",
  };
  const periodoCode = periodoMap[filters.periodo];
  if (periodoCode) params.set("periodo", periodoCode);

  if (filters.contrato && filters.contrato !== "Todos")
    params.set("contrato", filters.contrato.toLowerCase());

  if (filters.jornada && filters.jornada !== "Todos") {
    const jornadaMap = { "Full time": "full_time", "Part time": "part_time" };
    const code = jornadaMap[filters.jornada];
    if (code) params.set("jornada", code);
  }

  if (filters.remote === "Sí") params.set("remote", "true");
  if (filters.remote === "No") params.set("remote", "false");

  return params;
}

export async function getTopSkills(filters = {}) {
  const { jornada: _j, ...rest } = filters;
  const params = buildParams(rest);
  if (filters.skillCategoria && filters.skillCategoria !== "Todas")
    params.set("category", filters.skillCategoria.toLowerCase());
  return fetchJson(`/api/skills/top?${params}`);
}

export async function getDemandByRole(filters = {}) {
  const { jornada: _j, skillCategoria: _s, ...rest } = filters;
  return fetchJson(`/api/jobs/demand-by-role?${buildParams(rest)}`);
}

export async function getSalaryByRoleAndCountry(filters = {}) {
  const { skillCategoria: _s, ...rest } = filters;
  return fetchJson(`/api/salary/by-role-country?${buildParams(rest)}`);
}

export async function getOffersByCountry(filters = {}, skill = null) {
  const { pais: _p, skillCategoria: _s, ...rest } = filters;
  const params = buildParams(rest);
  if (skill) params.set("skill", skill);
  return fetchJson(`/api/jobs/offers-by-country?${params}`);
}

export async function getSkillCoOccurrence(filters = {}) {
  const {
    pais: _p,
    contrato: _c,
    jornada: _j,
    remote: _r,
    skillCategoria: _s,
    ...rest
  } = filters;
  return fetchJson(`/api/skills/cooccurrence?${buildParams(rest)}`);
}

export async function getSkillsList() {
  return fetchJson("/api/skills/list");
}

export async function getSummaryStats() {
  return fetchJson("/api/stats/summary");
}
