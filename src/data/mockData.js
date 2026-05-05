// Mock data que imita la estructura que vendrá de Supabase.
// Cada objeto representa una fila de la base de datos.

// Top skills más demandadas
export const topSkills = [
  { skill: "Python", count: 4821 },
  { skill: "SQL", count: 4102 },
  { skill: "JavaScript", count: 3987 },
  { skill: "Docker", count: 3541 },
  { skill: "AWS", count: 3210 },
  { skill: "React", count: 2987 },
  { skill: "Kubernetes", count: 2341 },
  { skill: "TypeScript", count: 2187 },
  { skill: "Git", count: 2043 },
  { skill: "PostgreSQL", count: 1876 },
];

// Evolución mensual de demanda por rol
export const demandByRole = [
  {
    month: "Oct",
    "Data Engineer": 320,
    "Data Scientist": 280,
    "Data Analyst": 410,
    "ML Engineer": 190,
  },
  {
    month: "Nov",
    "Data Engineer": 345,
    "Data Scientist": 295,
    "Data Analyst": 390,
    "ML Engineer": 210,
  },
  {
    month: "Dec",
    "Data Engineer": 290,
    "Data Scientist": 260,
    "Data Analyst": 350,
    "ML Engineer": 180,
  },
  {
    month: "Jan",
    "Data Engineer": 410,
    "Data Scientist": 320,
    "Data Analyst": 430,
    "ML Engineer": 240,
  },
  {
    month: "Feb",
    "Data Engineer": 450,
    "Data Scientist": 350,
    "Data Analyst": 460,
    "ML Engineer": 270,
  },
  {
    month: "Mar",
    "Data Engineer": 480,
    "Data Scientist": 375,
    "Data Analyst": 490,
    "ML Engineer": 295,
  },
];

// Salario medio por rol y país
export const salaryByRoleAndCountry = [
  {
    country: "GB",
    "Data Engineer": 72000,
    "Data Scientist": 68000,
    "Data Analyst": 52000,
    "ML Engineer": 78000,
  },
  {
    country: "DE",
    "Data Engineer": 65000,
    "Data Scientist": 62000,
    "Data Analyst": 48000,
    "ML Engineer": 70000,
  },
  {
    country: "FR",
    "Data Engineer": 58000,
    "Data Scientist": 56000,
    "Data Analyst": 44000,
    "ML Engineer": 63000,
  },
  {
    country: "ES",
    "Data Engineer": 42000,
    "Data Scientist": 40000,
    "Data Analyst": 32000,
    "ML Engineer": 46000,
  },
  {
    country: "NL",
    "Data Engineer": 68000,
    "Data Scientist": 65000,
    "Data Analyst": 50000,
    "ML Engineer": 74000,
  },
  {
    country: "PL",
    "Data Engineer": 38000,
    "Data Scientist": 35000,
    "Data Analyst": 28000,
    "ML Engineer": 42000,
  },
];

// Ofertas por país (para el mapa)
export const offersByCountry = [
  { country: "GB", iso: "GBR", offers: 4821 },
  { country: "DE", iso: "DEU", offers: 3654 },
  { country: "FR", iso: "FRA", offers: 2987 },
  { country: "ES", iso: "ESP", offers: 1876 },
  { country: "NL", iso: "NLD", offers: 1654 },
  { country: "PL", iso: "POL", offers: 1432 },
  { country: "IT", iso: "ITA", offers: 1398 },
  { country: "AT", iso: "AUT", offers: 876 },
  { country: "BE", iso: "BEL", offers: 743 },
];

// Skills que suelen aparecer juntas
export const skillCoOccurrence = [
  { skill: "Python", coSkill: "SQL", count: 2341 },
  { skill: "Python", coSkill: "Docker", count: 1987 },
  { skill: "Python", coSkill: "AWS", count: 1876 },
  { skill: "SQL", coSkill: "Python", count: 2341 },
  { skill: "SQL", coSkill: "PostgreSQL", count: 1654 },
  { skill: "React", coSkill: "TypeScript", count: 1543 },
  { skill: "React", coSkill: "JavaScript", count: 2109 },
  { skill: "Docker", coSkill: "Kubernetes", count: 1876 },
  { skill: "AWS", coSkill: "Docker", count: 1432 },
];
