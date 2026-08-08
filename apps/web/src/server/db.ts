import { createDb } from "@arven/db";
import type { Db } from "@arven/db";

import { env } from "~/lib/env";

let instance: Db | undefined;

/**
 * One client per lambda instance. The Neon HTTP driver is stateless, so this is
 * only about not rebuilding the Drizzle wrapper on every request.
 */
export function db(): Db {
  instance ??= createDb(env.databaseUrl);
  return instance;
}
