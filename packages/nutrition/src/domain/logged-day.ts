import type { DayKey } from "./day";
import type { FoodValues, Nourishment, Nutrients } from "./nutrients";
import { nourishmentOf, sum } from "./nutrients";
import type { Portion } from "./portion";
import type { Provenance } from "./provenance";
import { combine, isEstimated } from "./provenance";

/**
 * One act of eating, resolved. What the Today screen renders a row from.
 */
export interface LoggedEntry {
  id: string;
  foodId: string;
  foodName: string;
  eatenAt: Date;
  nourishment: Nourishment;
}

export interface LoggedDay {
  day: DayKey;
  entries: LoggedEntry[];
  total: Nutrients;
  provenance: Provenance;
  /**
   * How far the day's calories might plausibly sit either side of the total,
   * in kcal. Zero when nothing was estimated — and then the interface shows a
   * number with no band at all, rather than a band of zero, because "1,740 ± 0"
   * is a stranger claim than "1,740".
   */
  band: number;
}

export interface EntryInput {
  id: string;
  foodId: string;
  foodName: string;
  food: FoodValues;
  portion: Portion;
  eatenAt: Date;
}

/**
 * Assemble a day from what was eaten.
 *
 * Entries arrive in whatever order the database returned and leave in the order
 * they were eaten — the day reads as it happened, per the PRD's flat
 * chronological list. No grouping into meals: eating occasions are deliberately
 * not modelled.
 */
export function assembleDay(day: DayKey, inputs: ReadonlyArray<EntryInput>): LoggedDay {
  const entries: LoggedEntry[] = inputs
    .map((input) => ({
      id: input.id,
      foodId: input.foodId,
      foodName: input.foodName,
      eatenAt: input.eatenAt,
      nourishment: nourishmentOf(input.food, input.portion),
    }))
    .sort((a, b) => a.eatenAt.getTime() - b.eatenAt.getTime());

  const total = sum(entries.map((entry) => entry.nourishment.nutrients));

  // Doubt is weighted by grams, so a guessed teaspoon of honey in a large meal
  // barely widens the band while a guessed main course widens it a lot.
  const provenance = combine(
    entries.map((entry) => ({
      provenance: entry.nourishment.provenance,
      weight: entry.nourishment.grams,
    })),
  );

  // The band is the calories actually at risk — only the estimated entries
  // contribute, each by its own uncertainty. Applying the combined figure to
  // the whole day would inflate doubt over food that was weighed.
  const band = entries
    .filter((entry) => isEstimated(entry.nourishment.provenance))
    .reduce(
      (sum, entry) =>
        sum + entry.nourishment.nutrients.kcal * entry.nourishment.provenance.uncertainty,
      0,
    );

  return { day, entries, total, provenance, band };
}
