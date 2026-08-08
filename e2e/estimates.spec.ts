import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { clearTheDay } from "./support/db";

const PASSPHRASE = process.env.ARVEN_PASSPHRASE ?? "test-passphrase";

/**
 * The promise made visible: a guess is shown as a guess, and weighing it turns
 * it into a measurement.
 *
 * `חלה` is used because the Ministry gives it three slice thicknesses — דקה,
 * בינונית, עבה — and choosing between them is exactly the judgement that makes
 * a portion an estimate rather than a measurement.
 */
test.describe("estimates", () => {
  test.skip(!process.env.DATABASE_URL, "no DATABASE_URL configured");

  test.beforeEach(clearTheDay);

  async function signIn(page: Page) {
    await page.goto("/login");
    await page.getByPlaceholder("סיסמה").fill(PASSPHRASE);
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page).toHaveURL("/");
  }

  async function pickFirst(page: Page, query: string) {
    await page.goto("/add");
    await page.getByTestId("food-search").fill(query);
    const results = page.getByTestId("results").getByRole("listitem");
    await expect(results.first()).toBeVisible({ timeout: 20_000 });
    await results.first().click();
  }

  test("marks a judged size as an estimate before it is logged", async ({ page }) => {
    await signIn(page);
    await pickFirst(page, "חלה");

    const sized = page.getByRole("button", { name: /דקה|בינונית|עבה/ }).first();
    await expect(sized).toBeVisible();
    await sized.click();

    // Choosing "a medium one" is a judgement, so the preview says so before
    // anything is written.
    await expect(page.getByTestId("preview")).toContainText("~");
    await expect(page.getByTestId("preview")).toContainText("בערך");

    await page.screenshot({ path: "test-results/screens/estimate.png", fullPage: true });
  });

  test("lets any measure be marked approximate", async ({ page }) => {
    await signIn(page);
    await pickFirst(page, "קוטג");

    // A tablespoon is a real measure — until you say you did not measure it.
    await expect(page.getByTestId("preview")).not.toContainText("~");
    await page.getByTestId("roughly").check();
    await expect(page.getByTestId("preview")).toContainText("~");
  });

  test("shows a band on the day, and narrows it when the estimate is weighed", async ({ page }) => {
    await signIn(page);
    await pickFirst(page, "חלה");

    await page.getByRole("button", { name: /דקה|בינונית|עבה/ }).first().click();
    await page.getByTestId("log").click();
    await expect(page).toHaveURL("/");

    // An estimate is on the day, so the total admits to a range.
    const total = page.locator("main");
    await expect(total).toContainText("±");
    await expect(page.getByLabel("מוערך").first()).toBeVisible();
    await page.screenshot({ path: "test-results/screens/band.png", fullPage: true });

    // Weighing it is offered, never demanded.
    await page.getByTestId("weigh-open").first().click();
    await page.getByTestId("weigh-amount").fill("150");
    await page.getByTestId("weigh-save").click();

    // Now it is a measurement: the mark flips and the band goes.
    await expect(page.getByLabel("מבוסס").first()).toBeVisible({ timeout: 15_000 });
    await expect(total).not.toContainText("±");
    await expect(page.getByRole("listitem").first()).toContainText("150 ג׳");

    await page.screenshot({ path: "test-results/screens/weighed.png", fullPage: true });
  });

  test("keeps ± and ~ on the correct side of their number", async ({ page }) => {
    await signIn(page);
    await pickFirst(page, "חלה");
    await page.getByRole("button", { name: /דקה|בינונית|עבה/ }).first().click();
    await page.getByTestId("log").click();
    await expect(page).toHaveURL("/");

    // Text content reads the same whichever way these render, so the assertion
    // has to be on direction. Without the isolate, "± 13" displays as "13 ±" —
    // appendix A29's most common RTL bug, and it shipped once already.
    const band = page.getByText("±");
    await expect(band).toHaveCSS("direction", "ltr");

    const estimated = page.getByRole("listitem").first().getByText(/~/);
    await expect(estimated).toHaveCSS("direction", "ltr");
  });
});
