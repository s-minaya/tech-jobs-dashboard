import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useChartData } from "@/hooks/useChartData";

describe("useChartData", () => {
  describe("carga inicial", () => {
    it("empieza con loading=true e isInitialLoad=true", () => {
      const fetchFn = vi.fn(() => new Promise(() => {}));
      const { result } = renderHook(() => useChartData(fetchFn, []));
      expect(result.current.loading).toBe(true);
      expect(result.current.isInitialLoad).toBe(true);
    });

    it("empieza con los datos iniciales (array vacío por defecto)", () => {
      const fetchFn = vi.fn(() => new Promise(() => {}));
      const { result } = renderHook(() => useChartData(fetchFn, []));
      expect(result.current.data).toEqual([]);
    });

    it("acepta initialData personalizado", () => {
      const fetchFn = vi.fn(() => new Promise(() => {}));
      const { result } = renderHook(() =>
        useChartData(fetchFn, [], { rows: [], total: 0 }),
      );
      expect(result.current.data).toEqual({ rows: [], total: 0 });
    });

    it("cuando la carga termina, loading pasa a false", async () => {
      const fetchFn = vi.fn().mockResolvedValue([{ skill: "Python" }]);
      const { result } = renderHook(() => useChartData(fetchFn, []));
      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it("cuando la carga termina, isInitialLoad pasa a false", async () => {
      const fetchFn = vi.fn().mockResolvedValue([{ skill: "Python" }]);
      const { result } = renderHook(() => useChartData(fetchFn, []));
      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
    });

    it("devuelve los datos de la primera carga", async () => {
      const datos = [{ skill: "Python", job_count: 2065 }];
      const fetchFn = vi.fn().mockResolvedValue(datos);
      const { result } = renderHook(() => useChartData(fetchFn, []));
      await waitFor(() => expect(result.current.data).toEqual(datos));
    });
  });

  describe("stale-while-revalidate", () => {
    it("durante una recarga devuelve los datos anteriores, no array vacío", async () => {
      const datosPrimeros = [{ skill: "Python" }];
      const datosSegundos = [{ skill: "SQL" }];

      let resolveSegunda;
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce(datosPrimeros)
        .mockReturnValueOnce(
          new Promise((r) => {
            resolveSegunda = r;
          }),
        );

      const { result, rerender } = renderHook(
        ({ dep }) => useChartData(fetchFn, [dep]),
        { initialProps: { dep: "a" } },
      );

      await waitFor(() => expect(result.current.data).toEqual(datosPrimeros));

      rerender({ dep: "b" });

      await waitFor(() => expect(result.current.loading).toBe(true));
      // Mientras recarga, data tiene los datos anteriores (no array vacío)
      expect(result.current.data).toEqual(datosPrimeros);

      resolveSegunda(datosSegundos);
      await waitFor(() => expect(result.current.data).toEqual(datosSegundos));
    });

    it("isInitialLoad no vuelve a true en recargas posteriores", async () => {
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce([{ skill: "Python" }])
        .mockResolvedValueOnce([{ skill: "SQL" }]);

      const { result, rerender } = renderHook(
        ({ dep }) => useChartData(fetchFn, [dep]),
        { initialProps: { dep: "a" } },
      );

      await waitFor(() => expect(result.current.isInitialLoad).toBe(false));
      rerender({ dep: "b" });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.isInitialLoad).toBe(false);
    });
  });

  describe("manejo de errores", () => {
    it("captura el error y lo expone como string en error", async () => {
      const fetchFn = vi
        .fn()
        .mockRejectedValue(new Error("Error 500 en /api/skills/top"));
      const { result } = renderHook(() => useChartData(fetchFn, []));
      await waitFor(() =>
        expect(result.current.error).toBe("Error 500 en /api/skills/top"),
      );
    });

    it("loading pasa a false aunque haya error", async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error("fallo"));
      const { result } = renderHook(() => useChartData(fetchFn, []));
      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it("error se limpia y data se actualiza al hacer una nueva carga exitosa", async () => {
      const fetchFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fallo"))
        .mockResolvedValueOnce([{ skill: "Python" }]);

      const { result, rerender } = renderHook(
        ({ dep }) => useChartData(fetchFn, [dep]),
        { initialProps: { dep: "a" } },
      );

      await waitFor(() => expect(result.current.error).toBe("fallo"));

      rerender({ dep: "b" });

      // Esperamos a que AMBOS cambios ocurran: error null Y data actualizada.
      // No podemos comprobar data en el momento en que error se limpia porque
      // setError(null) ocurre antes de que la promesa resuelva.
      await waitFor(() => expect(result.current.error).toBeNull());
      await waitFor(() =>
        expect(result.current.data).toEqual([{ skill: "Python" }]),
      );
    });
  });

  describe("llamadas a fetchFn", () => {
    it("llama a fetchFn una vez al montar", async () => {
      const fetchFn = vi.fn().mockResolvedValue([]);
      renderHook(() => useChartData(fetchFn, []));
      await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    });

    it("vuelve a llamar a fetchFn cuando cambian las deps", async () => {
      const fetchFn = vi.fn().mockResolvedValue([]);
      const { rerender } = renderHook(
        ({ dep }) => useChartData(fetchFn, [dep]),
        { initialProps: { dep: "a" } },
      );
      await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
      rerender({ dep: "b" });
      await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));
    });

    it("no vuelve a llamar si las deps no cambian", async () => {
      const fetchFn = vi.fn().mockResolvedValue([]);
      const { rerender } = renderHook(
        ({ dep }) => useChartData(fetchFn, [dep]),
        { initialProps: { dep: "a" } },
      );
      await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
      rerender({ dep: "a" });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });
});
