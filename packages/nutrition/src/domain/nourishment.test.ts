import { describe, expect, it } from "vitest";

import { nourishmentOf, sum, times } from "./nutrients.ts";
import type { FoodValues } from "./nutrients.ts";
import { resolvePortion, weigh } from "./portion.ts";
import { combine, estimated, isEstimated, isGrounded, measure, weighed } from "./provenance.ts";

/** גבינת קוטג' 5% שומן, תנובה — real values from the Ministry of Health data. */
const cottage: FoodValues = {
  per100g: { kcal: 95, protein: 11, carbs: 3.6, fat: 5 },
};

/** פיתה, אנג'ל — 227 kcal/100g, one unit weighing 100 g. */
const pita: FoodValues = {
  per100g: { kcal: 227, protein: 8.2, carbs: 45.5, fat: 1.2 },
};

describe("resolving a portion to grams", () => {
  it("takes a weighed amount at face value, grounded", () => {
    const resolved = resolvePortion({ kind: "grams", grams: 200 });
    expect(resolved.grams).toBe(200);
    expect(isGrounded(resolved.provenance)).toBe(true);
    expect(resolved.label).toBe("200 ג׳");
  });

  it("multiplies a household measure by its weight, grounded", () => {
    // This is the mechanism the whole low-friction promise rests on: a real
    // gram weight from a lookup, with no model involved.
    const resolved = resolvePortion({
      kind: "measure",
      unit: "גביע",
      gramsPerUnit: 250,
      count: 1,
    });
    expect(resolved.grams).toBe(250);
    expect(isGrounded(resolved.provenance)).toBe(true);
    expect(resolved.label).toBe("גביע");
  });

  it("counts multiple units and says so", () => {
    const resolved = resolvePortion({
      kind: "measure",
      unit: "פרוסה בינונית",
      gramsPerUnit: 34,
      count: 3,
    });
    expect(resolved.grams).toBe(102);
    expect(resolved.label).toBe("3 × פרוסה בינונית");
  });

  it("marks an unmeasured quantity as an estimate", () => {
    const resolved = resolvePortion({
      kind: "estimate",
      label: "חופן",
      assumedGrams: 20,
    });
    expect(resolved.grams).toBe(20);
    expect(isEstimated(resolved.provenance)).toBe(true);
    expect(resolved.provenance.uncertainty).toBeGreaterThan(0);
    expect(resolved.label).toBe("חופן");
  });

  it("refuses a portion that weighs nothing", () => {
    expect(() => resolvePortion({ kind: "grams", grams: 0 })).toThrow(RangeError);
    expect(() => resolvePortion({ kind: "grams", grams: -5 })).toThrow(RangeError);
  });
});

describe("what a portion amounts to", () => {
  it("scales per-100g values by weight", () => {
    const result = nourishmentOf(cottage, { kind: "grams", grams: 200 });
    expect(result.nutrients.kcal).toBeCloseTo(190);
    expect(result.nutrients.protein).toBeCloseTo(22);
    expect(result.nutrients.carbs).toBeCloseTo(7.2);
    expect(result.nutrients.fat).toBeCloseTo(10);
  });

  it("computes a household measure exactly", () => {
    const result = nourishmentOf(pita, {
      kind: "measure",
      unit: "יחידה",
      gramsPerUnit: 100,
      count: 1,
    });
    expect(result.nutrients.kcal).toBeCloseTo(227);
    expect(result.grams).toBe(100);
    expect(isGrounded(result.provenance)).toBe(true);
  });

  it("does not round, so a total never drifts from its parts", () => {
    // Rounding early is the small dishonesty that makes a day's total stop
    // matching the rows above it.
    const third = nourishmentOf(cottage, { kind: "grams", grams: 33.333 });
    const total = sum([third.nutrients, third.nutrients, third.nutrients]);
    expect(total.kcal).toBeCloseTo(nourishmentOf(cottage, { kind: "grams", grams: 99.999 }).nutrients.kcal, 10);
  });

  it("carries the portion's provenance through", () => {
    const guessed = nourishmentOf(cottage, {
      kind: "estimate",
      label: "בערך כף",
      assumedGrams: 40,
    });
    expect(isEstimated(guessed.provenance)).toBe(true);
  });

  it("scales cleanly for a half portion", () => {
    const full = nourishmentOf(pita, { kind: "grams", grams: 100 });
    const half = nourishmentOf(pita, { kind: "grams", grams: 50 });
    expect(half.nutrients.kcal).toBeCloseTo(times(full.nutrients, 0.5).kcal);
  });
});

describe("weighing an estimate", () => {
  it("turns a guess into a measurement", () => {
    const before = nourishmentOf(cottage, {
      kind: "estimate",
      label: "חופן",
      assumedGrams: 20,
    });
    const after = nourishmentOf(cottage, weigh(23));

    expect(isEstimated(before.provenance)).toBe(true);
    expect(isGrounded(after.provenance)).toBe(true);
    expect(after.nutrients.kcal).toBeCloseTo(21.85);
  });
});

describe("provenance of a whole made of parts", () => {
  it("stays grounded when every part is grounded", () => {
    const result = combine([
      { provenance: weighed, weight: 200 },
      { provenance: measure, weight: 100 },
    ]);
    expect(isGrounded(result)).toBe(true);
    expect(result.uncertainty).toBe(0);
  });

  it("becomes an estimate if any part was guessed", () => {
    // You cannot average away a guess. If one component was a guess, the sum is.
    const result = combine([
      { provenance: weighed, weight: 400 },
      { provenance: estimated(0.25), weight: 20 },
    ]);
    expect(isEstimated(result)).toBe(true);
  });

  it("weights doubt by how much each part contributes", () => {
    // A guessed teaspoon in a large meal barely widens the band; a guessed
    // main course widens it a lot.
    const smallGuess = combine([
      { provenance: weighed, weight: 480 },
      { provenance: estimated(0.5), weight: 20 },
    ]);
    const bigGuess = combine([
      { provenance: weighed, weight: 100 },
      { provenance: estimated(0.5), weight: 400 },
    ]);

    expect(smallGuess.uncertainty).toBeLessThan(bigGuess.uncertainty);
    expect(smallGuess.uncertainty).toBeCloseTo(0.02);
    expect(bigGuess.uncertainty).toBeCloseTo(0.4);
  });

  it("treats an empty whole as grounded", () => {
    expect(isGrounded(combine([]))).toBe(true);
  });
});
