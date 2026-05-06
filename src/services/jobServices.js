import {
  topSkills,
  demandByRole,
  salaryByRoleAndCountry,
  offersByCountry,
  skillCoOccurrence,
  coOccurrenceSkills,
} from "@/data/mockData";

// Capa de servicio que abstrae el origen de los datos.
// Ahora devuelve mock data directamente.
// Cuando la API esté lista, cada función hará un fetch al endpoint
// correspondiente y los componentes no necesitarán ningún cambio.

// Ejemplo de cómo quedará cada función cuando haya API real:
// export async function getTopSkills(filters) {
//   const params = new URLSearchParams(filters);
//   const res = await fetch(`/api/skills/top?${params}`);
//   return res.json();
// }

export function getTopSkills() {
  return topSkills;
}

export function getDemandByRole() {
  return demandByRole;
}

export function getSalaryByRoleAndCountry() {
  return salaryByRoleAndCountry;
}

export function getOffersByCountry() {
  return offersByCountry;
}

export function getSkillCoOccurrence() {
  return skillCoOccurrence;
}

export function getCoOccurrenceSkills() {
  return coOccurrenceSkills;
}
