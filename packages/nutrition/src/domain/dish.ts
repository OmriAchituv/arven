import type { FoodValues, Nourishment, Nutrients } from "./nutrients";
import { nourishmentOf, sum, times } from "./nutrients";
import type { Portion } from "./portion";
import { resolvePortion } from "./portion";
import type { Provenance } from "./provenance";
import { combine, estimated } from "./provenance";

/**
 * A Dish — מנה. A named composition you saved, computed fresh on every use.
 *
 * It holds components, never totals. That single decision is what makes `×½`
 * exact rather than arithmetic on an opaque figure, lets an ingredient be
 * swapped by editing rather than re-entering, and carries each component's
 * provenance into history — so a dish can never quietly become a frozen number
 * whose origin nobody can recover.
 */
export interface DishComponent {
  foodId: string;
  foodName: string;
  food: FoodValues;
  portion: Portion;
}

export interface DishDefinition {
  id: string;
  name: string;
  components: DishComponent[];
  /** What the finished thing weighs. Null when nobody weighed it. */
  yieldGrams?: number | null;
}

/**
 * How much of a dish was eaten, recorded the way it was said.
 *
 * A fraction stays a fraction if the recipe changes; a weight is what you get
 * from putting your plate on a scale. Both are honest records of different
 * statements, so neither is normalised into the other.
 */
export type DishPortion =
  | { kind: "scale"; scale: number }
  | { kind: "grams"; grams: number };

/**
 * Doubt introduced by dividing a dish by a yield nobody measured.
 *
 * Rice roughly triples when cooked; a roast loses water. Assuming the finished
 * weight equals the raw sum is a real assumption, and taking a portion by
 * weight against it is a guess — a wide one, so weighing the pot is visibly
 * worth doing.
 */
export const ASSUMED_YIELD_UNCERTAINTY = 0.3;

/** What the dish weighs, and whether anyone actually checked. */
export function yieldOf(dish: DishDefinition): { grams: number; measured: boolean } {
  if (dish.yieldGrams != null && dish.yieldGrams > 0) {
    return { grams: dish.yieldGrams, measured: true };
  }

  const raw = dish.components.reduce(
    (total, component) => total + resolvePortion(component.portion).grams,
    0,
  );
  return { grams: raw, measured: false };
}

export interface DishNourishment extends Nourishment {
  /** Each component at the scale it was eaten, for showing what went in. */
  parts: Array<{ foodId: string; foodName: string; nourishment: Nourishment }>;
}

/**
 * What eating this dish amounts to, at this scale.
 *
 * Scaling multiplies every component, so half a dish is exactly half of each
 * thing in it — not half of a number someone wrote down once.
 */
export function nourishmentOfDish(
  dish: DishDefinition,
  portion: DishPortion = { kind: "scale", scale: 1 },
): DishNourishment {
  const yielded = yieldOf(dish);

  // A weight becomes a fraction of the whole: 380 g of a 1,400 g pot. This is
  // what makes raw ingredients and a cooked plate reconcilable — the macros
  // come from what went in, the portion from what came out.
  const scale =
    portion.kind === "grams"
      ? portion.grams / Math.max(yielded.grams, 1)
      : portion.scale;

  if (scale <= 0) {
    throw new RangeError(`a dish must be eaten in some amount, got ${scale}`);
  }

  const parts = dish.components.map((component) => {
    const whole = nourishmentOf(component.food, component.portion);
    return {
      foodId: component.foodId,
      foodName: component.foodName,
      nourishment: {
        ...whole,
        nutrients: times(whole.nutrients, scale),
        grams: whole.grams * scale,
      },
    };
  });

  const nutrients: Nutrients = sum(parts.map((part) => part.nourishment.nutrients));
  const grams = parts.reduce((total, part) => total + part.nourishment.grams, 0);

  // One guessed component makes the whole dish a guess — you cannot average a
  // guess away — and the doubt is weighted by how much each part contributes.
  const fromComponents: Provenance = combine(
    parts.map((part) => ({
      provenance: part.nourishment.provenance,
      weight: part.nourishment.grams,
    })),
  );

  // Dividing by a yield nobody measured is itself a guess, however well the
  // components were weighed. Taking a fraction is not — half of it is half of
  // it whatever the pot weighs.
  const dividedByAssumption = portion.kind === "grams" && !yielded.measured;
  const provenance = dividedByAssumption
    ? estimated(Math.max(fromComponents.uncertainty, ASSUMED_YIELD_UNCERTAINTY))
    : fromComponents;

  return {
    nutrients,
    grams,
    provenance,
    portionLabel:
      portion.kind === "grams"
        ? `${dish.name} · ${Math.round(portion.grams)} ג׳`
        : scale === 1
          ? dish.name
          : `${dish.name} × ${formatScale(scale)}`,
    parts,
  };
}

/** `½` rather than `0.5` — it is how people say it. */
function formatScale(scale: number): string {
  const known: Record<string, string> = { "0.25": "¼", "0.5": "½", "0.75": "¾" };
  return known[String(scale)] ?? String(scale);
}

/**
 * Build a dish out of what is already on a day.
 *
 * The most common way one comes into existence: you logged breakfast, it is the
 * breakfast you always have, and now it has a name.
 */
export function dishFromEntries(
  name: string,
  entries: ReadonlyArray<{ foodId: string; foodName: string; food: FoodValues; portion: Portion }>,
): Omit<DishDefinition, "id"> {
  return {
    name,
    components: entries.map((entry) => ({
      foodId: entry.foodId,
      foodName: entry.foodName,
      food: entry.food,
      portion: entry.portion,
    })),
  };
}
