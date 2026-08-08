import { createDb, dishComponents, dishes, entries, foods, portionUnits } from "@arven/db";
import { eq, inArray } from "drizzle-orm";

/**
 * Empty the log before a test that asserts on the state of a day.
 *
 * These tests share one database and one "today", so without this they see each
 * other's food — and an assertion like "the total shows no band" can only be
 * true if nothing else logged an estimate first.
 *
 * Safe because the suite only ever runs against a database it is allowed to
 * write to, and global teardown removes whatever it leaves behind.
 */
export async function clearTheDay(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  await createDb(url).delete(entries);
}

/**
 * Remove foods the suite created. Only ever touches `personal` rows, so the
 * seeded Ministry and USDA data is never at risk.
 */
export async function clearPersonalFoods(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const db = createDb(url);

  const mine = await db
    .select({ id: foods.id })
    .from(foods)
    .where(eq(foods.source, "personal"));
  if (mine.length === 0) return;

  await db.delete(portionUnits).where(inArray(portionUnits.foodId, mine.map((f) => f.id)));
  await db.delete(foods).where(eq(foods.source, "personal"));
}

/** Remove dishes the suite created. Components cascade. */
export async function clearDishes(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const db = createDb(url);
  await db.delete(dishComponents);
  await db.delete(dishes);
}
