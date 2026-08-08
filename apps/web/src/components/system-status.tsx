"use client";

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useEffect, useState } from "react";

import type { AppRouter } from "~/server/routers";

const client = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "/api/trpc" })],
});

type State =
  | { kind: "loading" }
  | { kind: "ready"; schemaVersion: string | null }
  | { kind: "error" };

/**
 * The walking skeleton's only moving part. It exists to prove the path the whole
 * product will use — browser to tRPC over HTTP, to Drizzle, to Neon, and back —
 * and it is replaced by the Today screen in slice #2.
 *
 * It is a client component rather than a server render so the round trip is a
 * real one over the network, not an in-process call that would pass while the
 * route handler was broken.
 */
export function SystemStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    client.system.status
      .query()
      .then((result) => {
        if (!cancelled) {
          setState({ kind: "ready", schemaVersion: result.schemaVersion });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    // Neon wakes from scale-to-zero on the first query. Absorb it quietly
    // rather than announcing it — docs/brand-brief.md §37.
    return <span data-testid="status" style={{ color: "var(--ink-faint)" }}>בודק…</span>;
  }

  if (state.kind === "error") {
    return (
      <span data-testid="status" style={{ color: "var(--ink-soft)" }}>
        אין חיבור למסד הנתונים.
      </span>
    );
  }

  return (
    <span data-testid="status" style={{ color: "var(--ink-soft)" }}>
      מחובר. גרסת סכימה {state.schemaVersion ?? "—"}.
    </span>
  );
}
