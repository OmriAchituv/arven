import type { FoodValues, Nourishment, Nutrients } from "./nutrients";
import { nourishmentOf, sum, times } from "./nutrients";
import type { Portion } from "./portion";
import type { Provenance } from "./provenance";
import { combine } from "./provenance";

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
  scale = 1,
): DishNourishment {
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
  const provenance: Provenance = combine(
    parts.map((part) => ({
      provenance: part.nourishment.provenance,
      weight: part.nourishment.grams,
    })),
  );

  return {
    nutrients,
    grams,
    provenance,
    portionLabel: scale === 1 ? dish.name : `${dish.name} × ${formatScale(scale)}`,
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
