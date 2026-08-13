import { test, expect } from "@playwright/test";

// Helpers compartidos
async function skipLanding(page) {
  await page.goto("/");
  await page.evaluate(() => sessionStorage.setItem("landed", "1"));
  await page.reload();
}

async function goToLanding(page) {
  await page.goto("/");
  await page.evaluate(() => sessionStorage.removeItem("landed"));
  await page.reload();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LANDING → DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
test("landing → dashboard: pulsar el botón lleva al dashboard", async ({
  page,
}) => {
  await goToLanding(page);

  // La landing debe mostrar el CTA
  await expect(page.getByText(/explorar el dashboard/i)).toBeVisible({
    timeout: 10_000,
  });
  await page.getByText(/explorar el dashboard/i).click();

  // El dashboard debe aparecer
  await expect(
    page.getByRole("heading", { name: /tech jobs dashboard/i }),
  ).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1b. LANDING — stats rediseñadas (fase 014)
// ─────────────────────────────────────────────────────────────────────────────
// Lightfall (WebGL) impide testear LandingPage con Testing Library/jsdom
// (sin contexto WebGL real) — mismo motivo por el que MainContent
// tampoco tiene test unitario. Esta verificación vive en E2E, con un
// navegador real, en su lugar.
test("landing: las 3 cards de stats muestran datos reales, sin el badge antiguo", async ({
  page,
}) => {
  await goToLanding(page);

  await expect(
    page.getByText(/explora el mercado por país/i),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText(/compara salarios en europa/i),
  ).toBeVisible();
  await expect(
    page.getByText(/descubre dónde está la demanda/i),
  ).toBeVisible();

  // El badge "Mercado tech europeo · 8 países · Datos en tiempo real" se eliminó.
  await expect(
    page.getByText(/datos en tiempo real/i),
  ).not.toBeVisible();

  // Los contadores animados terminan mostrando un número real (no "…").
  await expect(page.getByText("países").locator("..")).not.toContainText("…", {
    timeout: 10_000,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SESSION STORAGE
// ─────────────────────────────────────────────────────────────────────────────
test("sessionStorage: recargar no muestra la landing de nuevo", async ({
  page,
}) => {
  await goToLanding(page);
  await page.getByText(/explorar el dashboard/i).click();
  await expect(
    page.getByRole("heading", { name: /tech jobs dashboard/i }),
  ).toBeVisible({ timeout: 10_000 });

  await page.reload();

  // La landing no debe volver a aparecer
  await expect(page.getByText(/explorar el dashboard/i)).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: /tech jobs dashboard/i }),
  ).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. KPI CARDS
// ─────────────────────────────────────────────────────────────────────────────
test("KPI cards: muestran datos reales de la API", async ({ page }) => {
  await skipLanding(page);

  // Esperamos a que los skeletons desaparezcan. Labels actualizados en
  // la revisión post-plan de la fase 014: "Ofertas activas"/"Países
  // cubiertos" se sustituyeron por "Empresas analizadas"/"Roles
  // analizados" (esos dos números ya se muestran en la landing).
  await expect(
    page.getByText("Empresas analizadas", { exact: true }),
  ).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByText("Roles analizados", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Skills rastreadas", { exact: true }),
  ).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TOP SKILLS
// ─────────────────────────────────────────────────────────────────────────────
test("Top Skills: la gráfica carga con el badge de ofertas", async ({
  page,
}) => {
  await skipLanding(page);

  await expect(page.getByRole("heading", { name: /top skills/i })).toBeVisible({
    timeout: 15_000,
  });

  // El badge de ofertas indica que los datos llegaron de la API
  await expect(page.getByText(/\d+\.?\d*\s*ofertas/).first()).toBeVisible({
    timeout: 15_000,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. EVOLUCIÓN MENSUAL
// ─────────────────────────────────────────────────────────────────────────────
test("Evolución mensual: la gráfica aparece al hacer scroll", async ({
  page,
}) => {
  await skipLanding(page);

  const heading = page.getByRole("heading", { name: /evolución mensual/i });
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toBeVisible({ timeout: 15_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SALARIO
// ─────────────────────────────────────────────────────────────────────────────
test("Salario: la gráfica aparece al hacer scroll", async ({ page }) => {
  await skipLanding(page);

  const heading = page.getByRole("heading", { name: /salario mediano/i });
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toBeVisible({ timeout: 15_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. HEATMAP
// ─────────────────────────────────────────────────────────────────────────────
test("Heatmap: aparece la sección de co-ocurrencia al hacer scroll", async ({
  page,
}) => {
  await skipLanding(page);

  const heading = page.getByRole("heading", { name: /co-ocurrencia/i });
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toBeVisible({ timeout: 15_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. FILTRAR POR PAÍS
// ─────────────────────────────────────────────────────────────────────────────
test("Filtros: seleccionar Alemania actualiza el badge de filtros activos", async ({
  page,
}) => {
  await skipLanding(page);
  // "Skills rastreadas" como ancla de "las KPI cards ya cargaron": a
  // diferencia de "Ofertas activas" (eliminada en la revisión post-plan
  // de la fase 014), esta card no ha cambiado de nombre.
  await expect(page.getByText("Skills rastreadas", { exact: true })).toBeVisible({
    timeout: 15_000,
  });

  // El FAB es el div fixed top-4 left-4 — hacemos click en el wrapper del GlowButton
  await page.locator("div.fixed.top-4.left-4 button").click();

  // El drawer se desliza — esperamos al título "Filtros" dentro del drawer
  const drawer = page.locator("div.fixed.top-0.left-0.z-50");
  await expect(drawer).toBeVisible({ timeout: 5_000 });

  // Seleccionamos Alemania dentro del drawer — el chip muestra el nombre
  // traducido ("Alemania"), no el código crudo ("DE"), desde que la fase
  // 013 tradujo el sidebar completo (OPTION_LABELS en FilterSection.jsx).
  // Este test seguía buscando "DE" literal — descubierto al ejecutar el
  // E2E completo por primera vez desde esa fase (fase 014).
  await drawer.getByRole("button", { name: /^Alemania$/ }).click();
  await drawer.getByRole("button", { name: /ver resultados/i }).click();

  // El anillo pulsante del FAB indica filtro activo
  await expect(page.locator(".animate-ping")).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. RESETEAR FILTROS
// ─────────────────────────────────────────────────────────────────────────────
test("Filtros: resetear elimina el badge de filtros activos", async ({
  page,
}) => {
  await skipLanding(page);
  // "Skills rastreadas" como ancla de "las KPI cards ya cargaron": a
  // diferencia de "Ofertas activas" (eliminada en la revisión post-plan
  // de la fase 014), esta card no ha cambiado de nombre.
  await expect(page.getByText("Skills rastreadas", { exact: true })).toBeVisible({
    timeout: 15_000,
  });

  // Abrimos el drawer
  await page.locator("div.fixed.top-4.left-4 button").click();
  const drawer = page.locator("div.fixed.top-0.left-0.z-50");
  await expect(drawer).toBeVisible({ timeout: 5_000 });

  // Activamos un filtro — nombre traducido, mismo motivo que el test anterior.
  await drawer.getByRole("button", { name: /^Francia$/ }).click();

  // Reseteamos desde dentro del drawer
  await drawer.getByRole("button", { name: /resetear/i }).click();
  await drawer.getByRole("button", { name: /ver resultados/i }).click();

  // El anillo pulsante no debe aparecer
  await expect(page.locator(".animate-ping")).not.toBeVisible({
    timeout: 5_000,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. TOGGLE DE TEMA
// ─────────────────────────────────────────────────────────────────────────────
test("Tema: el toggle cambia entre dark y light mode", async ({ page }) => {
  await skipLanding(page);

  const html = page.locator("html");
  const isDarkBefore = await html.evaluate((el) =>
    el.classList.contains("dark"),
  );

  // ThemeToggle es un <button> con aria-label dinámico según el tema actual
  const toggle = page.getByRole("button", {
    name: /cambiar a modo (claro|oscuro)/i,
  });
  await toggle.click();

  const isDarkAfter = await html.evaluate((el) =>
    el.classList.contains("dark"),
  );
  expect(isDarkAfter).toBe(!isDarkBefore);
});
