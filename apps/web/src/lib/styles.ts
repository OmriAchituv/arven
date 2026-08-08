import type { CSSProperties } from "react";

/** Shared shapes, so screens don't each invent their own. */
export const page: CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  padding:
    "max(1.25rem, env(safe-area-inset-top)) 1.25rem calc(1.25rem + env(safe-area-inset-bottom))",
};

export const field: CSSProperties = {
  font: "inherit",
  width: "100%",
  padding: "0.7rem 0.9rem",
  borderRadius: "2px",
  border: "1px solid var(--edge)",
  background: "var(--surface)",
  color: "var(--ink)",
};
