import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { _resetInFlightForTests } from "@/hooks/useSummaryStats";
import SummaryStats from "@/components/layout/SummaryStats";

// SLOW_LOADING_MS real es 6000ms — se mockea a un valor pequeño solo
// para el test del aviso de carga lenta, así no hace falta simular
// temporizadores (mezclar fake timers con el fetch interceptado por MSW
// es frágil: si un test con vi.useFakeTimers() falla antes de restaurar
// timers reales, deja el resto de tests del archivo colgados esperando
// un waitFor que nunca avanza). Ningún otro test de este archivo
// depende de ChartCard, así que mockear el módulo entero es seguro.
vi.mock("@/components/ui/ChartCard", () => ({ SLOW_LOADING_MS: 50 }));

// _resetInFlightForTests: useSummaryStats (fase 014) comparte una
// promesa en vuelo a nivel de módulo entre instancias — resetear antes
// de cada test evita que uno reutilice la petición ya resuelta/en vuelo
// de otro.
beforeEach(() => {
  _resetInFlightForTests();
});

// Los valores numéricos animan con useCountUp (duración por defecto
// 1200ms) — los waitFor que comprueban el valor FINAL usan un timeout
// generoso para no ser frágiles frente a la duración de la animación.
const ANIM_TIMEOUT = { timeout: 2000 };

describe("SummaryStats", () => {
  describe("estado de carga", () => {
    it("muestra 5 skeletons mientras carga", () => {
      render(<SummaryStats />);
      // Los skeletons tienen animate-pulse, es la única forma de identificarlos
      // ya que no tienen texto ni rol semántico propio
      expect(document.querySelectorAll(".animate-pulse")).toHaveLength(5);
    });

    it("los skeletons desaparecen cuando los datos llegan", async () => {
      render(<SummaryStats />);
      // Primero verificamos que los skeletons SÍ están (para evitar falso positivo)
      expect(document.querySelectorAll(".animate-pulse")).toHaveLength(5);
      // Luego esperamos a que desaparezcan
      await waitFor(() => {
        expect(document.querySelectorAll(".animate-pulse")).toHaveLength(0);
      });
    });

    it("muestra un aviso de carga lenta tras superar SLOW_LOADING_MS (fase 014)", async () => {
      // La petición nunca resuelve — nos interesa solo el estado de carga.
      server.use(http.get("/api/stats/summary", () => new Promise(() => {})));

      render(<SummaryStats />);
      expect(screen.queryByText(/tardar/i)).not.toBeInTheDocument();

      await waitFor(() => expect(screen.getByText(/tardar/i)).toBeInTheDocument());
    });
  });

  describe("datos cargados correctamente", () => {
    it("muestra las 5 etiquetas de los KPI cards (revisión post-plan, fase 014)", async () => {
      render(<SummaryStats />);
      await waitFor(() => {
        expect(screen.getByText("Empresas analizadas")).toBeInTheDocument();
        expect(screen.getByText("Roles analizados")).toBeInTheDocument();
        expect(screen.getByText("Skills rastreadas")).toBeInTheDocument();
        expect(screen.getByText("Con salario declarado")).toBeInTheDocument();
        expect(screen.getByText("Última actualización")).toBeInTheDocument();
      });
      // Las cards antiguas ya no existen — sustituidas por las de arriba.
      expect(screen.queryByText("Ofertas activas")).not.toBeInTheDocument();
      expect(screen.queryByText("Países cubiertos")).not.toBeInTheDocument();
    });

    it("muestra el número de empresas analizadas formateado, tras animar", async () => {
      render(<SummaryStats />);
      // El mock devuelve total_companies: 23248
      await waitFor(
        () => expect(screen.getByText("23.248")).toBeInTheDocument(),
        ANIM_TIMEOUT,
      );
      expect(screen.getByText("con ofertas activas")).toBeInTheDocument();
    });

    it("muestra el número de roles analizados, tras animar", async () => {
      render(<SummaryStats />);
      // El mock devuelve total_role_categories: 16
      await waitFor(
        () => expect(screen.getByText("16")).toBeInTheDocument(),
        ANIM_TIMEOUT,
      );
      expect(
        screen.getByText("categorías en Salario por rol"),
      ).toBeInTheDocument();
    });

    it("muestra el número de skills rastreadas, tras animar", async () => {
      render(<SummaryStats />);
      await waitFor(
        () => expect(screen.getByText("312")).toBeInTheDocument(),
        ANIM_TIMEOUT,
      );
    });

    it("muestra el porcentaje de ofertas con salario, tras animar", async () => {
      render(<SummaryStats />);
      await waitFor(
        () => expect(screen.getByText("34.5%")).toBeInTheDocument(),
        ANIM_TIMEOUT,
      );
    });

    it("muestra la fecha de última actualización formateada (no anima, es una fecha)", async () => {
      render(<SummaryStats />);
      // El handler devuelve "2025-05-15T10:30:00.000Z"
      // /may/i cubre "may", "May", "mayo" según el locale del sistema
      await waitFor(() => {
        expect(screen.getByText(/may/i)).toBeInTheDocument();
      });
    });

    it("la descripción de 'Última actualización' ya no dice 'oferta más reciente'", async () => {
      render(<SummaryStats />);
      await waitFor(() => {
        expect(
          screen.getByText("última sincronización con la fuente"),
        ).toBeInTheDocument();
        expect(screen.queryByText("oferta más reciente")).not.toBeInTheDocument();
      });
    });

    it("con datos distintos, los números animados reflejan el valor real (no un texto fijo)", async () => {
      server.use(
        http.get("/api/stats/summary", () =>
          HttpResponse.json({
            total_active_jobs: 100,
            total_countries: 5,
            total_skills: 10,
            pct_with_salary: "10.0",
            last_updated: "2025-05-15T10:30:00.000Z",
            median_salary_90d: 40000,
            top_skills_30d: [],
            total_companies: 77,
            total_role_categories: 3,
          }),
        ),
      );
      render(<SummaryStats />);
      await waitFor(
        () => expect(screen.getByText("77")).toBeInTheDocument(),
        ANIM_TIMEOUT,
      );
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("10.0%")).toBeInTheDocument();
    });
  });

  describe("manejo de errores", () => {
    it("no rompe la UI si el endpoint falla y no muestra KPI cards", async () => {
      server.use(http.get("/api/stats/summary", () => HttpResponse.error()));

      render(<SummaryStats />);

      // Primero verificamos que los skeletons SÍ aparecen al montar.
      // Sin esta comprobación el test podría pasar trivialmente si el
      // componente devuelve null desde el principio por algún otro motivo.
      expect(document.querySelectorAll(".animate-pulse")).toHaveLength(5);

      // Esperamos a que el estado de carga termine (los skeletons desaparecen)
      await waitFor(() => {
        expect(document.querySelectorAll(".animate-pulse")).toHaveLength(0);
      });

      // Después del error el componente devuelve null: no hay KPI cards
      expect(screen.queryByText("Empresas analizadas")).not.toBeInTheDocument();
    });
  });
});
