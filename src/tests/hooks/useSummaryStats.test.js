import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useSummaryStats,
  _resetInFlightForTests,
} from "@/hooks/useSummaryStats";
import { getSummaryStats } from "@/services/jobServices";

vi.mock("@/services/jobServices");

// Tests de useSummaryStats (fase 014) — hook compartido por SummaryStats
// y LandingPage. El foco principal es la deduplicación: dos instancias
// montadas mientras hay una petición en vuelo deben compartir la MISMA
// llamada real a getSummaryStats, no una por instancia (ver
// spec/features/014-summary-stats-quality/014-spec.md, hallazgo 2).
describe("useSummaryStats", () => {
  beforeEach(() => {
    _resetInFlightForTests();
    vi.clearAllMocks();
  });

  it("devuelve loading=true y stats=null antes de resolver", () => {
    getSummaryStats.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useSummaryStats());
    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();
  });

  it("devuelve los stats una vez resuelve la petición", async () => {
    const datos = { total_active_jobs: 100 };
    getSummaryStats.mockResolvedValue(datos);
    const { result } = renderHook(() => useSummaryStats());
    await waitFor(() => expect(result.current.stats).toEqual(datos));
    expect(result.current.loading).toBe(false);
  });

  it("expone el error si la petición falla", async () => {
    getSummaryStats.mockRejectedValue(new Error("500 en /api/stats/summary"));
    const { result } = renderHook(() => useSummaryStats());
    await waitFor(() =>
      expect(result.current.error).toBe("500 en /api/stats/summary"),
    );
    expect(result.current.loading).toBe(false);
  });

  it("dos instancias montadas mientras la petición está en vuelo comparten UNA sola llamada real", async () => {
    let resolvePromise;
    getSummaryStats.mockReturnValue(
      new Promise((r) => {
        resolvePromise = r;
      }),
    );

    const a = renderHook(() => useSummaryStats());
    const b = renderHook(() => useSummaryStats());

    expect(getSummaryStats).toHaveBeenCalledTimes(1);

    const datos = { total_active_jobs: 200 };
    resolvePromise(datos);

    await waitFor(() => expect(a.result.current.stats).toEqual(datos));
    await waitFor(() => expect(b.result.current.stats).toEqual(datos));
  });

  it("una vez resuelta la promesa en vuelo, un montaje posterior dispara una petición nueva", async () => {
    getSummaryStats.mockResolvedValue({ total_active_jobs: 1 });
    const a = renderHook(() => useSummaryStats());
    await waitFor(() => expect(a.result.current.loading).toBe(false));

    const b = renderHook(() => useSummaryStats());
    await waitFor(() => expect(b.result.current.loading).toBe(false));

    expect(getSummaryStats).toHaveBeenCalledTimes(2);
  });

  it("desmontar antes de resolver no actualiza el estado (sin warning de componente desmontado)", async () => {
    let resolvePromise;
    getSummaryStats.mockReturnValue(
      new Promise((r) => {
        resolvePromise = r;
      }),
    );
    const { unmount } = renderHook(() => useSummaryStats());
    unmount();
    // Resolver DESPUÉS de desmontar no debe lanzar ni loguear un error de
    // React — si el guard `cancelled` no funcionara, React avisaría por
    // consola al llamar a setState sobre un hook ya desmontado.
    resolvePromise({ total_active_jobs: 1 });
    await new Promise((r) => setTimeout(r, 0));
  });
});
