import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

// "Ahora" fijo para que los tests sean deterministas.
const NOW = new Date("2026-08-13T12:00:00.000Z");

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sin fecha, devuelve un guion", () => {
    expect(formatRelativeTime(null)).toBe("—");
    expect(formatRelativeTime(undefined)).toBe("—");
  });

  it("hace menos de un minuto: 'hace un momento'", () => {
    expect(formatRelativeTime(new Date(NOW - 30 * 1000).toISOString())).toBe(
      "hace un momento",
    );
  });

  it("hace minutos", () => {
    expect(formatRelativeTime(new Date(NOW - 5 * 60 * 1000).toISOString())).toBe(
      "hace 5 min",
    );
  });

  it("hace horas", () => {
    expect(
      formatRelativeTime(new Date(NOW - 3 * 60 * 60 * 1000).toISOString()),
    ).toBe("hace 3 h");
  });

  it("hace días", () => {
    expect(
      formatRelativeTime(new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString()),
    ).toBe("hace 2 d");
  });

  it("una fecha futura (reloj desincronizado) no muestra un valor negativo", () => {
    expect(
      formatRelativeTime(new Date(NOW.getTime() + 60 * 1000).toISOString()),
    ).toBe("hace un momento");
  });
});
