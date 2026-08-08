import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Small key/value table for facts about the deployment itself — never product data.
 *
 * It exists in the walking skeleton to prove the whole path end to end: a migration
 * ran, a row is there, and the app can read it through Drizzle over the Neon driver.
 * It stays useful afterwards, recording which food-data import a database is carrying.
 */
export const meta = pgTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Meta = typeof meta.$inferSelect;
