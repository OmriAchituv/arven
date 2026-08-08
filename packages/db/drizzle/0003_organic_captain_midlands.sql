DROP INDEX "foods_name_idx";--> statement-breakpoint
--
-- Added with a default because the table already holds thousands of rows and a
-- plain NOT NULL would fail. The real values are written by the import, which
-- runs them through the same normaliser the query uses — the two must agree
-- exactly, so this is deliberately not backfilled with an approximation in SQL.
--
-- `pnpm --filter @arven/nutrition verify` fails if any row is left empty.
--
ALTER TABLE "foods" ADD COLUMN "search_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "foods_search_name_idx" ON "foods" USING btree ("search_name");
