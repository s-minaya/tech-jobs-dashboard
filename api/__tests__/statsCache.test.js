import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCached, _resetCacheForTests } from "../src/statsCache.js";

// Tests de statsCache.js (fase 014) — caché en memoria con TTL para
// /api/stats/summary. cachedValue/cachedAt viven a nivel de módulo
// (compartidos entre llamadas reales), así que cada test resetea el
// estado con _resetCacheForTests para no depender del orden de ejecución.

describe("getCached", () => {
  beforeEach(() => {
    _resetCacheForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("primera llamada ejecuta computeFn", async () => {
    const computeFn = vi.fn().mockResolvedValue({ total: 1 });
    const result = await getCached(computeFn);
    expect(computeFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ total: 1 });
  });

  it("segunda llamada dentro del TTL no vuelve a ejecutar computeFn", async () => {
    const computeFn = vi.fn().mockResolvedValue({ total: 1 });
    await getCached(computeFn);
    vi.advanceTimersByTime(15 * 60 * 1000); // 15 min — dentro del TTL de 30 min
    const result = await getCached(computeFn);
    expect(computeFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ total: 1 });
  });

  it("tras superar el TTL, vuelve a ejecutar computeFn", async () => {
    const computeFn = vi
      .fn()
      .mockResolvedValueOnce({ total: 1 })
      .mockResolvedValueOnce({ total: 2 });
    await getCached(computeFn);
    vi.advanceTimersByTime(30 * 60 * 1000 + 1); // justo después del TTL
    const result = await getCached(computeFn);
    expect(computeFn).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ total: 2 });
  });

  // Ronda 3 de la fase 014: bug real encontrado al calentar la caché al
  // arrancar el servidor — dos llamadas a getCached() que llegan antes
  // de que la primera resuelva (el calentamiento + la primera visita
  // real) lanzaban computeFn() dos veces en paralelo, compitiendo por
  // los mismos recursos de la BD en vez de compartir la misma promesa.
  it("dos llamadas simultáneas mientras computeFn() está en curso comparten UNA sola ejecución", async () => {
    let resolveCompute;
    const computeFn = vi.fn(
      () =>
        new Promise((r) => {
          resolveCompute = r;
        }),
    );

    const p1 = getCached(computeFn);
    const p2 = getCached(computeFn);

    expect(computeFn).toHaveBeenCalledTimes(1);

    resolveCompute({ total: 42 });
    await expect(p1).resolves.toEqual({ total: 42 });
    await expect(p2).resolves.toEqual({ total: 42 });
  });

  it("tras resolver una llamada en curso, la siguiente ya usa la caché (no dispara otra ejecución)", async () => {
    const computeFn = vi.fn().mockResolvedValue({ total: 7 });
    const [r1, r2] = await Promise.all([getCached(computeFn), getCached(computeFn)]);
    expect(computeFn).toHaveBeenCalledTimes(1);
    expect(r1).toEqual({ total: 7 });
    expect(r2).toEqual({ total: 7 });

    const result3 = await getCached(computeFn);
    expect(computeFn).toHaveBeenCalledTimes(1);
    expect(result3).toEqual({ total: 7 });
  });

  it("un rechazo de computeFn no deja la caché envenenada", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("BD caída"));
    await expect(getCached(failing)).rejects.toThrow("BD caída");

    // El siguiente intento debe volver a ejecutar computeFn (no debe
    // quedar cacheado un rechazo ni un valor corrupto).
    const recovering = vi.fn().mockResolvedValue({ total: 3 });
    const result = await getCached(recovering);
    expect(recovering).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ total: 3 });
  });
});
