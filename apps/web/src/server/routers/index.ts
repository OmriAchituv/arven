import { router } from "../trpc";
import { systemRouter } from "./system";

/**
 * Routers stay thin: validate, delegate to a context's use cases, return.
 * Business rules belong in packages/*, never here.
 */
export const appRouter = router({
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
