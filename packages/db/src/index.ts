import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";
import { meta } from "./schema";

export * from "./schema";

/**
 * Neon scales compute to zero after five idle minutes, so the first query of the
 * morning pays a wake-up cost. That is a deliberate trade for a free tier that
 * never pauses a project outright — see docs/PRD.md §6. The UI absorbs it while
 * the shell paints rather than showing a spinner.
 */
export function createDb(connectionString: string) {
  return drizzle(neon(connectionString), { schema });
}

export type Db = ReturnType<typeof createDb>;

/**
 * Queries live here rather than in the web app, so no route handler ever writes
 * SQL and `drizzle-orm` never becomes a dependency of the interface layer.
 */
export async function getSchemaVersion(db: Db): Promise<string | null> {
  const [row] = await db
    .select()
    .from(meta)
    .where(eq(meta.key, "schema_version"))
    .limit(1);

  return row?.value ?? null;
}
