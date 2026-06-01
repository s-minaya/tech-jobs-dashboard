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
// Cada función de servicio destructura y descarta los filtros que no aplican
// antes de llamar a buildParams, así el backend nunca los recibe.
function buildParams(filters = {}) {
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

// getTopSkills
// Filtros que aplican: país, periodo, contrato, remote, skillCategoria.
// Jornada NO aplica.
export async function getTopSkills(filters = {}) {
  const { jornada: _j, ...rest } = filters;
  const params = buildParams(rest);
  if (filters.skillCategoria && filters.skillCategoria !== "Todas")
    params.set("category", filters.skillCategoria.toLowerCase());
  return fetchJson(`/api/skills/top?${params}`);
}

// getDemandByRole
// Filtros que aplican: país, periodo, contrato, remote.
// Jornada y skillCategoria NO aplican.
export async function getDemandByRole(filters = {}) {
  const { jornada: _j, skillCategoria: _s, ...rest } = filters;
  return fetchJson(`/api/jobs/demand-by-role?${buildParams(rest)}`);
}

// getSalaryByRoleAndCountry
// Filtros que aplican: país, periodo, contrato, jornada, remote.
// skillCategoria NO aplica.
export async function getSalaryByRoleAndCountry(filters = {}) {
  const { skillCategoria: _s, ...rest } = filters;
  return fetchJson(`/api/salary/by-role-country?${buildParams(rest)}`);
}

// getOffersByCountry
// Filtros que aplican: periodo, contrato, jornada, remote.
// País NO filtra el mapa (solo resalta visualmente).
// skillCategoria NO aplica.
export async function getOffersByCountry(filters = {}) {
  const { pais: _p, skillCategoria: _s, ...rest } = filters;
  return fetchJson(`/api/jobs/offers-by-country?${buildParams(rest)}`);
}

// getSkillCoOccurrence
// Filtros que aplican: solo periodo.
// País, contrato, jornada y remote NO aplican: las co-ocurrencias se calculan
// sobre el conjunto global de ofertas para tener suficiente masa estadística.
// Filtrar por país o tipo de contrato dejaría demasiados pocos datos y los
// porcentajes perderían representatividad.
// skillCategoria se gestiona en el frontend (selectSkills), no en el backend.
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
