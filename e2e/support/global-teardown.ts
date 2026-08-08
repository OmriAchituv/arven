import { createDb, entries } from "@arven/db";
import { gte } from "drizzle-orm";

import { STARTED_AT } from "./global-setup";
import { clearDishes, clearPersonalFoods } from "./db";

/** Removes exactly what this run logged, and nothing older. */
export default async function globalTeardown() {
  const url = process.env.DATABASE_URL;
  const startedAt = process.env[STARTED_AT];
  if (!url || !startedAt) return;

  const removed = await createDb(url)
    .delete(entries)
    .where(gte(entries.createdAt, new Date(startedAt)))
    .returning({ id: entries.id });

  await clearDishes();
  await clearPersonalFoods();

  if (removed.length > 0) {
    console.log(`\ncleaned up ${removed.length} entries logged by this run`);
  }
}
