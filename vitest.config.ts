import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit tests only. No browser, no database, no network — these must stay
    // fast enough to run on every keystroke and in CI without a service.
    include: ["packages/*/src/**/*.test.ts", "apps/web/src/**/*.test.ts"],
    environment: "node",
  },
});
