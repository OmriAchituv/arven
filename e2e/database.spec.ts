import { expect, test } from "@playwright/test";

const PASSPHRASE = process.env.ARVEN_PASSPHRASE ?? "test-passphrase";

/**
 * The cheapest proof that a deployment can reach its database, asserted at the
 * API rather than through a widget on screen.
 *
 * The walking skeleton rendered this on the shell, which was right when there
 * was nothing else to render. The Today screen replaced it — a product screen
 * should not carry a diagnostic readout — so the check moved here.
 *
 * Goes through the browser context rather than a bare request, because the gate
 * covers the API too: an unauthenticated call is redirected to /login, which is
 * exactly what it should do.
 */
test.describe("the database is reachable", () => {
  test.skip(!process.env.DATABASE_URL, "no DATABASE_URL configured");

  test("returns the schema version written by a migration", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("סיסמה").fill(PASSPHRASE);
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page).toHaveURL("/");

    // Neon may be waking from scale-to-zero.
    const response = await page.request.get("/api/trpc/system.status", { timeout: 20_000 });
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.result.data.schemaVersion).toBe("1");
  });

  test("keeps the gate in front of the API", async ({ request }) => {
    const response = await request.get("/api/trpc/system.status", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
  });
});
