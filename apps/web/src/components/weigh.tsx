"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/lib/trpc";

/**
 * Turning an estimate into a measurement.
 *
 * An invitation, never a reproach — brief §21, honesty has to feel rewarded or
 * the log stops reflecting what was actually eaten. So the row stays perfectly
 * usable as an estimate, and this only appears if you tap it.
 */
export function WeighButton({
  entryId,
  name,
  assumedGrams,
  children,
}: {
  entryId: string;
  name: string;
  assumedGrams: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [grams, setGrams] = useState(String(Math.round(assumedGrams)));
  const [saving, setSaving] = useState(false);

  const amount = Number(grams);
  const valid = Number.isFinite(amount) && amount > 0;

  async function weigh() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await api.nutrition.weigh.mutate({ entryId, grams: amount });
      setOpen(false);
      router.refresh();
    } catch {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        data-testid="weigh-open"
        aria-label={`שקילת ${name}`}
        style={{
          font: "inherit",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "inherit",
          textAlign: "start",
          display: "contents",
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0.6rem 0",
      }}
    >
      <span style={{ fontSize: "13px", color: "var(--ink-faint)", flex: "none" }}>
        כמה גרמים היו?
      </span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        value={grams}
        autoFocus
        onChange={(event) => setGrams(event.target.value)}
        data-testid="weigh-amount"
        style={{
          font: "inherit",
          width: "6rem",
          padding: "0.4rem 0.6rem",
          borderRadius: "2px",
          border: "1px solid var(--edge)",
          background: "var(--surface)",
          color: "var(--ink)",
        }}
      />
      <button
        onClick={weigh}
        disabled={!valid || saving}
        data-testid="weigh-save"
        style={{
          font: "inherit",
          fontSize: "var(--step-1)",
          padding: "0.45rem 0.85rem",
          borderRadius: "2px",
          border: "none",
          background: "var(--accent)",
          color: "var(--ground)",
          cursor: valid ? "pointer" : "default",
        }}
      >
        {saving ? "שומר…" : "שמירה"}
      </button>
      <button
        onClick={() => setOpen(false)}
        style={{
          font: "inherit",
          fontSize: "var(--step-1)",
          background: "none",
          border: "none",
          color: "var(--ink-faint)",
          cursor: "pointer",
        }}
      >
        ביטול
      </button>
    </div>
  );
}
