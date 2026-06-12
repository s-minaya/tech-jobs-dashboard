import { describe, it, expect } from "vitest";
import {
  selectSkills,
  buildLookup,
  buildJobCountMap,
  formatPct,
  calcMaxPct,
  getHeatmapTextColor,
} from "@/lib/heatmapUtils";

const skillsData = [
  { skill: "Python", skill_category: "language", job_count: 2065 },
  { skill: "SQL", skill_category: "language", job_count: 1890 },
  { skill: "React", skill_category: "framework", job_count: 1540 },
  { skill: "AWS", skill_category: "cloud", job_count: 1320 },
  { skill: "PostgreSQL", skill_category: "database", job_count: 980 },
];

const pairs = [
  { skill: "Python", co_skill: "SQL", co_count: 890 },
  { skill: "Python", co_skill: "AWS", co_count: 654 },
  { skill: "React", co_skill: "Python", co_count: 200 },
];

describe("selectSkills", () => {
  it("devuelve los primeros N nombres en el orden original", () => {
    expect(selectSkills(skillsData, "todas", 3)).toEqual([
      "Python",
      "SQL",
      "React",
    ]);
  });

  it("respeta maxN exactamente", () => {
    expect(selectSkills(skillsData, "todas", 2)).toHaveLength(2);
  });

  it("filtra por categoría correctamente", () => {
    expect(selectSkills(skillsData, "language", 10)).toEqual(["Python", "SQL"]);
  });

  it("categoría sin skills devuelve array vacío", () => {
    expect(selectSkills(skillsData, "methodology", 10)).toEqual([]);
  });

  it("elimina duplicados manteniendo el orden de aparición", () => {
    const conDuplicados = [
      { skill: "Python", skill_category: "language", job_count: 2065 },
      { skill: "Python", skill_category: "language", job_count: 2065 },
      { skill: "SQL", skill_category: "language", job_count: 1890 },
    ];
    const resultado = selectSkills(conDuplicados, "todas", 10);
    expect(resultado).toEqual(["Python", "SQL"]);
    expect(resultado.filter((s) => s === "Python")).toHaveLength(1);
  });

  it("maxN mayor que el número de skills devuelve todas", () => {
    expect(selectSkills(skillsData, "todas", 100)).toHaveLength(
      skillsData.length,
    );
  });
});

describe("buildLookup", () => {
  const skills = ["Python", "SQL", "AWS"];

  it("genera la dirección A|B", () => {
    expect(buildLookup(pairs, skills)["Python|SQL"]).toBe(890);
  });

  it("genera la dirección B|A (co-ocurrencia es simétrica)", () => {
    expect(buildLookup(pairs, skills)["SQL|Python"]).toBe(890);
  });

  it("los valores son números, no strings", () => {
    expect(typeof buildLookup(pairs, skills)["Python|SQL"]).toBe("number");
  });

  it("descarta pares donde alguna skill no está en la lista visible", () => {
    const lookup = buildLookup(pairs, skills);
    expect(lookup["React|Python"]).toBeUndefined();
    expect(lookup["Python|React"]).toBeUndefined();
  });

  it("devuelve objeto vacío si skills es array vacío", () => {
    expect(Object.keys(buildLookup(pairs, []))).toHaveLength(0);
  });

  it("devuelve objeto vacío si pairs es array vacío", () => {
    expect(Object.keys(buildLookup([], skills))).toHaveLength(0);
  });
});

describe("buildJobCountMap", () => {
  it("construye el mapa skill → job_count correctamente", () => {
    const mapa = buildJobCountMap(skillsData);
    expect(mapa["Python"]).toBe(2065);
    expect(mapa["SQL"]).toBe(1890);
  });

  it("convierte strings a números", () => {
    const mapa = buildJobCountMap([{ skill: "Python", job_count: "2065" }]);
    expect(typeof mapa["Python"]).toBe("number");
    expect(mapa["Python"]).toBe(2065);
  });

  it("devuelve objeto vacío con array vacío", () => {
    expect(Object.keys(buildJobCountMap([]))).toHaveLength(0);
  });
});

describe("formatPct", () => {
  it("calcula el porcentaje con un decimal", () => {
    expect(formatPct(890, 2065)).toBe("43.1%");
  });

  it("devuelve '—' cuando co_count es 0", () => {
    expect(formatPct(0, 2065)).toBe("—");
  });

  it("devuelve '—' cuando jobCountA es 0 (evita división por cero)", () => {
    expect(formatPct(890, 0)).toBe("—");
  });

  it("devuelve '—' cuando jobCountA es undefined", () => {
    expect(formatPct(890, undefined)).toBe("—");
  });

  it("el resultado siempre incluye el símbolo %", () => {
    expect(formatPct(100, 200)).toMatch(/%$/);
  });
});

describe("calcMaxPct", () => {
  it("devuelve el porcentaje más alto calculado correctamente", () => {
    const skills = ["Python", "SQL", "AWS"];
    const lookup = buildLookup(pairs, skills);
    const jobCountMap = buildJobCountMap(skillsData);

    // calcMaxPct itera el triángulo inferior: j < i.
    // Con skills = ["Python", "SQL", "AWS"]:
    //   i=1 (SQL),    j=0 (Python): lookup["SQL|Python"] = 890, jobCount[SQL] = 1890
    //     → 890/1890*100 = 47.1%   ← skills[i] es el denominador
    //   i=2 (AWS),    j=0 (Python): lookup["AWS|Python"] = 654, jobCount[AWS] = 1320
    //     → 654/1320*100 = 49.5%   ← este es el máximo real
    //   i=2 (AWS),    j=1 (SQL):    lookup["AWS|SQL"] = undefined → 0%
    //
    // El máximo real es ~49.5, no 43.1 (que sería Python→SQL con jobCount de Python).
    const max = calcMaxPct(skills, lookup, jobCountMap);
    expect(max).toBeCloseTo(49.5, 0);
  });

  it("devuelve 1 cuando no hay pares (evita dominio [0,0] en D3)", () => {
    expect(calcMaxPct(["Python", "SQL"], {}, { Python: 2065, SQL: 1890 })).toBe(
      1,
    );
  });

  it("devuelve 1 con array de skills vacío", () => {
    expect(calcMaxPct([], {}, {})).toBe(1);
  });

  it("devuelve 1 con una sola skill (no hay celdas j < i)", () => {
    expect(calcMaxPct(["Python"], {}, { Python: 2065 })).toBe(1);
  });
});

describe("getHeatmapTextColor", () => {
  it("devuelve color oscuro sobre fondo claro (luminancia alta)", () => {
    expect(getHeatmapTextColor("#ffff00")).toBe("#1e293b");
  });

  it("devuelve color blanco sobre fondo oscuro (luminancia baja)", () => {
    expect(getHeatmapTextColor("#8b0000")).toBe("#ffffff");
  });

  it("devuelve color oscuro sobre verde claro", () => {
    expect(getHeatmapTextColor("#90ee90")).toBe("#1e293b");
  });

  it("devuelve color blanco sobre verde oscuro", () => {
    expect(getHeatmapTextColor("#006400")).toBe("#ffffff");
  });

  it("devuelve el fallback #1e293b si el color no es parseable", () => {
    expect(getHeatmapTextColor("no-es-un-color")).toBe("#1e293b");
  });

  it("el resultado siempre es uno de los dos valores posibles", () => {
    ["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000"].forEach((c) => {
      expect(["#1e293b", "#ffffff"]).toContain(getHeatmapTextColor(c));
    });
  });
});

// Tests para filterSkillsWithCoOccurrence — añadida en fase de heatmap dinámico
import { filterSkillsWithCoOccurrence } from "@/lib/heatmapUtils";

describe("filterSkillsWithCoOccurrence", () => {
  const pairs = [
    { skill: "Python", co_skill: "SQL", co_count: 890 },
    { skill: "Python", co_skill: "AWS", co_count: 654 },
    // React no tiene co-ocurrencias con nadie del conjunto
  ];

  it("elimina skills sin ninguna co-ocurrencia con otras del conjunto", () => {
    const skills = ["Python", "SQL", "AWS", "React"];
    const result = filterSkillsWithCoOccurrence(skills, pairs);
    expect(result).not.toContain("React");
  });

  it("mantiene skills que tienen al menos una co-ocurrencia", () => {
    const skills = ["Python", "SQL", "AWS", "React"];
    const result = filterSkillsWithCoOccurrence(skills, pairs);
    expect(result).toContain("Python");
    expect(result).toContain("SQL");
    expect(result).toContain("AWS");
  });

  it("devuelve array vacío si ninguna skill tiene co-ocurrencias", () => {
    const skills = ["React", "Vue"];
    const result = filterSkillsWithCoOccurrence(skills, []);
    expect(result).toHaveLength(0);
  });

  it("devuelve el mismo array si todas tienen co-ocurrencias", () => {
    const skills = ["Python", "SQL"];
    const result = filterSkillsWithCoOccurrence(skills, pairs);
    expect(result).toContain("Python");
    expect(result).toContain("SQL");
  });

  it("es estable — resultado idéntico en múltiples llamadas", () => {
    const skills = ["Python", "SQL", "AWS", "React"];
    const r1 = filterSkillsWithCoOccurrence(skills, pairs);
    const r2 = filterSkillsWithCoOccurrence(skills, pairs);
    expect(r1).toEqual(r2);
  });
});
