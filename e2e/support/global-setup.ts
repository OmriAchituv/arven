/**
 * The end-to-end suite logs real food into the real database, because a test
 * against a stubbed one proves nothing about whether logging works.
 *
 * So it puts back what it took: this stamps the moment the run began, and
 * teardown removes every entry created since. Anything a person logged before
 * the run is older than the stamp and is never touched.
 *
 * A stopgap. The right answer is a Neon branch per CI run — branches are
 * instant and carry the seeded food data — filed as follow-up work.
 */
export const STARTED_AT = "ARVEN_E2E_STARTED_AT";

export default async function globalSetup() {
  process.env[STARTED_AT] = new Date().toISOString();
}
