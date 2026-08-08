import type { Db } from "@arven/db";

import type { DayKey } from "../domain/day";
import { dayKeyOf } from "../domain/day";
import { searchTerms } from "../domain/hebrew";
import type { LoggedDay } from "../domain/logged-day";
import { assembleDay } from "../domain/logged-day";
import type { Portion } from "../domain/portion";
import { entriesForDay, logEntry, weighEntry } from "../infra/entries";
import type { FoodSearchResult } from "../infra/foods";
import { searchFoods } from "../infra/foods";

/**
 * Use cases. Each is one thing a person does, named the way they would say it.
 *
 * These are what the tRPC routers call. Routers stay thin — validate, delegate,
 * return — so no business rule ever ends up living in an HTTP handler.
 */

/** Find a food to log. Normalisation is applied here, once, for every caller. */
export async function findFood(
  db: Db,
  query: string,
  limit?: number,
): Promise<FoodSearchResult[]> {
  return searchFoods(db, searchTerms(query), limit);
}

/** What was eaten on a given day, totalled honestly. */
export async function dayOfEating(db: Db, day: DayKey): Promise<LoggedDay> {
  return assembleDay(day, await entriesForDay(db, day));
}

export interface RecordEating {
  id: string;
  foodId: string;
  portion: Portion;
  eatenAt: Date;
}

/**
 * Record something eaten, and return the day it landed on.
 *
 * The day comes back because 01:30 belongs to the previous one, and the
 * interface has to be able to say so rather than appearing to lose the entry.
 */
export async function recordEating(db: Db, command: RecordEating): Promise<DayKey> {
  await logEntry(db, command);
  return dayKeyOf(command.eatenAt);
}

/**
 * Turn an estimate into a measurement.
 *
 * Offered wherever an estimate is shown and never demanded — brief §21, honesty
 * has to feel rewarded, or the log stops reflecting what was actually eaten.
 */
export async function weighIt(db: Db, entryId: string, grams: number): Promise<void> {
  if (grams <= 0) throw new RangeError(`a portion must weigh something, got ${grams}`);
  await weighEntry(db, entryId, grams);
}
