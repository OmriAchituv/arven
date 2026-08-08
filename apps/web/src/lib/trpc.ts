import { createTRPCClient, httpBatchLink } from "@trpc/client";

import type { AppRouter } from "~/server/routers";

/** One client for the whole app. Everything the interface calls goes through it. */
export const api = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "/api/trpc" })],
});
