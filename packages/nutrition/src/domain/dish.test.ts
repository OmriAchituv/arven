import { describe, expect, it } from "vitest";

import { dishFromEntries, nourishmentOfDish } from "./dish";
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
    const half = nourishmentOfDish(shake, 0.5);

    expect(half.nutrients.kcal).toBeCloseTo(whole.nutrients.kcal / 2);
    expect(half.nutrients.protein).toBeCloseTo(whole.nutrients.protein / 2);
    expect(half.grams).toBe(whole.grams / 2);

    for (const [index, part] of half.parts.entries()) {
      expect(part.nourishment.grams).toBeCloseTo(whole.parts[index]!.nourishment.grams / 2);
    }
  });

  it("says a half the way a person would", () => {
    expect(nourishmentOfDish(shake, 0.5).portionLabel).toBe("שייק אחרי אימון × ½");
    expect(nourishmentOfDish(shake, 0.25).portionLabel).toBe("שייק אחרי אימון × ¼");
    expect(nourishmentOfDish(shake, 2).portionLabel).toBe("שייק אחרי אימון × 2");
  });

  it("refuses a scale of nothing", () => {
    expect(() => nourishmentOfDish(shake, 0)).toThrow(RangeError);
    expect(() => nourishmentOfDish(shake, -1)).toThrow(RangeError);
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
    expect(nourishmentOfDish(shake, 0.5).provenance.uncertainty).toBe(
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
