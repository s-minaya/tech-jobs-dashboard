import "@testing-library/jest-dom";

// jsdom no implementa ResizeObserver — lo mockeamos para HeatmapSvg y DarkVeil.
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom no implementa window.matchMedia — lo mockeamos para que
// componentes como SkillHeatmap (useOrientation) no fallen en tests.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "../mocks/server.js";

// Arranca el servidor de MSW antes de todos los tests.
// onUnhandledRequest: "warn" avisa en consola si algún test hace una
// petición que no tiene handler definido, sin romper el test.
// Útil para detectar peticiones inesperadas durante el desarrollo.
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Resetea los handlers después de cada test para que los tests
// no se contaminen entre sí. Si un test añade un handler especial,
// el siguiente test empieza con los handlers originales.
afterEach(() => server.resetHandlers());

// Para el servidor al terminar todos los tests para liberar recursos.
afterAll(() => server.close());

// Limpia localStorage entre tests para evitar que los avisos descartados
// en un test afecten a los siguientes (FilterWarningPopover usa localStorage).
afterEach(() => localStorage.clear());
