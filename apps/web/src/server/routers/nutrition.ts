import { z } from "zod";

import {
  addMyFood,
  buildDish,
  changeDish,
  dishesOfMine,
  dropDish,
  dayOfEating,
  editMyFood,
  findFood,
  myFoodUsage,
  myFoods,
  recordEating,
  removeMyFood,
  weighIt,
} from "@arven/nutrition";
import { dayKeyOf } from "@arven/nutrition";

import { db } from "~/server/db";
import { publicProcedure, router } from "../trpc";

/** `YYYY-MM-DD`, the local calendar date identifying a Day. */
const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

/**
 * The Portion union, as it arrives from the interface. Mirrors the domain type
 * — the interface never sends grams it worked out itself, it sends what the
 * person chose and lets the domain resolve it.
 */
const portion = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("grams"), grams: z.number().positive() }),
  z.object({
    kind: z.literal("measure"),
    unit: z.string().min(1),
    gramsPerUnit: z.number().positive(),
    count: z.number().positive(),
  }),
  z.object({
    kind: z.literal("estimate"),
    label: z.string().min(1),
    assumedGrams: z.number().positive(),
    uncertainty: z.number().min(0).max(1).optional(),
  }),
]);

/** A food as read off a packet. Per 100 g, because that is how labels are written. */
const foodDraft = z.object({
  name: z.string().trim().min(1, "a food needs a name"),
  kcalPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0),
  fatPer100g: z.number().min(0),
  units: z
    .array(z.object({ name: z.string().trim().min(1), grams: z.number().positive() }))
    .max(12)
    .default([]),
});

/** A dish is a name and what is in it. Never a total. */
const dishDraft = z.object({
  name: z.string().trim().min(1, "a dish needs a name"),
  components: z
    .array(z.object({ foodId: z.string().min(1), portion }))
    .min(1, "a dish needs something in it")
    .max(40),
});

export const nutritionRouter = router({
  search: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().min(1).max(50).optional() }))
    .query(({ input }) => findFood(db(), input.query, input.limit)),

  day: publicProcedure
    .input(z.object({ day: dayKey.optional() }).optional())
    .query(({ input }) => dayOfEating(db(), input?.day ?? dayKeyOf(new Date()))),

  log: publicProcedure
    .input(
      z.object({
        foodId: z.string().min(1),
        portion,
        eatenAt: z.coerce.date().optional(),
      }),
    )
    .mutation(({ input }) =>
      recordEating(db(), {
        id: crypto.randomUUID(),
        kind: "food",
        foodId: input.foodId,
        portion: input.portion,
        eatenAt: input.eatenAt ?? new Date(),
      }),
    ),

  dishes: publicProcedure.query(() => dishesOfMine(db())),

  createDish: publicProcedure
    .input(dishDraft)
    .mutation(({ input }) => buildDish(db(), crypto.randomUUID(), input)),

  updateDish: publicProcedure
    .input(z.object({ dishId: z.string().min(1), draft: dishDraft }))
    .mutation(({ input }) => changeDish(db(), input.dishId, input.draft)),

  deleteDish: publicProcedure
    .input(z.object({ dishId: z.string().min(1) }))
    .mutation(({ input }) => dropDish(db(), input.dishId)),

  logDish: publicProcedure
    .input(
      z.object({
        dishId: z.string().min(1),
        scale: z.number().positive().max(20).default(1),
        eatenAt: z.coerce.date().optional(),
      }),
    )
    .mutation(({ input }) =>
      recordEating(db(), {
        id: crypto.randomUUID(),
        kind: "dish",
        dishId: input.dishId,
        scale: input.scale,
        eatenAt: input.eatenAt ?? new Date(),
      }),
    ),

  myFoods: publicProcedure.query(() => myFoods(db())),

  foodUsage: publicProcedure
    .input(z.object({ foodId: z.string().min(1) }))
    .query(({ input }) => myFoodUsage(db(), input.foodId)),

  createFood: publicProcedure
    .input(foodDraft)
    .mutation(({ input }) => addMyFood(db(), crypto.randomUUID(), input)),

  updateFood: publicProcedure
    .input(z.object({ foodId: z.string().min(1), draft: foodDraft }))
    .mutation(({ input }) => editMyFood(db(), input.foodId, input.draft)),

  deleteFood: publicProcedure
    .input(z.object({ foodId: z.string().min(1) }))
    .mutation(({ input }) => removeMyFood(db(), input.foodId)),

  weigh: publicProcedure
    .input(z.object({ entryId: z.string().min(1), grams: z.number().positive() }))
    .mutation(({ input }) => weighIt(db(), input.entryId, input.grams)),
});
