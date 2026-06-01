import "@testing-library/jest-dom";
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
