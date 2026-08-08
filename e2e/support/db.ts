import { createDb, entries } from "@arven/db";

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
