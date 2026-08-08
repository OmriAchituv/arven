import { and, asc, eq, like, or, sql } from "drizzle-orm";

import type { Db, FoodSource } from "@arven/db";
import { foods, portionUnits } from "@arven/db";

export interface PortionUnitSummary {
  name: string;
  grams: number;
}

export interface FoodSearchResult {
  id: string;
  name: string;
  nameEn: string | null;
  source: FoodSource;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  units: PortionUnitSummary[];
}

/**
 * How the three tiers rank against each other. Your own foods first, because
 * after a few weeks they are what you actually eat; then the Israeli Ministry
 * of Health; then USDA as a fallback for what the Israeli set does not carry.
 *
 * A named rule rather than an ORDER BY buried in a query — v2's ranking lived
 * in four places and disagreed with itself.
 */
const SOURCE_RANK: Record<FoodSource, number> = {
  personal: 0,
  moh: 1,
  off: 2,
  usda: 3,
};

/**
 * Within a tier, a name that starts with what was typed beats one that merely
 * contains it: typing `פיתה` should offer pita before "salad with pita".
 */
function matchRank(searchName: unknown, firstTerm: string) {
  return sql<number>`case
    when ${searchName} = ${firstTerm} then 0
    when ${searchName} like ${firstTerm + " %"} then 1
    when ${searchName} like ${"% " + firstTerm + " %"} then 2
    else 3
  end`;
}

/**
 * Find foods matching a query that has already been normalised.
 *
 * Every term must appear, in any order — `קוטג תנובה` finds
 * `גבינת קוטג' 5% שומן, תנובה`. Normalisation is the caller's job so that this
 * function has no opinion about Hebrew; the domain package owns that.
 */
export async function searchFoods(
  db: Db,
  terms: string[],
  limit = 20,
): Promise<FoodSearchResult[]> {
  if (terms.length === 0) return [];

  const everyTermPresent = and(
    ...terms.map((term) =>
      or(
        like(foods.searchName, `%${term}%`),
        like(sql`lower(${foods.nameEn})`, `%${term}%`),
      ),
    ),
  );

  const sourceRank = sql<number>`case ${foods.source}
    when 'personal' then ${SOURCE_RANK.personal}
    when 'moh' then ${SOURCE_RANK.moh}
    when 'off' then ${SOURCE_RANK.off}
    else ${SOURCE_RANK.usda}
  end`;

  const rows = await db
    .select({
      id: foods.id,
      name: foods.name,
      nameEn: foods.nameEn,
      source: foods.source,
      kcalPer100g: foods.kcalPer100g,
      proteinPer100g: foods.proteinPer100g,
      carbsPer100g: foods.carbsPer100g,
      fatPer100g: foods.fatPer100g,
    })
    .from(foods)
    .where(everyTermPresent)
    .orderBy(
      sourceRank,
      matchRank(foods.searchName, terms[0]!),
      // Shorter names are more likely to be the plain thing rather than a
      // composed dish that happens to mention it.
      sql`length(${foods.name})`,
      asc(foods.name),
    )
    .limit(limit);

  if (rows.length === 0) return [];

  const units = await db
    .select({
      foodId: portionUnits.foodId,
      name: portionUnits.name,
      grams: portionUnits.grams,
    })
    .from(portionUnits)
    .where(sql`${portionUnits.foodId} in ${rows.map((row) => row.id)}`)
    .orderBy(asc(portionUnits.rank));

  const unitsByFood = new Map<string, PortionUnitSummary[]>();
  for (const unit of units) {
    const list = unitsByFood.get(unit.foodId) ?? [];
    list.push({ name: unit.name, grams: unit.grams });
    unitsByFood.set(unit.foodId, list);
  }

  return rows.map((row) => ({ ...row, units: unitsByFood.get(row.id) ?? [] }));
}

/** One food with its measures, for the moment someone chooses a portion. */
export async function getFood(db: Db, id: string): Promise<FoodSearchResult | null> {
  const [row] = await db.select().from(foods).where(eq(foods.id, id)).limit(1);
  if (!row) return null;

  const units = await db
    .select({ name: portionUnits.name, grams: portionUnits.grams })
    .from(portionUnits)
    .where(eq(portionUnits.foodId, id))
    .orderBy(asc(portionUnits.rank));

  return {
    id: row.id,
    name: row.name,
    nameEn: row.nameEn,
    source: row.source,
    kcalPer100g: row.kcalPer100g,
    proteinPer100g: row.proteinPer100g,
    carbsPer100g: row.carbsPer100g,
    fatPer100g: row.fatPer100g,
    units,
  };
}
