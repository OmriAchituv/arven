import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { clearTheDay, clearDishes, clearPersonalFoods } from "./support/db";

const PASSPHRASE = process.env.ARVEN_PASSPHRASE ?? "test-passphrase";

/**
 * Repetition without repetition.
 *
 * Most days repeat most foods, and a Dish is how that stops being retyping. It
 * is also why eating occasions are not modelled: what recurs is the
 * composition, not the hour.
 */
test.describe("dishes", () => {
  test.skip(!process.env.DATABASE_URL, "no DATABASE_URL configured");

  test.beforeEach(async () => {
    await clearTheDay();
    await clearDishes();
    await clearPersonalFoods();
  });

  async function signIn(page: Page) {
    await page.goto("/login");
    await page.getByPlaceholder("סיסמה").fill(PASSPHRASE);
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page).toHaveURL("/");
  }

  async function logGrams(page: Page, query: string, grams: string) {
    await page.goto("/add");
    await page.getByTestId("food-search").fill(query);
    const results = page.getByTestId("results").getByRole("listitem");
    await expect(results.first()).toBeVisible({ timeout: 20_000 });
    await results.first().click();
    await page.getByRole("button", { name: "גרמים" }).click();
    await page.getByTestId("amount").fill(grams);
    await page.getByTestId("log").click();
    await expect(page).toHaveURL("/");
  }

  test("a day becomes a dish", async ({ page }) => {
    await signIn(page);
    await logGrams(page, "קוטג", "200");
    await logGrams(page, "חלה", "60");

    // Nobody defines a composition in the abstract — they log breakfast, notice
    // it is the breakfast they always have, and name it.
    await page.getByTestId("save-as-dish").click();
    await page.getByTestId("dish-name").fill("הבוקר שלי");
    await page.screenshot({ path: "test-results/screens/save-dish.png", fullPage: true });
    await page.getByTestId("confirm-dish").click();

    await expect(page).toHaveURL("/dishes");
    await expect(page.getByTestId("dishes").getByRole("listitem")).toHaveCount(1);
    await expect(page.getByText("הבוקר שלי")).toBeVisible();
  });

  test("logs in one tap, with its components visible", async ({ page }) => {
    await signIn(page);
    await logGrams(page, "קוטג", "200");
    await page.getByTestId("save-as-dish").click();
    await page.getByTestId("dish-name").fill("הבוקר שלי");
    await page.getByTestId("confirm-dish").click();
    await expect(page).toHaveURL("/dishes");

    // A dish that cannot be inspected is the frozen number this model exists to
    // avoid, so opening one shows what is in it.
    await page.getByRole("button", { name: "הבוקר שלי" }).click();
    await expect(page.getByText("200 ג׳")).toBeVisible();
    await page.screenshot({ path: "test-results/screens/dishes.png", fullPage: true });

    await clearTheDay();
    await page.getByTestId("log-dish-1").click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("listitem").filter({ hasText: "הבוקר שלי" })).toBeVisible();
  });

  test("half a dish is exactly half of everything in it", async ({ page }) => {
    await signIn(page);
    await logGrams(page, "קוטג", "200");

    const full = await page.getByRole("listitem").first().textContent();
    const fullKcal = Number(full?.match(/(\d[\d,]*)\s*$/)?.[1]?.replace(/,/g, ""));

    await page.getByTestId("save-as-dish").click();
    await page.getByTestId("dish-name").fill("חצי בוקר");
    await page.getByTestId("confirm-dish").click();
    await expect(page).toHaveURL("/dishes");

    await clearTheDay();
    await page.getByRole("button", { name: "חצי בוקר" }).click();
    await page.getByTestId("log-dish-0.5").click();
    await expect(page).toHaveURL("/");

    const row = page.getByRole("listitem").first();
    await expect(row).toContainText("½");

    const half = await row.textContent();
    const halfKcal = Number(half?.match(/(\d[\d,]*)\s*$/)?.[1]?.replace(/,/g, ""));
    expect(halfKcal).toBeCloseTo(fullKcal / 2, 0);

    await page.screenshot({ path: "test-results/screens/dish-half.png", fullPage: true });
  });

  test("a dish is only as grounded as its least certain part", async ({ page }) => {
    await signIn(page);

    // One weighed component, one judged size.
    await logGrams(page, "קוטג", "200");
    await page.goto("/add");
    await page.getByTestId("food-search").fill("חלה");
    const results = page.getByTestId("results").getByRole("listitem");
    await expect(results.first()).toBeVisible({ timeout: 20_000 });
    await results.first().click();
    await page.getByRole("button", { name: /דקה|בינונית|עבה/ }).first().click();
    await page.getByTestId("log").click();
    await expect(page).toHaveURL("/");

    await page.getByTestId("save-as-dish").click();
    await page.getByTestId("dish-name").fill("בוקר מוערך");
    await page.getByTestId("confirm-dish").click();
    await expect(page).toHaveURL("/dishes");

    // You cannot average a guess away.
    await expect(page.getByLabel("מוערך").first()).toBeVisible();
  });
});
