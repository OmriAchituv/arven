import { asc, eq, inArray } from "drizzle-orm";

import type { Db, DishComponent as DishComponentRow } from "@arven/db";
import { dishComponents, dishes, foods } from "@arven/db";

import type { DishDefinition } from "../domain/dish";
import type { Portion } from "../domain/portion";

/**
 * The Portion union crossing to and from its columns — the same mapping entries
 * use, because a component is a portion of a food and there is no reason for
 * the two to be shaped differently.
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

function portionFromColumns(row: DishComponentRow): Portion {
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
        ...(row.estimateUncertainty === null ? {} : { uncertainty: row.estimateUncertainty }),
      };
    default:
      return { kind: "grams", grams: row.grams ?? 0 };
  }
}

export interface DishDraft {
  name: string;
  components: Array<{ foodId: string; portion: Portion }>;
}

export async function createDish(db: Db, id: string, draft: DishDraft): Promise<string> {
  const dishId = `dish:${id}`;
  await db.insert(dishes).values({ id: dishId, name: draft.name });
  await writeComponents(db, dishId, draft.components);
  return dishId;
}

export async function updateDish(db: Db, dishId: string, draft: DishDraft): Promise<void> {
  await db
    .update(dishes)
    .set({ name: draft.name, updatedAt: new Date() })
    .where(eq(dishes.id, dishId));

  // Replaced wholesale rather than diffed: a dish is small, and reconciling
  // rows would be more code with more ways to be subtly wrong.
  await db.delete(dishComponents).where(eq(dishComponents.dishId, dishId));
  await writeComponents(db, dishId, draft.components);
}

async function writeComponents(
  db: Db,
  dishId: string,
  components: DishDraft["components"],
) {
  if (components.length === 0) return;

  await db.insert(dishComponents).values(
    components.map((component, index) => ({
      id: `${dishId}:${index}`,
      dishId,
      foodId: component.foodId,
      rank: index,
      ...portionToColumns(component.portion),
    })),
  );
}

export async function deleteDish(db: Db, dishId: string): Promise<void> {
  // Components cascade. Entries referencing the dish would block this at the
  // foreign key, which is the intended answer — see personal foods.
  await db.delete(dishes).where(eq(dishes.id, dishId));
}

/** Load dishes with everything needed to compute them. */
export async function loadDishes(db: Db, ids?: string[]): Promise<DishDefinition[]> {
  const rows = ids
    ? await db.select().from(dishes).where(inArray(dishes.id, ids))
    : await db.select().from(dishes).orderBy(asc(dishes.name));

  if (rows.length === 0) return [];

  const components = await db
    .select({ component: dishComponents, food: foods })
    .from(dishComponents)
    .innerJoin(foods, eq(dishComponents.foodId, foods.id))
    .where(inArray(dishComponents.dishId, rows.map((row) => row.id)))
    .orderBy(asc(dishComponents.rank));

  const byDish = new Map<string, DishDefinition["components"]>();
  for (const { component, food } of components) {
    const list = byDish.get(component.dishId) ?? [];
    list.push({
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
      portion: portionFromColumns(component),
    });
    byDish.set(component.dishId, list);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    components: byDish.get(row.id) ?? [],
  }));
}

export async function loadDish(db: Db, dishId: string): Promise<DishDefinition | null> {
  const [dish] = await loadDishes(db, [dishId]);
  return dish ?? null;
}
