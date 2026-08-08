import type { Portion } from "./portion.ts";
import { resolvePortion } from "./portion.ts";
import type { Provenance } from "./provenance.ts";

/**
 * What a Food carries per 100 g. The four ARVEN reports, and nothing else —
 * the source has 74 nutrients, and none of them are shown yet.
 */
export interface Nutrients {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const ZERO: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

/** The part of a Food this context needs. Anything more is the database's business. */
export interface FoodValues {
  per100g: Nutrients;
}

export interface Nourishment {
  nutrients: Nutrients;
  grams: number;
  provenance: Provenance;
  portionLabel: string;
}

function scale(per100g: Nutrients, grams: number): Nutrients {
  const factor = grams / 100;
  return {
    kcal: per100g.kcal * factor,
    protein: per100g.protein * factor,
    carbs: per100g.carbs * factor,
    fat: per100g.fat * factor,
  };
}

export function add(a: Nutrients, b: Nutrients): Nutrients {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

export function sum(all: ReadonlyArray<Nutrients>): Nutrients {
  return all.reduce(add, ZERO);
}

export function times(nutrients: Nutrients, factor: number): Nutrients {
  return {
    kcal: nutrients.kcal * factor,
    protein: nutrients.protein * factor,
    carbs: nutrients.carbs * factor,
    fat: nutrients.fat * factor,
  };
}

/**
 * What eating this portion of this food amounts to.
 *
 * Note what does not happen here: nothing is rounded. Rounding is a presentation
 * decision, and rounding early makes a day's total drift from the sum of its
 * parts — which is precisely the kind of small dishonesty that erodes trust in
 * the number.
 */
export function nourishmentOf(food: FoodValues, portion: Portion): Nourishment {
  const resolved = resolvePortion(portion);

  return {
    nutrients: scale(food.per100g, resolved.grams),
    grams: resolved.grams,
    provenance: resolved.provenance,
    portionLabel: resolved.label,
  };
}
