import { expect, test } from "@playwright/test";

const PASSPHRASE = process.env.ARVEN_PASSPHRASE ?? "test-passphrase";

/**
 * The end-to-end claim of this slice: a value written by a migration comes back
 * through Neon, Drizzle and tRPC, and renders in a browser.
 *
 * Skipped when no database is configured, so the suite still runs on a laptop
 * with no connection string. CI and preview deployments always have one, which
 * is where this assertion actually has to hold.
 */
test.describe("database round trip", () => {
  test.skip(!process.env.DATABASE_URL, "no DATABASE_URL configured");

  test("renders a value read from the database", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("סיסמה").fill(PASSPHRASE);
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page).toHaveURL("/");

    // Neon may be waking from scale-to-zero, so allow for it.
    await expect(page.getByTestId("status")).toContainText("מחובר", { timeout: 20_000 });
    await expect(page.getByTestId("status")).toContainText("גרסת סכימה 1");

    await page.screenshot({ path: "test-results/screens/shell-connected.png", fullPage: true });
  });
});
