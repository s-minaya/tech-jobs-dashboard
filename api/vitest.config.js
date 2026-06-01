import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // forks es necesario para módulos ESM nativos en Node.
    // El modo por defecto (threads) tiene problemas con import/export ESM.
    pool: "forks",
    globals: true,
  },
});
