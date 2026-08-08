import { describe, expect, it } from "vitest";

import { assembleDay } from "./logged-day";
import type { EntryInput } from "./logged-day";
import { isEstimated, isGrounded } from "./provenance";

/** Real values from the Ministry of Health data. */
const cottage = { per100g: { kcal: 95, protein: 11, carbs: 3.6, fat: 5 } };
const pita = { per100g: { kcal: 227, protein: 8.2, carbs: 45.5, fat: 1.2 } };
const almonds = { per100g: { kcal: 600, protein: 21, carbs: 20, fat: 51 } };

function at(hhmm: string): Date {
  return new Date(`2026-08-08T${hhmm}:00+03:00`);
}

const weighedCottage: EntryInput = {
  id: "1",
  kind: "food" as const,
  foodId: "moh:495",
  foodName: "גבינת קוטג' 5% שומן, תנובה",
  food: cottage,
  portion: { kind: "grams", grams: 200 },
  eatenAt: at("08:20"),
};

const onePita: EntryInput = {
  id: "2",
  kind: "food" as const,
  foodId: "moh:100",
  foodName: "פיתה",
  food: pita,
  portion: { kind: "measure", unit: "יחידה", gramsPerUnit: 100, count: 1 },
  eatenAt: at("08:25"),
};

const handfulOfAlmonds: EntryInput = {
  id: "3",
  kind: "food" as const,
  foodId: "moh:700",
  foodName: "שקדים",
  food: almonds,
  portion: { kind: "estimate", label: "חופן", assumedGrams: 20, uncertainty: 0.25 },
  eatenAt: at("10:10"),
};

describe("assembling a day", () => {
  it("is empty and grounded when nothing was eaten", () => {
    const day = assembleDay("2026-08-08", []);
    expect(day.entries).toEqual([]);
    expect(day.total.kcal).toBe(0);
    expect(day.band).toBe(0);
    expect(isGrounded(day.provenance)).toBe(true);
  });

  it("totals what was eaten", () => {
    const day = assembleDay("2026-08-08", [weighedCottage, onePita]);
    expect(day.total.kcal).toBeCloseTo(190 + 227);
    expect(day.total.protein).toBeCloseTo(22 + 8.2);
  });

  it("orders entries by when they were eaten, not how they arrived", () => {
    const day = assembleDay("2026-08-08", [handfulOfAlmonds, onePita, weighedCottage]);
    expect(day.entries.map((entry) => entry.id)).toEqual(["1", "2", "3"]);
  });

  it("shows no band when everything was weighed or measured", () => {
    // "1,740 ± 0" is a stranger claim than "1,740".
    const day = assembleDay("2026-08-08", [weighedCottage, onePita]);
    expect(day.band).toBe(0);
    expect(isGrounded(day.provenance)).toBe(true);
  });

  it("shows a band as soon as anything was estimated", () => {
    const day = assembleDay("2026-08-08", [weighedCottage, onePita, handfulOfAlmonds]);
    expect(isEstimated(day.provenance)).toBe(true);
    // Only the almonds are at risk: 20 g of 600 kcal/100g is 120 kcal, a
    // quarter of which is 30.
    expect(day.band).toBeCloseTo(30);
  });

  it("puts only the guessed calories at risk, not the whole day", () => {
    // The mistake worth avoiding: applying the combined uncertainty to the
    // day's total, which would cast doubt over food that was weighed.
    const day = assembleDay("2026-08-08", [weighedCottage, onePita, handfulOfAlmonds]);
    expect(day.total.kcal).toBeCloseTo(190 + 227 + 120);
    expect(day.band).toBeLessThan(day.total.kcal * 0.1);
  });

  it("widens the band when the guess is the main course", () => {
    const guessedMain: EntryInput = {
      ...handfulOfAlmonds,
      id: "4",
      portion: { kind: "estimate", label: "מנה גדולה", assumedGrams: 300, uncertainty: 0.25 },
    };
    const small = assembleDay("2026-08-08", [weighedCottage, handfulOfAlmonds]);
    const large = assembleDay("2026-08-08", [weighedCottage, guessedMain]);
    expect(large.band).toBeGreaterThan(small.band * 10);
  });

  it("keeps each entry's own provenance for its row", () => {
    const day = assembleDay("2026-08-08", [weighedCottage, handfulOfAlmonds]);
    expect(isGrounded(day.entries[0]!.nourishment.provenance)).toBe(true);
    expect(isEstimated(day.entries[1]!.nourishment.provenance)).toBe(true);
  });

  it("labels a portion the way it will be shown", () => {
    const day = assembleDay("2026-08-08", [weighedCottage, onePita, handfulOfAlmonds]);
    expect(day.entries.map((entry) => entry.nourishment.portionLabel)).toEqual([
      "200 ג׳",
      "יחידה",
      "חופן",
    ]);
  });
});
