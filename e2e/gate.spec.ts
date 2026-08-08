import { expect, test } from "@playwright/test";

const PASSPHRASE = process.env.ARVEN_PASSPHRASE ?? "test-passphrase";

test.describe("the gate", () => {
  test("sends an unauthenticated visitor to the login page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByPlaceholder("סיסמה")).toBeVisible();
    await expect(page.getByText("התמונה המלאה של הבריאות שלך.")).toBeVisible();
    await page.screenshot({ path: "test-results/screens/login.png", fullPage: true });
  });

  test("refuses a wrong passphrase and says so plainly", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("סיסמה").fill("not the passphrase");
    await page.getByRole("button", { name: "כניסה" }).click();

    await expect(page.getByTestId("login-error")).toHaveText("הסיסמה לא נכונה.");
    await expect(page).toHaveURL(/\/login$/);
    await page.screenshot({ path: "test-results/screens/login-rejected.png", fullPage: true });
  });

  test("lets the right passphrase through to the shell", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("סיסמה").fill(PASSPHRASE);
    await page.getByRole("button", { name: "כניסה" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("עוד אין כאן כלום.");
    await page.screenshot({ path: "test-results/screens/shell.png", fullPage: true });
  });

  test("keeps the session across a reload", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("סיסמה").fill(PASSPHRASE);
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page).toHaveURL("/");

    await page.reload();
    await expect(page).toHaveURL("/");
  });
});

test.describe("the shell", () => {
  test("renders right to left in Hebrew", async ({ page }) => {
    await page.goto("/login");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "he");
  });

  test("serves a standalone PWA manifest", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.dir).toBe("rtl");
    expect(manifest.lang).toBe("he");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("reserves the health ingest endpoint without implementing it", async ({ request }) => {
    const response = await request.post("/api/ingest/health", { data: { any: "payload" } });
    expect(response.status()).toBe(501);
    expect((await response.json()).error).toBe("not_implemented");
  });
});
