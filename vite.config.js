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
    // Los archivos de test viven en src/tests/ (sin guiones bajos).
    // Excluimos api/ para que el runner del frontend no recoja
    // los tests del backend.
    include: ["src/tests/**/*.test.{js,jsx}"],
    exclude: ["**/node_modules/**", "**/api/**"],

    // Coverage con v8 (sin dependencias extra).
    // Ejecutar con: npx vitest run --coverage
    coverage: {
      provider: "v8",
      // Solo medimos el código fuente de la app — excluimos tests,
      // mocks, config y assets que no tienen lógica testeable.
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        // Infraestructura de tests — no es código de producción
        "src/tests/**",
        "src/test/**",
        "src/mocks/**",
        // Punto de entrada — solo monta React, no hay lógica testeable
        "src/main.jsx",
        // Configuración estática — arrays de datos, sin lógica
        "src/config/**",
        // Componentes puramente visuales sin lógica de negocio —
        // cubiertos por E2E, no merece la pena testear que React renderiza JSX
        "src/components/ui/PageLoader.jsx",
        "src/components/ui/Aurora.jsx",
        "src/components/ui/DarkVeil.jsx",
        "src/components/ui/Lightfall.jsx",
        "src/components/ui/DecryptedText.jsx",
        "src/components/ui/GlowButton.jsx",
        "src/components/landing/LandingPage.jsx",
        "src/components/layout/MainContent.jsx",
        "src/components/Filters/FilterSheet.jsx",
        "src/components/Filters/FilterDrawer.jsx",
        // Componentes shadcn/ui generados — no son código nuestro
        // Componentes shadcn/ui generados — no son código nuestro
        "src/components/ui/button.jsx",
        "src/components/ui/table.jsx",
        "src/components/ui/chart.jsx",
        // App.jsx — orquestador de alto nivel, cubierto por E2E
        "src/App.jsx",
      ],
      // Umbrales mínimos — el build falla en CI si no se alcanzan.
      // Los ajustamos según la cobertura real que veamos.
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
      // Reportes: text en terminal + html para ver el detalle en el navegador
      reporter: ["text", "html"],
      // El reporte HTML se genera en coverage/ en la raíz del proyecto
      reportsDirectory: "./coverage",
    },
  },
});
