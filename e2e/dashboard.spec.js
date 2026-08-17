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
// (sin contexto WebGL real) — mismo motivo por el que HomePage.jsx
// (DarkVeil/Aurora en su hero) tampoco tiene test unitario. Esta
// verificación vive en E2E, con un navegador real, en su lugar.
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
// 4. TOP SKILLS — ruta propia desde la fase 016
// ─────────────────────────────────────────────────────────────────────────────
test("Top Skills: la gráfica carga con el badge de ofertas en /top-skills", async ({
  page,
}) => {
  await skipLanding(page);
  await page.goto("/top-skills");

  await expect(page.getByRole("heading", { name: /top skills/i })).toBeVisible({
    timeout: 15_000,
  });

  // El badge de ofertas indica que los datos llegaron de la API
  await expect(page.getByText(/\d+\.?\d*\s*ofertas/).first()).toBeVisible({
    timeout: 15_000,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. EVOLUCIÓN MENSUAL — ruta propia desde la fase 016
// ─────────────────────────────────────────────────────────────────────────────
test("Evolución mensual: la gráfica carga en /tendencias", async ({
  page,
}) => {
  await skipLanding(page);
  await page.goto("/tendencias");

  await expect(
    page.getByRole("heading", { name: /evolución mensual/i }),
  ).toBeVisible({ timeout: 15_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SALARIO — ruta propia desde la fase 016
// ─────────────────────────────────────────────────────────────────────────────
test("Salario: la gráfica carga en /salarios", async ({ page }) => {
  await skipLanding(page);
  await page.goto("/salarios");

  await expect(
    page.getByRole("heading", { name: /salario mediano/i }),
  ).toBeVisible({ timeout: 15_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. HEATMAP — ruta propia desde la fase 016
// ─────────────────────────────────────────────────────────────────────────────
test("Heatmap: aparece la sección de co-ocurrencia en /skills", async ({
  page,
}) => {
  await skipLanding(page);
  await page.goto("/skills");

  await expect(
    page.getByRole("heading", { name: /co-ocurrencia/i }),
  ).toBeVisible({ timeout: 15_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. FILTRAR POR PAÍS — DesktopFilterSidebar desde la fase 016 (bloque D),
//    sustituye al FAB + FilterDrawer que este test usaba antes
// ─────────────────────────────────────────────────────────────────────────────
test("Filtros: seleccionar Alemania actualiza el badge de filtros activos", async ({
  page,
}) => {
  await skipLanding(page);
  await page.goto("/tendencias");

  // DesktopFilterSidebar vive siempre en el layout de la página, abierto
  // por defecto — no hay FAB que pulsar ni panel que esperar a que se
  // deslice.
  const sidebar = page.getByLabel("Filtros de la gráfica");
  await expect(sidebar).toBeVisible({ timeout: 15_000 });

  // El chip muestra el nombre traducido ("Alemania"), no el código
  // crudo ("DE") — OPTION_LABELS en filterUtils.js.
  await sidebar.getByRole("button", { name: /^Alemania$/ }).click();

  // El badge junto a "Filtros" muestra el nº de filtros activos.
  await expect(sidebar.getByText("1", { exact: true })).toBeVisible({
    timeout: 5_000,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. RESETEAR FILTROS — DesktopFilterSidebar desde la fase 016 (bloque D)
// ─────────────────────────────────────────────────────────────────────────────
test("Filtros: resetear elimina el badge de filtros activos", async ({
  page,
}) => {
  await skipLanding(page);
  await page.goto("/tendencias");

  const sidebar = page.getByLabel("Filtros de la gráfica");
  await expect(sidebar).toBeVisible({ timeout: 15_000 });

  await sidebar.getByRole("button", { name: /^Francia$/ }).click();
  await expect(sidebar.getByText("1", { exact: true })).toBeVisible({
    timeout: 5_000,
  });

  await sidebar.getByRole("button", { name: /resetear/i }).click();
  await expect(sidebar.getByText("1", { exact: true })).not.toBeVisible({
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

  // ThemeToggle vive montado en dos sitios a la vez (Header en md+,
  // flotante en móvil) — se escopa a Header porque este spec corre en
  // el viewport desktop por defecto de playwright.config.js, donde el
  // flotante existe en el DOM pero no es visible.
  const toggle = page
    .locator("header")
    .getByRole("button", { name: /cambiar a modo (claro|oscuro)/i });
  await toggle.click();

  const isDarkAfter = await html.evaluate((el) =>
    el.classList.contains("dark"),
  );
  expect(isDarkAfter).toBe(!isDarkBefore);
});
