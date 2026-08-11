import { describe, it, expect } from "vitest";
import {
  getRoleLabel,
  ROLE_LABELS,
  extractRoles,
  rankRolesByVolume,
} from "@/lib/roleLabels";

describe("ROLE_LABELS", () => {
  it("contiene los roles principales del dashboard", () => {
    const rolesEsperados = [
      "backend",
      "frontend",
      "fullstack",
      "devops",
      "data_science",
      "data_analyst",
      "data_engineering",
      "ai_ml",
      "cloud",
      "security",
      "mobile",
    ];
    rolesEsperados.forEach((rol) => {
      expect(ROLE_LABELS).toHaveProperty(rol);
    });
  });

  it("todos los valores son strings no vacíos", () => {
    Object.values(ROLE_LABELS).forEach((label) => {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    });
  });
});

describe("getRoleLabel", () => {
  it("convierte keys conocidas al label legible correcto", () => {
    expect(getRoleLabel("backend")).toBe("Backend");
    expect(getRoleLabel("data_science")).toBe("Data Science");
    expect(getRoleLabel("ai_ml")).toBe("AI / ML");
    expect(getRoleLabel("qa_testing")).toBe("QA / Testing");
    expect(getRoleLabel("erp_sap")).toBe("ERP / SAP");
  });

  it("devuelve el key original como fallback cuando no existe en ROLE_LABELS", () => {
    // La BD podría devolver un rol nuevo que aún no está en el frontend.
    // El fallback evita mostrar "undefined" o romper el componente.
    expect(getRoleLabel("nuevo_rol")).toBe("nuevo_rol");
    expect(getRoleLabel("unknown")).toBe("unknown");
  });

  it("el fallback funciona con strings vacíos y valores edge case", () => {
    expect(getRoleLabel("")).toBe("");
  });
});

describe("extractRoles", () => {
  it("devuelve los roles únicos presentes en las filas", () => {
    const rows = [
      { role_category: "backend" },
      { role_category: "frontend" },
      { role_category: "backend" },
    ];
    expect(extractRoles(rows)).toEqual(["backend", "frontend"]);
  });

  it("devuelve array vacío si no hay filas", () => {
    expect(extractRoles([])).toEqual([]);
  });

  it("mantiene el orden de primera aparición de cada rol", () => {
    const rows = [
      { role_category: "data_science" },
      { role_category: "backend" },
      { role_category: "data_science" },
      { role_category: "devops" },
    ];
    expect(extractRoles(rows)).toEqual(["data_science", "backend", "devops"]);
  });
});

// rankRolesByVolume — añadida en la fase 010 (Salary Chart Quality).
// Reemplaza a extractRoles como criterio de "roles por defecto" en
// SalaryChart: ordena por job_count total, no por orden de llegada.
describe("rankRolesByVolume", () => {
  it("ordena por job_count total de mayor a menor, no por orden de llegada", () => {
    // Reproduce el caso real detectado en Austria (periodo=90d): en el
    // orden de llegada de la API, "qa_testing" (3 ofertas) aparecía antes
    // que "backend" (62 ofertas) porque el backend ordena por salario
    // mediano descendente, no por volumen.
    const rows = [
      { role_category: "qa_testing", job_count: 3 },
      { role_category: "cloud", job_count: 18 },
      { role_category: "backend", job_count: 62 },
      { role_category: "other", job_count: 124 },
    ];
    expect(rankRolesByVolume(rows)).toEqual([
      "other",
      "backend",
      "cloud",
      "qa_testing",
    ]);
  });

  it("suma job_count del mismo rol entre distintos países", () => {
    const rows = [
      { role_category: "backend", job_count: 30 },
      { role_category: "frontend", job_count: 50 },
      { role_category: "backend", job_count: 40 }, // mismo rol, otro país
    ];
    expect(rankRolesByVolume(rows)).toEqual(["backend", "frontend"]);
  });

  it("trata job_count ausente o no numérico como 0", () => {
    const rows = [
      { role_category: "backend", job_count: 10 },
      { role_category: "frontend" },
    ];
    expect(rankRolesByVolume(rows)).toEqual(["backend", "frontend"]);
  });

  it("devuelve array vacío si no hay filas", () => {
    expect(rankRolesByVolume([])).toEqual([]);
  });
});
