import { and, asc, eq, gte, lt } from "drizzle-orm";

import type { Db, Entry, NewEntry } from "@arven/db";
import { dishes, entries, foods } from "@arven/db";

import type { DayKey } from "../domain/day";
import { endOf, startOf } from "../domain/day";
import type { EntryInput } from "../domain/logged-day";
import { loadDishes } from "./dishes";
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
    // `grams`, and the null a dish entry carries — neither reaches here with a
    // portion to read, so grams is the safe reading.
    default:
      return { kind: "grams", grams: row.grams ?? 0 };
  }
}

export type LogEntryCommand = { id: string; eatenAt: Date } & (
  | { kind: "food"; foodId: string; portion: Portion }
  | { kind: "dish"; dishId: string; scale: number }
);

export async function logEntry(db: Db, command: LogEntryCommand): Promise<void> {
  const row: NewEntry =
    command.kind === "dish"
      ? {
          id: command.id,
          dishId: command.dishId,
          dishScale: command.scale,
          eatenAt: command.eatenAt,
        }
      : {
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
  // Left join, because an entry is a food or a dish and only one side is ever
  // present. An inner join would silently drop every dish from the day.
  const rows = await db
    .select({ entry: entries, food: foods })
    .from(entries)
    .leftJoin(foods, eq(entries.foodId, foods.id))
    .where(and(gte(entries.eatenAt, startOf(day)), lt(entries.eatenAt, endOf(day))))
    .orderBy(asc(entries.eatenAt));

  const dishIds = rows.map(({ entry }) => entry.dishId).filter((id): id is string => !!id);
  const loaded = dishIds.length > 0 ? await loadDishes(db, dishIds) : [];
  const byId = new Map(loaded.map((dish) => [dish.id, dish]));

  return rows.flatMap(({ entry, food }): EntryInput[] => {
    if (entry.dishId) {
      const dish = byId.get(entry.dishId);
      // A dish deleted out from under an entry would otherwise crash the day.
      return dish
        ? [{ id: entry.id, eatenAt: entry.eatenAt, kind: "dish", dish, scale: entry.dishScale ?? 1 }]
        : [];
    }

    if (!food) return [];

    return [
      {
        id: entry.id,
        eatenAt: entry.eatenAt,
        kind: "food",
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
      },
    ];
  });
}
