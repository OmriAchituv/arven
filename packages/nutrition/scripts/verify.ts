/**
 * Asserts that a database actually carries food data.
 *
 * This exists because v2's food table was modelled correctly and never filled,
 * and nobody noticed until every number in the app turned out to be a guess.
 * "Seeded" has to mean a row count something can fail on, not a ticked box.
 *
 * Exits non-zero when the data is missing or thin, so CI can gate on it.
 */
import { sql } from "drizzle-orm";

import { createDb, foods, portionUnits } from "@arven/db";

const EXPECTED = {
  mohFoods: 4_000,
  portionUnits: 1_000,
};

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const db = createDb(connectionString);

  const [bySource, unitCount] = await Promise.all([
    db
      .select({ source: foods.source, count: sql<number>`count(*)::int` })
      .from(foods)
      .groupBy(foods.source),
    db.select({ count: sql<number>`count(*)::int` }).from(portionUnits),
  ]);

  const counts = Object.fromEntries(bySource.map((row) => [row.source, row.count]));
  const moh = counts.moh ?? 0;
  const units = unitCount[0]?.count ?? 0;

  console.log("\nfoods by source");
  for (const source of ["personal", "moh", "usda", "off"]) {
    console.log(`  ${source.padEnd(10)} ${(counts[source] ?? 0).toLocaleString()}`);
  }
  console.log(`\nportion units  ${units.toLocaleString()}`);

  // A food with no search name cannot be found, which makes it no better than
  // absent. The column carries a default so the migration could run over
  // existing rows; the import fills it in properly.
  const [unsearchable] = (
    await db.execute<{ n: number }>(sql`
      select count(*)::int as n from foods where search_name = '' or search_name is null
    `)
  ).rows;
  const empty = unsearchable?.n ?? 0;
  console.log(`unsearchable   ${empty.toLocaleString()}`);

  // How much of the table can actually answer "one of those, please".
  const [coverage] = (
    await db.execute<{ with_units: number }>(sql`
      select count(distinct food_id)::int as with_units from portion_units
    `)
  ).rows;
  const withUnits = coverage?.with_units ?? 0;

  // A handful of real lookups, so this fails on data that is present but wrong —
  // mojibake, a broken join, macros that never landed. A join rather than a
  // correlated subquery: the first version of this printed "no household
  // measures" for foods that had three, and still reported success.
  const { rows: samples } = await db.execute<{
    name: string;
    kcal: number;
    units: string | null;
  }>(sql`
    select f.name, f.kcal_per_100g as kcal,
           string_agg(pu.name || ' ' || pu.grams || 'g', ' · ' order by pu.rank) as units
    from foods f
    left join portion_units pu on pu.food_id = f.id
    where f.name like '%פיתה,%' or f.name like '%קוטג%' or f.name like '%חלה,%'
    group by f.id, f.name, f.kcal_per_100g
    having count(pu.id) > 0
    limit 4
  `);

  console.log(
    `foods with measures  ${withUnits.toLocaleString()} ` +
      `(${((withUnits / Math.max(moh, 1)) * 100).toFixed(0)}%)`,
  );

  console.log("\nsample lookups");
  for (const sample of samples) {
    console.log(`  ${sample.name}  —  ${sample.kcal} kcal/100g`);
    console.log(`    ${sample.units}`);
  }

  const failures: string[] = [];
  if (moh < EXPECTED.mohFoods) {
    failures.push(`expected at least ${EXPECTED.mohFoods} MoH foods, found ${moh}`);
  }
  if (units < EXPECTED.portionUnits) {
    failures.push(`expected at least ${EXPECTED.portionUnits} portion units, found ${units}`);
  }
  if (samples.length === 0) {
    // Catches both a broken join and mojibake: these are real Hebrew names that
    // are known to carry household measures.
    failures.push("no Hebrew food with household measures matched — check encoding and the join");
  }
  if (empty > 0) {
    // The column is added with a default so the migration can run over existing
    // rows; the import fills it. A row left empty is a food nobody can find.
    failures.push(`${empty} foods have no search name — re-run the import`);
  }
  if (withUnits < moh / 2) {
    failures.push(`only ${withUnits} of ${moh} foods carry a household measure`);
  }

  if (failures.length > 0) {
    console.error("\n✕ food data is not seeded");
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }

  console.log("\n✓ food data is seeded");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
