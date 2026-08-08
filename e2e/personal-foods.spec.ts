import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { clearTheDay, clearPersonalFoods } from "./support/db";

const PASSPHRASE = process.env.ARVEN_PASSPHRASE ?? "test-passphrase";

/**
 * The tier that makes ARVEN yours.
 *
 * `סביח` is the example throughout because it is a real gap: it is named in
 * appendix A9 as everyday Israeli food, and the Ministry's database returns
 * nothing for it. Entering it once from the packet fixes that permanently.
 */
test.describe("your own foods", () => {
  test.skip(!process.env.DATABASE_URL, "no DATABASE_URL configured");

  test.beforeEach(async () => {
    await clearTheDay();
    await clearPersonalFoods();
  });

  async function signIn(page: Page) {
    await page.goto("/login");
    await page.getByPlaceholder("סיסמה").fill(PASSPHRASE);
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page).toHaveURL("/");
  }

  async function createSabich(page: Page, kcal = "220") {
    await page.getByTestId("food-name").fill("סביח");
    await page.getByTestId("food-kcal").fill(kcal);
    await page.getByTestId("food-protein").fill("8");
    await page.getByTestId("food-carbs").fill("26");
    await page.getByTestId("food-fat").fill("9");
    await page.getByTestId("save-food").click();

    // The form navigates once the mutation resolves. Without waiting for it, a
    // page.goto() that follows cancels the request in flight — which passes
    // locally, where it is fast, and fails against a real deployment.
    await page.waitForURL((url) => !url.pathname.endsWith("/foods/new"));
  }

  test("offers to create a food when the search finds nothing", async ({ page }) => {
    await signIn(page);
    await page.goto("/add");
    await page.getByTestId("food-search").fill("סביח");

    // The Ministry has no סביח. Rather than a dead end, the failure is the
    // invitation, and the name carries across.
    const create = page.getByTestId("create-food");
    await expect(create).toBeVisible({ timeout: 20_000 });
    await expect(create).toContainText("סביח");
    await page.screenshot({ path: "test-results/screens/no-results.png", fullPage: true });

    await create.click();
    await expect(page.getByTestId("food-name")).toHaveValue("סביח");
    await page.screenshot({ path: "test-results/screens/new-food.png", fullPage: true });
  });

  test("a food you created is findable straight away and ranks first", async ({ page }) => {
    await signIn(page);
    await page.goto("/foods/new?name=%D7%A1%D7%91%D7%99%D7%97");
    await createSabich(page);

    await page.goto("/add");
    await page.getByTestId("food-search").fill("סביח");

    const first = page.getByTestId("results").getByRole("listitem").first();
    await expect(first).toBeVisible({ timeout: 20_000 });
    await expect(first).toContainText("סביח");
    await expect(first).toContainText("שלך");
  });

  test("a measure you defined resolves as grounded", async ({ page }) => {
    await signIn(page);
    await page.goto("/foods/new");
    await page.getByTestId("add-unit").click();
    await page.getByTestId("unit-name-0").fill("מנה");
    await page.getByTestId("unit-grams-0").fill("250");
    await createSabich(page);

    await page.goto("/add");
    await page.getByTestId("food-search").fill("סביח");
    await page.getByTestId("results").getByRole("listitem").first().click();

    // A measure you defined yourself is a fact about your packet, so it is `●`.
    await expect(page.getByRole("button", { name: "מנה" })).toBeVisible();
    await expect(page.getByTestId("preview")).not.toContainText("~");
    await expect(page.getByTestId("preview")).toContainText("250 ג׳");

    await page.getByTestId("log").click();
    await expect(page).toHaveURL("/");
    await expect(page.getByLabel("מבוסס").first()).toBeVisible();
  });

  test("says plainly that editing reaches days already logged", async ({ page }) => {
    await signIn(page);
    await page.goto("/foods/new");
    await createSabich(page);

    await page.goto("/add");
    await page.getByTestId("food-search").fill("סביח");
    await page.getByTestId("results").getByRole("listitem").first().click();
    await page.getByTestId("log").click();
    await expect(page).toHaveURL("/");

    await page.goto("/foods");
    await page.getByRole("link", { name: /סביח/ }).click();

    // Entries point at the food rather than copying it, so a correction reaches
    // every day it appears on. Better said than discovered.
    await expect(page.getByTestId("edit-warning")).toContainText("הימים הקודמים");
    await page.screenshot({ path: "test-results/screens/edit-food.png", fullPage: true });
  });

  test("refuses to delete a food that has already been logged", async ({ page }) => {
    await signIn(page);
    await page.goto("/foods/new");
    await createSabich(page);

    await page.goto("/add");
    await page.getByTestId("food-search").fill("סביח");
    await page.getByTestId("results").getByRole("listitem").first().click();
    await page.getByTestId("log").click();
    await expect(page).toHaveURL("/");

    await page.goto("/foods");
    await page.getByRole("button", { name: "מחיקה" }).first().click();

    await expect(page.getByTestId("delete-error")).toContainText("כבר נרשם");
    await expect(page.getByTestId("my-foods").getByRole("listitem")).toHaveCount(1);
  });

  test("deletes a food that was never logged", async ({ page }) => {
    await signIn(page);
    await page.goto("/foods/new");
    await createSabich(page);

    await page.goto("/foods");
    await expect(page.getByTestId("my-foods").getByRole("listitem")).toHaveCount(1);
    await page.getByRole("button", { name: "מחיקה" }).first().click();
    await expect(page.getByText("עוד לא הוספת מזון משלך.")).toBeVisible();
  });
});
