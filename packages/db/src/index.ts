import { eq } from "drizzle-orm";

import type { Db } from "./client";
import { meta } from "./schema";

export * from "./schema";
export * from "./client";

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
