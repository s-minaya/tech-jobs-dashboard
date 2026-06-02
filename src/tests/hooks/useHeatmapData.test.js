import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useHeatmapData } from "@/hooks/useHeatmapData";

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
});
