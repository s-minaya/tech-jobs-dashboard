import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useHeatmapData } from "@/hooks/useHeatmapData";
import { getSkillCoOccurrence, getTopSkills } from "@/services/jobServices";

// Envolvemos las implementaciones reales en vi.fn(actual) en vez de un
// auto-mock: así todos los tests de "carga inicial"/"cambio de
// categoría"/"error handling" de abajo siguen pasando por el fetch real
// contra MSW sin cambios, y solo los tests de AbortController (que
// necesitan inspeccionar la señal o forzar una promesa que nunca
// resuelve) sobreescriben la implementación puntualmente.
vi.mock("@/services/jobServices", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getSkillCoOccurrence: vi.fn(actual.getSkillCoOccurrence),
    getTopSkills: vi.fn(actual.getTopSkills),
  };
});

// Referencia estable a las implementaciones reales, para poder
// restaurar el pass-through tras los tests de AbortController que
// sobreescriben mockImplementation con una promesa que nunca resuelve
// — sin este reset, esa implementación se queda "pegada" en el mock
// (vi.fn no tiene autoUnmock) y contamina cualquier test posterior que
// dependa de una respuesta real.
const actualJobServices = await vi.importActual("@/services/jobServices");

describe("useHeatmapData", () => {
  describe("carga inicial", () => {
    it("empieza con loadingPairs=true", () => {
      const { result } = renderHook(() => useHeatmapData("todas", {}));
      expect(result.current.loadingPairs).toBe(true);
    });

    it("loadingPairs pasa a false cuando la carga termina", async () => {
      const { result } = renderHook(() => useHeatmapData("todas", {}));
      await waitFor(() => expect(result.current.loadingPairs).toBe(false));
    });

    it("expone los pares con la estructura correcta del endpoint", async () => {
      const { result } = renderHook(() => useHeatmapData("todas", {}));
      await waitFor(() => expect(result.current.loadingPairs).toBe(false));
      // El handler devuelve 3 pares con estas propiedades
      expect(result.current.pairs.length).toBeGreaterThan(0);
      expect(result.current.pairs[0]).toHaveProperty("skill");
      expect(result.current.pairs[0]).toHaveProperty("co_skill");
      expect(result.current.pairs[0]).toHaveProperty("co_count");
    });

    it("expone total_matching_jobs del endpoint de co-ocurrencia", async () => {
      const { result } = renderHook(() => useHeatmapData("todas", {}));
      await waitFor(() => expect(result.current.loadingPairs).toBe(false));
      expect(result.current.totalJobs).toBe(26023);
    });

    it("expone las skills globales después de la carga", async () => {
      const { result } = renderHook(() => useHeatmapData("todas", {}));
      await waitFor(() => expect(result.current.loadingPairs).toBe(false));
      expect(result.current.allSkillsData.length).toBeGreaterThan(0);
      expect(result.current.skillsData.length).toBeGreaterThan(0);
    });

    it("loadingSkills no se activa durante la carga inicial", async () => {
      const { result } = renderHook(() => useHeatmapData("todas", {}));
      expect(result.current.loadingSkills).toBe(false);
      await waitFor(() => expect(result.current.loadingPairs).toBe(false));
      expect(result.current.loadingSkills).toBe(false);
    });
  });

  describe("cambio de categoría", () => {
    it("con categoría 'todas' skillsData coincide con allSkillsData", async () => {
      const { result } = renderHook(() => useHeatmapData("todas", {}));
      await waitFor(() => expect(result.current.loadingPairs).toBe(false));
      expect(result.current.skillsData).toEqual(result.current.allSkillsData);
    });

    it("al cambiar a categoría específica, loadingSkills se activa y luego vuelve a false", async () => {
      const { result, rerender } = renderHook(
        ({ cat }) => useHeatmapData(cat, {}),
        { initialProps: { cat: "todas" } },
      );

      await waitFor(() => expect(result.current.loadingPairs).toBe(false));

      // Cambiamos a categoría específica
      rerender({ cat: "language" });

      // loadingSkills debe activarse: eso confirma que el hook
      // disparó la recarga y no se quedó con los datos anteriores
      await waitFor(() => expect(result.current.loadingSkills).toBe(true));

      // Y luego debe volver a false cuando la petición termina
      await waitFor(() => expect(result.current.loadingSkills).toBe(false));
    });

    it("volver a 'todas' restaura skillsData igual a allSkillsData sin fetch extra", async () => {
      const { result, rerender } = renderHook(
        ({ cat }) => useHeatmapData(cat, {}),
        { initialProps: { cat: "todas" } },
      );

      await waitFor(() => expect(result.current.loadingPairs).toBe(false));
      const allSkills = result.current.allSkillsData;

      // Cambiamos a language y esperamos
      rerender({ cat: "language" });
      await waitFor(() => expect(result.current.loadingSkills).toBe(false));

      // Volvemos a todas — debe reutilizar allSkillsData sin hacer fetch
      rerender({ cat: "todas" });

      // skillsData vuelve a ser igual a allSkillsData
      expect(result.current.skillsData).toEqual(allSkills);
      // Y loadingSkills NO se activa porque no hay fetch
      expect(result.current.loadingSkills).toBe(false);
    });
  });

  describe("error handling", () => {
    it("expone el error si la carga inicial falla", async () => {
      const { server } = await import("@/mocks/server");
      const { http, HttpResponse } = await import("msw");

      server.use(
        http.get("/api/skills/cooccurrence", () =>
          HttpResponse.json({ detail: "fallo" }, { status: 500 }),
        ),
      );

      const { result } = renderHook(() => useHeatmapData("todas", {}));
      await waitFor(() => expect(result.current.loadingPairs).toBe(false));
      expect(result.current.error).not.toBeNull();
    });
  });

  // Fase 015: useHeatmapData se quedó fuera cuando useChartData.js ganó
  // AbortController en la fase 010 — mismo problema real (cambiar de
  // periodo o de categoría rápido dejaba varias queries vivas en
  // paralelo contra la misma BD), mismo fix.
  describe("AbortController (fase 015)", () => {
    afterEach(() => {
      getSkillCoOccurrence.mockImplementation(
        actualJobServices.getSkillCoOccurrence,
      );
      getTopSkills.mockImplementation(actualJobServices.getTopSkills);
    });

    it("pasa un AbortSignal a getSkillCoOccurrence y getTopSkills en la carga de pares", async () => {
      renderHook(() => useHeatmapData("todas", { periodo: "90d" }));
      await waitFor(() => expect(getSkillCoOccurrence).toHaveBeenCalled());
      expect(getSkillCoOccurrence.mock.calls[0][1]).toBeInstanceOf(
        AbortSignal,
      );
      expect(getTopSkills.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
    });

    it("aborta la petición de pares anterior cuando cambia el periodo", async () => {
      const signals = [];
      getSkillCoOccurrence.mockImplementation((_filters, signal) => {
        signals.push(signal);
        return new Promise(() => {}); // nunca resuelve — solo interesa el abort
      });

      const { rerender } = renderHook(
        ({ periodo }) => useHeatmapData("todas", { periodo }),
        { initialProps: { periodo: "30d" } },
      );
      await waitFor(() => expect(signals).toHaveLength(1));
      expect(signals[0].aborted).toBe(false);

      rerender({ periodo: "90d" });
      await waitFor(() => expect(signals).toHaveLength(2));
      expect(signals[0].aborted).toBe(true);
      expect(signals[1].aborted).toBe(false);
    });

    it("aborta la petición de skills por categoría cuando la categoría cambia antes de resolver", async () => {
      const { result, rerender } = renderHook(
        ({ cat }) => useHeatmapData(cat, {}),
        { initialProps: { cat: "todas" } },
      );
      await waitFor(() => expect(result.current.loadingPairs).toBe(false));

      const signals = [];
      getTopSkills.mockImplementation((_filters, signal) => {
        signals.push(signal);
        return new Promise(() => {});
      });

      rerender({ cat: "language" });
      await waitFor(() => expect(signals).toHaveLength(1));
      expect(signals[0].aborted).toBe(false);

      rerender({ cat: "framework" });
      await waitFor(() => expect(signals).toHaveLength(2));
      expect(signals[0].aborted).toBe(true);
      expect(signals[1].aborted).toBe(false);
    });

    it("un rechazo con name='AbortError' no se expone como error", async () => {
      const abortError = new Error("The user aborted a request.");
      abortError.name = "AbortError";
      getSkillCoOccurrence.mockRejectedValue(abortError);
      getTopSkills.mockResolvedValue({ rows: [] });

      const { result } = renderHook(() => useHeatmapData("todas", {}));
      await waitFor(() => expect(getSkillCoOccurrence).toHaveBeenCalled());
      await new Promise((r) => setTimeout(r, 0));
      expect(result.current.error).toBeNull();
    });
  });
});
