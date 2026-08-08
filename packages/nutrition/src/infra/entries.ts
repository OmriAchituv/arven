import { and, asc, eq, gte, lt } from "drizzle-orm";

import type { Db, Entry, NewEntry } from "@arven/db";
import { entries, foods } from "@arven/db";

import type { DayKey } from "../domain/day";
import { endOf, startOf } from "../domain/day";
import type { EntryInput } from "../domain/logged-day";
import type { Portion } from "../domain/portion";

/**
 * The Portion union, crossing to and from its columns.
 *
 * Kept as a pair of functions in one file so the two directions are read
 * together — a mapping that disagrees with itself is the kind of bug that only
 * shows up as a wrong number weeks later.
 */
function portionToColumns(portion: Portion) {
  switch (portion.kind) {
    case "grams":
      return { portionKind: "grams" as const, grams: portion.grams };
    case "measure":
      return {
        portionKind: "measure" as const,
        unitName: portion.unit,
        unitGrams: portion.gramsPerUnit,
        unitCount: portion.count,
      };
    case "estimate":
      return {
        portionKind: "estimate" as const,
        estimateLabel: portion.label,
        estimateGrams: portion.assumedGrams,
        estimateUncertainty: portion.uncertainty ?? null,
      };
  }
}

function portionFromColumns(row: Entry): Portion {
  switch (row.portionKind) {
    case "grams":
      return { kind: "grams", grams: row.grams ?? 0 };
    case "measure":
      return {
        kind: "measure",
        unit: row.unitName ?? "",
        gramsPerUnit: row.unitGrams ?? 0,
        count: row.unitCount ?? 1,
      };
    case "estimate":
      return {
        kind: "estimate",
        label: row.estimateLabel ?? "",
        assumedGrams: row.estimateGrams ?? 0,
        ...(row.estimateUncertainty === null
          ? {}
          : { uncertainty: row.estimateUncertainty }),
      };
  }
}

export interface LogEntryCommand {
  id: string;
  foodId: string;
  portion: Portion;
  eatenAt: Date;
}

export async function logEntry(db: Db, command: LogEntryCommand): Promise<void> {
  const row: NewEntry = {
    id: command.id,
    foodId: command.foodId,
    eatenAt: command.eatenAt,
    ...portionToColumns(command.portion),
  };
  await db.insert(entries).values(row);
}

/**
 * Replace an entry's portion with a weight — the `○` to `●` upgrade.
 *
 * Every column belonging to the other two variants is cleared, so a row can
 * never carry the remains of a portion it no longer is.
 */
export async function weighEntry(db: Db, id: string, grams: number): Promise<void> {
  await db
    .update(entries)
    .set({
      portionKind: "grams",
      grams,
      unitName: null,
      unitGrams: null,
      unitCount: null,
      estimateLabel: null,
      estimateGrams: null,
      estimateUncertainty: null,
    })
    .where(eq(entries.id, id));
}

export async function deleteEntry(db: Db, id: string): Promise<void> {
  await db.delete(entries).where(eq(entries.id, id));
}

/**
 * Everything eaten in one Day, with the food each entry refers to.
 *
 * The boundary is applied as an instant range computed in the domain, rather
 * than as date arithmetic in SQL. Postgres would need the zone and the 04:00
 * rule expressed a second time, and two implementations of the same rule
 * eventually disagree — usually on a daylight-saving weekend.
 */
export async function entriesForDay(db: Db, day: DayKey): Promise<EntryInput[]> {
  const rows = await db
    .select({ entry: entries, food: foods })
    .from(entries)
    .innerJoin(foods, eq(entries.foodId, foods.id))
    .where(and(gte(entries.eatenAt, startOf(day)), lt(entries.eatenAt, endOf(day))))
    .orderBy(asc(entries.eatenAt));

  return rows.map(({ entry, food }) => ({
    id: entry.id,
    foodId: food.id,
    foodName: food.name,
    food: {
      per100g: {
        kcal: food.kcalPer100g,
        protein: food.proteinPer100g,
        carbs: food.carbsPer100g,
        fat: food.fatPer100g,
      },
    },
    portion: portionFromColumns(entry),
    eatenAt: entry.eatenAt,
  }));
}
