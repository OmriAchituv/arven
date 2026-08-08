import { router } from "../trpc";
import { nutritionRouter } from "./nutrition";
import { systemRouter } from "./system";

/**
 * Routers stay thin: validate, delegate to a context's use cases, return.
 * Business rules belong in packages/*, never here.
 */
export const appRouter = router({
  system: systemRouter,
  nutrition: nutritionRouter,
});

export type AppRouter = typeof appRouter;
