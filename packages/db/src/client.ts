import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

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
