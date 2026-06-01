import { describe, it, expect } from "vitest";
import { buildParams } from "@/services/jobServices";

// Importamos buildParams directamente del código de producción.
// Así si alguien modifica jobServices.js, los tests lo detectan inmediatamente.

// Convierte URLSearchParams a objeto plano para facilitar las aserciones.
function toObject(params) {
  return Object.fromEntries(params.entries());
}

describe("buildParams", () => {
  describe("sin filtros activos", () => {
    it("devuelve params vacíos con filtros en sus valores neutros", () => {
      const params = buildParams({
        pais: "Todos",
        periodo: undefined,
        contrato: "Todos",
        jornada: "Todos",
        remote: "Todos",
      });
      expect(toObject(params)).toEqual({});
    });

    it("devuelve params vacíos con objeto vacío", () => {
      expect(toObject(buildParams({}))).toEqual({});
    });
  });

  describe("filtro de país", () => {
    it("convierte el código a minúsculas como param 'country'", () => {
      expect(toObject(buildParams({ pais: "DE" }))).toMatchObject({
        country: "de",
      });
    });

    it("'Todos' no genera param country", () => {
      expect(toObject(buildParams({ pais: "Todos" }))).not.toHaveProperty(
        "country",
      );
    });
  });

  describe("filtro de periodo", () => {
    it.each([
      ["Últimos 30 días", "30d"],
      ["Últimos 90 días", "90d"],
      ["Últimos 6 meses", "180d"],
      ["Todo el histórico", "all"],
    ])("'%s' se convierte a código '%s'", (label, code) => {
      expect(toObject(buildParams({ periodo: label }))).toMatchObject({
        periodo: code,
      });
    });

    it("periodo desconocido no genera param periodo", () => {
      expect(
        toObject(buildParams({ periodo: "hace mucho" })),
      ).not.toHaveProperty("periodo");
    });
  });

  describe("filtro de contrato", () => {
    it("convierte el valor a minúsculas", () => {
      expect(toObject(buildParams({ contrato: "permanent" }))).toMatchObject({
        contrato: "permanent",
      });
    });

    it("'Todos' no genera param contrato", () => {
      expect(toObject(buildParams({ contrato: "Todos" }))).not.toHaveProperty(
        "contrato",
      );
    });
  });

  describe("filtro de jornada", () => {
    it("'Full time' se convierte a 'full_time'", () => {
      expect(toObject(buildParams({ jornada: "Full time" }))).toMatchObject({
        jornada: "full_time",
      });
    });

    it("'Part time' se convierte a 'part_time'", () => {
      expect(toObject(buildParams({ jornada: "Part time" }))).toMatchObject({
        jornada: "part_time",
      });
    });

    it("'Todos' no genera param jornada", () => {
      expect(toObject(buildParams({ jornada: "Todos" }))).not.toHaveProperty(
        "jornada",
      );
    });
  });

  describe("filtro de remote", () => {
    it("'Sí' se convierte a string 'true'", () => {
      expect(toObject(buildParams({ remote: "Sí" }))).toMatchObject({
        remote: "true",
      });
    });

    it("'No' se convierte a string 'false'", () => {
      expect(toObject(buildParams({ remote: "No" }))).toMatchObject({
        remote: "false",
      });
    });

    it("'Todos' no genera param remote", () => {
      expect(toObject(buildParams({ remote: "Todos" }))).not.toHaveProperty(
        "remote",
      );
    });
  });

  describe("combinaciones", () => {
    it("todos los filtros activos generan todos los params", () => {
      const params = toObject(
        buildParams({
          pais: "ES",
          periodo: "Últimos 6 meses",
          contrato: "permanent",
          jornada: "Full time",
          remote: "Sí",
        }),
      );
      expect(params).toEqual({
        country: "es",
        periodo: "180d",
        contrato: "permanent",
        jornada: "full_time",
        remote: "true",
      });
    });

    it("solo los filtros activos aparecen en los params", () => {
      const params = toObject(buildParams({ pais: "DE", remote: "No" }));
      expect(params).toEqual({ country: "de", remote: "false" });
      expect(params).not.toHaveProperty("periodo");
      expect(params).not.toHaveProperty("contrato");
      expect(params).not.toHaveProperty("jornada");
    });
  });
});
