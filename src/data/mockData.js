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
    data_engineer: 320,
    data_scientist: 280,
    data_analyst: 410,
    ml_engineer: 190,
  },
  {
    month: "Nov",
    data_engineer: 345,
    data_scientist: 295,
    data_analyst: 390,
    ml_engineer: 210,
  },
  {
    month: "Dec",
    data_engineer: 290,
    data_scientist: 260,
    data_analyst: 350,
    ml_engineer: 180,
  },
  {
    month: "Jan",
    data_engineer: 410,
    data_scientist: 320,
    data_analyst: 430,
    ml_engineer: 240,
  },
  {
    month: "Feb",
    data_engineer: 450,
    data_scientist: 350,
    data_analyst: 460,
    ml_engineer: 270,
  },
  {
    month: "Mar",
    data_engineer: 480,
    data_scientist: 375,
    data_analyst: 490,
    ml_engineer: 295,
  },
];

// Salario medio por rol y país

export const salaryByRoleAndCountry = [
  {
    country: "DE",
    data_engineer: 65000,
    data_scientist: 62000,
    data_analyst: 48000,
    ml_engineer: 70000,
  },
  {
    country: "FR",
    data_engineer: 58000,
    data_scientist: 56000,
    data_analyst: 44000,
    ml_engineer: 63000,
  },
  {
    country: "ES",
    data_engineer: 42000,
    data_scientist: 40000,
    data_analyst: 32000,
    ml_engineer: 46000,
  },
  {
    country: "NL",
    data_engineer: 68000,
    data_scientist: 65000,
    data_analyst: 50000,
    ml_engineer: 74000,
  },
  {
    country: "PL",
    data_engineer: 38000,
    data_scientist: 35000,
    data_analyst: 28000,
    ml_engineer: 42000,
  },
  {
    country: "IT",
    data_engineer: 45000,
    data_scientist: 43000,
    data_analyst: 34000,
    ml_engineer: 49000,
  },
  {
    country: "AT",
    data_engineer: 62000,
    data_scientist: 59000,
    data_analyst: 46000,
    ml_engineer: 67000,
  },
  {
    country: "BE",
    data_engineer: 60000,
    data_scientist: 57000,
    data_analyst: 45000,
    ml_engineer: 65000,
  },
];

// Ofertas por país (para el mapa)
export const offersByCountry = [
  { country: "DE", iso: "DEU", offers: 3654 },
  { country: "FR", iso: "FRA", offers: 2987 },
  { country: "ES", iso: "ESP", offers: 1876 },
  { country: "NL", iso: "NLD", offers: 1654 },
  { country: "PL", iso: "POL", offers: 1432 },
  { country: "IT", iso: "ITA", offers: 1398 },
  { country: "AT", iso: "AUT", offers: 876 },
  { country: "BE", iso: "BEL", offers: 743 },
];

// Skills únicas que aparecen en el análisis de co-ocurrencia
export const coOccurrenceSkills = [
  "Python",
  "SQL",
  "React",
  "Docker",
  "AWS",
  "PostgreSQL",
  "TypeScript",
  "Kubernetes",
];

// Matriz de co-ocurrencia: cada entrada representa cuántas veces
// dos skills aparecen juntas en la misma oferta.
// count: 0 significa que no se han encontrado juntas.
export const skillCoOccurrence = [
  { skill: "Python", coSkill: "SQL", count: 2341 },
  { skill: "Python", coSkill: "Docker", count: 1987 },
  { skill: "Python", coSkill: "AWS", count: 1876 },
  { skill: "Python", coSkill: "PostgreSQL", count: 1432 },
  { skill: "Python", coSkill: "Kubernetes", count: 987 },
  { skill: "Python", coSkill: "TypeScript", count: 432 },
  { skill: "Python", coSkill: "React", count: 654 },
  { skill: "SQL", coSkill: "Python", count: 2341 },
  { skill: "SQL", coSkill: "PostgreSQL", count: 1654 },
  { skill: "SQL", coSkill: "Docker", count: 876 },
  { skill: "SQL", coSkill: "AWS", count: 1123 },
  { skill: "SQL", coSkill: "TypeScript", count: 234 },
  { skill: "SQL", coSkill: "React", count: 432 },
  { skill: "SQL", coSkill: "Kubernetes", count: 543 },
  { skill: "React", coSkill: "TypeScript", count: 1543 },
  { skill: "React", coSkill: "JavaScript", count: 2109 },
  { skill: "React", coSkill: "Docker", count: 654 },
  { skill: "React", coSkill: "AWS", count: 543 },
  { skill: "React", coSkill: "SQL", count: 432 },
  { skill: "React", coSkill: "Python", count: 654 },
  { skill: "React", coSkill: "Kubernetes", count: 321 },
  { skill: "Docker", coSkill: "Kubernetes", count: 1876 },
  { skill: "Docker", coSkill: "AWS", count: 1432 },
  { skill: "Docker", coSkill: "Python", count: 1987 },
  { skill: "Docker", coSkill: "SQL", count: 876 },
  { skill: "Docker", coSkill: "React", count: 654 },
  { skill: "Docker", coSkill: "TypeScript", count: 543 },
  { skill: "Docker", coSkill: "PostgreSQL", count: 765 },
  { skill: "AWS", coSkill: "Docker", count: 1432 },
  { skill: "AWS", coSkill: "Kubernetes", count: 1234 },
  { skill: "AWS", coSkill: "Python", count: 1876 },
  { skill: "AWS", coSkill: "SQL", count: 1123 },
  { skill: "AWS", coSkill: "React", count: 543 },
  { skill: "AWS", coSkill: "PostgreSQL", count: 876 },
  { skill: "AWS", coSkill: "TypeScript", count: 654 },
  { skill: "PostgreSQL", coSkill: "SQL", count: 1654 },
  { skill: "PostgreSQL", coSkill: "Python", count: 1432 },
  { skill: "PostgreSQL", coSkill: "Docker", count: 765 },
  { skill: "PostgreSQL", coSkill: "AWS", count: 876 },
  { skill: "PostgreSQL", coSkill: "TypeScript", count: 432 },
  { skill: "PostgreSQL", coSkill: "React", count: 321 },
  { skill: "PostgreSQL", coSkill: "Kubernetes", count: 543 },
  { skill: "TypeScript", coSkill: "React", count: 1543 },
  { skill: "TypeScript", coSkill: "Docker", count: 543 },
  { skill: "TypeScript", coSkill: "AWS", count: 654 },
  { skill: "TypeScript", coSkill: "Python", count: 432 },
  { skill: "TypeScript", coSkill: "SQL", count: 234 },
  { skill: "TypeScript", coSkill: "PostgreSQL", count: 432 },
  { skill: "TypeScript", coSkill: "Kubernetes", count: 321 },
  { skill: "Kubernetes", coSkill: "Docker", count: 1876 },
  { skill: "Kubernetes", coSkill: "AWS", count: 1234 },
  { skill: "Kubernetes", coSkill: "Python", count: 987 },
  { skill: "Kubernetes", coSkill: "SQL", count: 543 },
  { skill: "Kubernetes", coSkill: "React", count: 321 },
  { skill: "Kubernetes", coSkill: "PostgreSQL", count: 543 },
  { skill: "Kubernetes", coSkill: "TypeScript", count: 321 },
];

// Categoría de cada skill — necesario para el filtro de skillCategoria
export const skillCategories = {
  Python: "Language",
  SQL: "Language",
  JavaScript: "Language",
  TypeScript: "Language",
  React: "Framework",
  Docker: "Tool",
  Kubernetes: "Tool",
  Git: "Tool",
  AWS: "Cloud",
  PostgreSQL: "Database",
};
