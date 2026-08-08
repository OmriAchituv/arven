import { z } from "zod";

import { dayOfEating, findFood, recordEating, weighIt } from "@arven/nutrition";
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
        foodId: input.foodId,
        portion: input.portion,
        eatenAt: input.eatenAt ?? new Date(),
      }),
    ),

  weigh: publicProcedure
    .input(z.object({ entryId: z.string().min(1), grams: z.number().positive() }))
    .mutation(({ input }) => weighIt(db(), input.entryId, input.grams)),
});
