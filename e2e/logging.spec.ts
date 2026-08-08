import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const PASSPHRASE = process.env.ARVEN_PASSPHRASE ?? "test-passphrase";

/**
 * The claim of this slice: search Israeli food data in Hebrew, choose a portion
 * the way a person would say it, and see a grounded number on Today.
 *
 * Needs the seeded database, so it skips when there is no connection string.
 * CI always has one.
 */
test.describe("logging a food", () => {
  test.skip(!process.env.DATABASE_URL, "no DATABASE_URL configured");

  async function signIn(page: Page) {
    await page.goto("/login");
    await page.getByPlaceholder("סיסמה").fill(PASSPHRASE);
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page).toHaveURL("/");
  }

  test("finds Israeli food typed without its apostrophe", async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "הוספה" }).click();

    // No geresh, and the search still has to find גבינת קוטג'.
    await page.getByTestId("food-search").fill("קוטג");

    const results = page.getByTestId("results").getByRole("listitem");
    await expect(results.first()).toBeVisible({ timeout: 20_000 });
    await expect(results.first()).toContainText("קוטג");
    await expect(results.first()).toContainText("משרד הבריאות");

    await page.screenshot({ path: "test-results/screens/search.png", fullPage: true });
  });

  test("offers the household measures the Ministry supplies", async ({ page }) => {
    await signIn(page);
    await page.goto("/add");
    await page.getByTestId("food-search").fill("קוטג");

    const results = page.getByTestId("results").getByRole("listitem");
    await expect(results.first()).toBeVisible({ timeout: 20_000 });
    await results.first().click();

    // כף, כפית and גביע come from a lookup table, not from a model.
    await expect(page.getByRole("button", { name: "גרמים" })).toBeVisible();
    await expect(page.getByTestId("preview")).toBeVisible();

    await page.screenshot({ path: "test-results/screens/portion.png", fullPage: true });
  });

  test("logs a weighed portion and shows it on Today", async ({ page }) => {
    await signIn(page);
    await page.goto("/add");
    await page.getByTestId("food-search").fill("קוטג");

    const results = page.getByTestId("results").getByRole("listitem");
    await expect(results.first()).toBeVisible({ timeout: 20_000 });
    const chosen = (await results.first().textContent()) ?? "";
    await results.first().click();

    await page.getByRole("button", { name: "גרמים" }).click();
    await page.getByTestId("amount").fill("200");

    // The preview is computed from the food's per-100g values, before anything
    // is written.
    await expect(page.getByTestId("preview")).toContainText("200 ג׳");

    await page.getByTestId("log").click();
    await expect(page).toHaveURL("/");

    // It is on the day, and it is grounded.
    const entry = page.getByRole("listitem").first();
    await expect(entry).toContainText(chosen.slice(0, 8).trim());
    await expect(entry).toContainText("200 ג׳");
    await expect(page.getByLabel("מבוסס").first()).toBeVisible();

    await page.screenshot({ path: "test-results/screens/today.png", fullPage: true });
  });

});
