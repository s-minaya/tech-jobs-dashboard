import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// Crea el servidor de MSW con los handlers por defecto.
// setupServer es la versión para Node (tests), no para el browser.
// En el browser se usaría setupWorker, pero en Vitest/jsdom usamos Node.
export const server = setupServer(...handlers);