import { describe, expect, it } from "vitest";

import { dishFromEntries, nourishmentOfDish, yieldOf } from "./dish";
import type { DishDefinition } from "./dish";
import { isEstimated, isGrounded } from "./provenance";

const whey = { per100g: { kcal: 387, protein: 80, carbs: 8, fat: 4 } };
const banana = { per100g: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 } };
const milk = { per100g: { kcal: 60, protein: 3.4, carbs: 4.8, fat: 3 } };

const shake: DishDefinition = {
  id: "dish:1",
  name: "שייק אחרי אימון",
  components: [
    {
      foodId: "f1",
      foodName: "אבקת חלבון",
      food: whey,
      portion: { kind: "grams", grams: 30 },
    },
    {
      foodId: "f2",
      foodName: "בננה",
      food: banana,
      portion: { kind: "grams", grams: 120 },
    },
    {
      foodId: "f3",
      foodName: "חלב 3%",
      food: milk,
      portion: { kind: "grams", grams: 250 },
    },
  ],
};

describe("what a dish amounts to", () => {
  it("sums its components", () => {
    const result = nourishmentOfDish(shake);
    expect(result.nutrients.kcal).toBeCloseTo(387 * 0.3 + 89 * 1.2 + 60 * 2.5);
    expect(result.grams).toBe(400);
  });

  it("keeps each component visible", () => {
    const result = nourishmentOfDish(shake);
    expect(result.parts.map((part) => part.foodName)).toEqual([
      "אבקת חלבון",
      "בננה",
      "חלב 3%",
    ]);
  });

  it("names itself", () => {
    expect(nourishmentOfDish(shake).portionLabel).toBe("שייק אחרי אימון");
  });
});

describe("scaling", () => {
  it("halves every component exactly", () => {
    // The point of storing components: half a dish is half of each thing in it,
    // not half of a number someone wrote down once.
    const whole = nourishmentOfDish(shake);
    const half = nourishmentOfDish(shake, { kind: "scale", scale: 0.5 });

    expect(half.nutrients.kcal).toBeCloseTo(whole.nutrients.kcal / 2);
    expect(half.nutrients.protein).toBeCloseTo(whole.nutrients.protein / 2);
    expect(half.grams).toBe(whole.grams / 2);

    for (const [index, part] of half.parts.entries()) {
      expect(part.nourishment.grams).toBeCloseTo(whole.parts[index]!.nourishment.grams / 2);
    }
  });

  it("says a half the way a person would", () => {
    expect(nourishmentOfDish(shake, { kind: "scale", scale: 0.5 }).portionLabel).toBe("שייק אחרי אימון × ½");
    expect(nourishmentOfDish(shake, { kind: "scale", scale: 0.25 }).portionLabel).toBe("שייק אחרי אימון × ¼");
    expect(nourishmentOfDish(shake, { kind: "scale", scale: 2 }).portionLabel).toBe("שייק אחרי אימון × 2");
  });

  it("refuses a scale of nothing", () => {
    expect(() => nourishmentOfDish(shake, { kind: "scale", scale: 0 })).toThrow(RangeError);
    expect(() => nourishmentOfDish(shake, { kind: "scale", scale: -1 })).toThrow(RangeError);
  });
});

describe("provenance of a dish", () => {
  it("is grounded when every component is", () => {
    expect(isGrounded(nourishmentOfDish(shake).provenance)).toBe(true);
  });

  it("becomes an estimate if a single component was guessed", () => {
    const withGuess: DishDefinition = {
      ...shake,
      components: [
        ...shake.components,
        {
          foodId: "f4",
          foodName: "דבש",
          food: { per100g: { kcal: 304, protein: 0.3, carbs: 82, fat: 0 } },
          portion: { kind: "estimate", label: "בערך כפית", assumedGrams: 12, uncertainty: 0.25 },
        },
      ],
    };

    expect(isEstimated(nourishmentOfDish(withGuess).provenance)).toBe(true);
  });

  it("keeps a guessed teaspoon from dominating a large dish", () => {
    const withGuess: DishDefinition = {
      ...shake,
      components: [
        ...shake.components,
        {
          foodId: "f4",
          foodName: "דבש",
          food: { per100g: { kcal: 304, protein: 0.3, carbs: 82, fat: 0 } },
          portion: { kind: "estimate", label: "בערך כפית", assumedGrams: 12, uncertainty: 0.25 },
        },
      ],
    };

    // 12 g of guess against 400 g of measurement.
    expect(nourishmentOfDish(withGuess).provenance.uncertainty).toBeLessThan(0.01);
  });

  it("scales without changing how sure we are", () => {
    // Halving a dish does not make it better or worse known.
    expect(nourishmentOfDish(shake, { kind: "scale", scale: 0.5 }).provenance.uncertainty).toBe(
      nourishmentOfDish(shake).provenance.uncertainty,
    );
  });
});

describe("building one from a day", () => {
  it("takes the entries as they were logged", () => {
    const built = dishFromEntries("הבוקר שלי", [
      { foodId: "f1", foodName: "קוטג׳", food: milk, portion: { kind: "grams", grams: 200 } },
      {
        foodId: "f2",
        foodName: "פיתה",
        food: banana,
        portion: { kind: "measure", unit: "יחידה", gramsPerUnit: 100, count: 1 },
      },
    ]);

    expect(built.name).toBe("הבוקר שלי");
    expect(built.components).toHaveLength(2);
    expect(built.components[1]!.portion).toEqual({
      kind: "measure",
      unit: "יחידה",
      gramsPerUnit: 100,
      count: 1,
    });
  });
});

describe("what the dish yields", () => {
  it("assumes the raw sum when nobody weighed it", () => {
    const y = yieldOf(shake);
    expect(y.grams).toBe(400);
    expect(y.measured).toBe(false);
  });

  it("uses the weighed figure when there is one", () => {
    const y = yieldOf({ ...shake, yieldGrams: 380 });
    expect(y.grams).toBe(380);
    expect(y.measured).toBe(true);
  });
});

describe("eating part of a pot", () => {
  // 500 g raw rice at 365 kcal/100g, cooked down to a 1,400 g pot.
  const pot = {
    id: "dish:2",
    name: "אורז",
    yieldGrams: 1400,
    components: [
      {
        foodId: "rice",
        foodName: "אורז, לבן, לא מבושל",
        food: { per100g: { kcal: 365, protein: 7, carbs: 80, fat: 0.6 } },
        portion: { kind: "grams" as const, grams: 500 },
      },
    ],
  };

  it("divides the raw macros by the finished weight", () => {
    // The trap this exists to close: weighing 380 g of cooked rice against the
    // raw entry gives 1,387 kcal. Against the pot it gives about 495.
    const plate = nourishmentOfDish(pot, { kind: "grams", grams: 380 });
    expect(plate.nutrients.kcal).toBeCloseTo(365 * 5 * (380 / 1400), 1);
    expect(plate.nutrients.kcal).toBeLessThan(600);
  });

  it("stays grounded when the pot was weighed", () => {
    expect(isGrounded(nourishmentOfDish(pot, { kind: "grams", grams: 380 }).provenance)).toBe(true);
  });

  it("becomes an estimate when the pot was not weighed", () => {
    // Dividing by an assumed yield is a guess however well the components were
    // weighed, and a wide one — so weighing the pot is visibly worth doing.
    const unweighed = { ...pot, yieldGrams: null };
    const plate = nourishmentOfDish(unweighed, { kind: "grams", grams: 380 });
    expect(isEstimated(plate.provenance)).toBe(true);
    expect(plate.provenance.uncertainty).toBeGreaterThanOrEqual(0.3);
  });

  it("keeps a fraction exact even without a weighed yield", () => {
    // Half of it is half of it whatever the pot weighs.
    const unweighed = { ...pot, yieldGrams: null };
    expect(isGrounded(nourishmentOfDish(unweighed, { kind: "scale", scale: 0.5 }).provenance)).toBe(true);
  });

  it("says the weight back", () => {
    expect(nourishmentOfDish(pot, { kind: "grams", grams: 380 }).portionLabel).toBe("אורז · 380 ג׳");
  });
});
