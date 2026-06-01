import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": import.meta.dirname + "/src",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    globals: true,
    // Excluimos api/ para que el runner del frontend no recoja
    // los tests del backend.
    include: ["src/tests/**/*.test.{js,jsx}"],
    exclude: ["**/node_modules/**", "**/api/**"],
  },
});
