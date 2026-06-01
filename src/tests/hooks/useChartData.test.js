import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useChartData } from "@/hooks/useChartData";

// useChartData
// Testamos los tres comportamientos críticos:
//   1. isInitialLoad distingue primera carga de recargas posteriores
//   2. Stale-while-revalidate: devuelve datos anteriores durante recargas
//   3. Manejo de errores

describe("useChartData", () => {
  describe("carga inicial", () => {
    it("empieza con loading=true e isInitialLoad=true", () => {
      const fetchFn = vi.fn(() => new Promise(() => {})); // promesa que nunca resuelve
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

      // Primera carga resuelve inmediatamente
      let resolveSegunda;
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce(datosPrimeros)
        // Segunda carga queda pendiente para que podamos inspeccionar
        // el estado intermedio mientras está cargando
        .mockReturnValueOnce(
          new Promise((r) => {
            resolveSegunda = r;
          }),
        );

      const { result, rerender } = renderHook(
        ({ dep }) => useChartData(fetchFn, [dep]),
        { initialProps: { dep: "a" } },
      );

      // Esperamos a que la primera carga termine
      await waitFor(() => expect(result.current.data).toEqual(datosPrimeros));

      // Cambiamos la dependencia para disparar la segunda carga
      rerender({ dep: "b" });

      // Durante la segunda carga, data debe ser los datos anteriores (stale)
      // no un array vacío — esto evita que el chart desaparezca y el scroll salte
      await waitFor(() => expect(result.current.loading).toBe(true));
      expect(result.current.data).toEqual(datosPrimeros);

      // Resolvemos la segunda carga
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
      // isInitialLoad nunca vuelve a true después de la primera carga exitosa
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

    it("error se limpia al hacer una nueva carga exitosa", async () => {
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

      await waitFor(() => expect(result.current.error).toBeNull());
      expect(result.current.data).toEqual([{ skill: "Python" }]);
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

      rerender({ dep: "a" }); // misma dep

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });
});
