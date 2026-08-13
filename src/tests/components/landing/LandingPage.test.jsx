import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { http } from "msw";
import { server } from "@/mocks/server";
import { _resetInFlightForTests } from "@/hooks/useSummaryStats";
import LandingPage from "@/components/landing/LandingPage";

// LandingPage renderizada por completo (con Lightfall, WebGL) no se
// puede testear con Testing Library/jsdom — jsdom no implementa un
// contexto WebGL real y `ogl` (la librería del efecto) lo necesita para
// inicializarse, igual que MainContent (Aurora) tampoco tiene test
// unitario. Ver spec/features/014-summary-stats-quality/014-tasks.md.
//
// Este archivo solo cubre el estado de carga (fase 014, revisión
// post-plan): mientras useSummaryStats().loading es true, LandingPage
// devuelve <PageLoader/> ANTES de llegar al JSX que monta Lightfall —
// eso sí es seguro de renderizar en jsdom. El resto (Lightfall montado,
// las 3 cards, los contadores) se verifica con E2E real
// (e2e/dashboard.spec.js).
beforeEach(() => {
  _resetInFlightForTests();
});

describe("LandingPage — estado de carga", () => {
  it("mientras los stats cargan, muestra el loader (logo) y no el hero/CTA", () => {
    // La petición nunca resuelve — nos interesa solo el estado de carga.
    server.use(http.get("/api/stats/summary", () => new Promise(() => {})));

    render(<LandingPage onEnter={() => {}} />);

    expect(screen.getByAltText("Loading")).toBeInTheDocument();
    expect(screen.queryByText(/explorar el dashboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tech jobs/i)).not.toBeInTheDocument();
  });
});
