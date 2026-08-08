"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { field } from "~/lib/styles";
import { api } from "~/lib/trpc";

export interface SavableEntry {
  id: string;
  foodId: string;
  foodName: string;
  portion:
    | { kind: "grams"; grams: number }
    | { kind: "measure"; unit: string; gramsPerUnit: number; count: number }
    | { kind: "estimate"; label: string; assumedGrams: number; uncertainty?: number };
}

/**
 * Turn what is already on today into a dish.
 *
 * This is how dishes actually come to exist. Nobody sits down to define a
 * composition in the abstract — they log breakfast, notice it is the breakfast
 * they always have, and give it a name.
 *
 * Only food entries can be taken. A dish already on the day would mean nesting
 * one inside another, which is a tempting generalisation with real complexity
 * and no demonstrated need.
 */
export function SaveAsDish({ entries }: { entries: SavableEntry[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [chosen, setChosen] = useState<Set<string>>(new Set(entries.map((entry) => entry.id)));
  const [saving, setSaving] = useState(false);

  const picked = entries.filter((entry) => chosen.has(entry.id));
  const valid = name.trim().length > 0 && picked.length > 0;

  if (entries.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        data-testid="save-as-dish"
        style={{
          font: "inherit",
          fontSize: "var(--step-1)",
          background: "none",
          border: "none",
          color: "var(--accent)",
          cursor: "pointer",
          padding: "0.75rem 0 0",
          alignSelf: "flex-start",
        }}
      >
        שמירת היום כמנה
      </button>
    );
  }

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await api.nutrition.createDish.mutate({
        name: name.trim(),
        components: picked.map((entry) => ({ foodId: entry.foodId, portion: entry.portion })),
      });
      setOpen(false);
      setName("");
      router.push("/dishes");
    } catch {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "1.25rem" }}>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="שם המנה"
        aria-label="שם המנה"
        data-testid="dish-name"
        autoFocus
        style={field}
      />

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.35rem 0",
                fontSize: "var(--step-1)",
                color: "var(--ink-soft)",
              }}
            >
              <input
                type="checkbox"
                checked={chosen.has(entry.id)}
                onChange={(event) => {
                  const next = new Set(chosen);
                  if (event.target.checked) next.add(entry.id);
                  else next.delete(entry.id);
                  setChosen(next);
                }}
                style={{ accentColor: "var(--accent)", width: "1.1rem", height: "1.1rem" }}
              />
              {entry.foodName}
            </label>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={save}
          disabled={!valid || saving}
          data-testid="confirm-dish"
          style={{
            font: "inherit",
            padding: "0.7rem 1.25rem",
            borderRadius: "2px",
            border: "none",
            background: valid ? "var(--accent)" : "var(--edge)",
            color: valid ? "var(--ground)" : "var(--ink-faint)",
            cursor: valid ? "pointer" : "default",
          }}
        >
          {saving ? "שומר…" : "שמירה"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{
            font: "inherit",
            background: "none",
            border: "none",
            color: "var(--ink-faint)",
            cursor: "pointer",
          }}
        >
          ביטול
        </button>
      </div>
    </div>
  );
}
