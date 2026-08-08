import { createDb, getSchemaVersion } from "@arven/db";

import { env } from "~/lib/env";
import { publicProcedure, router } from "../trpc";

/**
 * The skeleton's proof of life: read a row that a migration wrote.
 *
 * This exercises the whole path in one call — Neon connection, Drizzle query,
 * tRPC transport, and rendering in the browser. When slice #2 adds real
 * procedures, this one stays as the cheapest possible check that a deployment
 * can reach its database.
 */
export const systemRouter = router({
  status: publicProcedure.query(async () => {
    const db = createDb(env.databaseUrl);

    return {
      schemaVersion: await getSchemaVersion(db),
      checkedAt: new Date().toISOString(),
    };
  }),
});
