import { and, asc, eq, sql } from "drizzle-orm";

import type { Db } from "@arven/db";
import { entries, foods, portionUnits } from "@arven/db";

import { normalizeHebrew } from "../domain/hebrew";
import type { FoodSearchResult } from "./foods";

export interface PersonalFoodDraft {
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  /** Household measures you define yourself: `גביע` at 250 g. */
  units: Array<{ name: string; grams: number }>;
}

/** Personal foods are identified by their own id; they have no source to point at. */
function personalId(id: string): string {
  return `personal:${id}`;
}

/**
 * Create a food from a packet.
 *
 * Values read off a label are facts about the product, so they are grounded —
 * `●`, source `personal`. The uncertainty in a portion of it comes from how it
 * was served, not from where the numbers came from.
 */
export async function createPersonalFood(
  db: Db,
  id: string,
  draft: PersonalFoodDraft,
): Promise<string> {
  const foodId = personalId(id);

  await db.insert(foods).values({
    id: foodId,
    source: "personal",
    sourceId: null,
    name: draft.name,
    nameEn: null,
    searchName: normalizeHebrew(draft.name),
    kcalPer100g: draft.kcalPer100g,
    proteinPer100g: draft.proteinPer100g,
    carbsPer100g: draft.carbsPer100g,
    fatPer100g: draft.fatPer100g,
  });

  await writeUnits(db, foodId, draft.units);
  return foodId;
}

/**
 * Change what a food is.
 *
 * Entries hold a reference to the food rather than a copy of its values, so
 * correcting a mistyped label corrects every day it appears on. That is the
 * intent: a Food is an identity, and fixing it should fix the record.
 *
 * The corollary is that turning one product into a different one is not an
 * edit — it is a new Food. The interface says so at the point of editing.
 */
export async function updatePersonalFood(
  db: Db,
  foodId: string,
  draft: PersonalFoodDraft,
): Promise<void> {
  await db
    .update(foods)
    .set({
      name: draft.name,
      searchName: normalizeHebrew(draft.name),
      kcalPer100g: draft.kcalPer100g,
      proteinPer100g: draft.proteinPer100g,
      carbsPer100g: draft.carbsPer100g,
      fatPer100g: draft.fatPer100g,
      updatedAt: new Date(),
    })
    .where(and(eq(foods.id, foodId), eq(foods.source, "personal")));

  await db.delete(portionUnits).where(eq(portionUnits.foodId, foodId));
  await writeUnits(db, foodId, draft.units);
}

async function writeUnits(
  db: Db,
  foodId: string,
  units: Array<{ name: string; grams: number }>,
) {
  const rows = units
    .filter((unit) => unit.name.trim().length > 0 && unit.grams > 0)
    .map((unit, index) => ({
      id: `${foodId}:${normalizeHebrew(unit.name)}`,
      foodId,
      name: unit.name.trim(),
      grams: unit.grams,
      rank: index,
    }));

  if (rows.length > 0) await db.insert(portionUnits).values(rows).onConflictDoNothing();
}

/** How many days already refer to this food. */
export async function timesLogged(db: Db, foodId: string): Promise<number> {
  const { rows } = await db.execute<{ n: number }>(
    sql`select count(*)::int as n from ${entries} where ${entries.foodId} = ${foodId}`,
  );
  return rows[0]?.n ?? 0;
}

/**
 * Remove a food you created.
 *
 * Refused while anything still refers to it. Deleting would either orphan those
 * entries or take them with it, and silently rewriting what someone ate is far
 * worse than being told no.
 */
export async function deletePersonalFood(db: Db, foodId: string): Promise<void> {
  const logged = await timesLogged(db, foodId);
  if (logged > 0) {
    throw new Error(`in use: this food appears in ${logged} entries`);
  }

  await db.delete(portionUnits).where(eq(portionUnits.foodId, foodId));
  await db.delete(foods).where(and(eq(foods.id, foodId), eq(foods.source, "personal")));
}

/** Everything you have created, newest first. */
export async function listPersonalFoods(db: Db): Promise<FoodSearchResult[]> {
  const rows = await db
    .select()
    .from(foods)
    .where(eq(foods.source, "personal"))
    .orderBy(asc(foods.name));

  if (rows.length === 0) return [];

  const units = await db
    .select({ foodId: portionUnits.foodId, name: portionUnits.name, grams: portionUnits.grams })
    .from(portionUnits)
    .where(sql`${portionUnits.foodId} in ${rows.map((row) => row.id)}`)
    .orderBy(asc(portionUnits.rank));

  const byFood = new Map<string, Array<{ name: string; grams: number }>>();
  for (const unit of units) {
    const list = byFood.get(unit.foodId) ?? [];
    list.push({ name: unit.name, grams: unit.grams });
    byFood.set(unit.foodId, list);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    nameEn: row.nameEn,
    source: row.source,
    kcalPer100g: row.kcalPer100g,
    proteinPer100g: row.proteinPer100g,
    carbsPer100g: row.carbsPer100g,
    fatPer100g: row.fatPer100g,
    units: byFood.get(row.id) ?? [],
  }));
}
