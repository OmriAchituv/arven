"use client";

import { useState } from "react";

import { field, page } from "~/lib/styles";

export interface FoodDraft {
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  units: Array<{ name: string; grams: number }>;
}

type Row = { name: string; grams: string };

/**
 * A food, as written on a packet.
 *
 * Per 100 g throughout, because that is how Israeli labels are printed —
 * copying four numbers across should take seconds and require no arithmetic.
 */
export function FoodForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  footer,
}: {
  initial?: Partial<FoodDraft>;
  submitLabel: string;
  onSubmit: (draft: FoodDraft) => Promise<void>;
  onCancel: () => void;
  footer?: React.ReactNode;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kcal, setKcal] = useState(numberText(initial?.kcalPer100g));
  const [protein, setProtein] = useState(numberText(initial?.proteinPer100g));
  const [carbs, setCarbs] = useState(numberText(initial?.carbsPer100g));
  const [fat, setFat] = useState(numberText(initial?.fatPer100g));
  const [units, setUnits] = useState<Row[]>(
    initial?.units?.map((unit) => ({ name: unit.name, grams: String(unit.grams) })) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    name.trim().length > 0 && [kcal, protein, carbs, fat].every((v) => Number(v) >= 0 && v !== "");

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        kcalPer100g: Number(kcal),
        proteinPer100g: Number(protein),
        carbsPer100g: Number(carbs),
        fatPer100g: Number(fat),
        units: units
          .filter((unit) => unit.name.trim() && Number(unit.grams) > 0)
          .map((unit) => ({ name: unit.name.trim(), grams: Number(unit.grams) })),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "לא הצלחנו לשמור.");
      setSaving(false);
    }
  }

  return (
    <main style={page}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "var(--step1)", fontWeight: 500 }}>מזון משלך</h1>
        <button onClick={onCancel} style={linkButton}>
          ביטול
        </button>
      </div>

      <label style={labelStyle}>
        <span style={hint}>שם</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          data-testid="food-name"
          placeholder="למשל: סביח, הפלאפל של יוסי"
          style={field}
        />
      </label>

      <p style={{ ...hint, margin: "1.5rem 0 0.5rem" }}>ל־100 גרם, כמו שכתוב על האריזה</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <NumberField label="קלוריות" value={kcal} onChange={setKcal} testId="food-kcal" />
        <NumberField label="חלבון" value={protein} onChange={setProtein} testId="food-protein" />
        <NumberField label="פחמימות" value={carbs} onChange={setCarbs} testId="food-carbs" />
        <NumberField label="שומן" value={fat} onChange={setFat} testId="food-fat" />
      </div>

      <p style={{ ...hint, margin: "1.75rem 0 0.5rem" }}>
        מידות — לא חובה, אבל חוסכות שקילה בפעם הבאה
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {units.map((unit, index) => (
          <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={unit.name}
              onChange={(event) => setUnits(replace(units, index, { name: event.target.value }))}
              placeholder="גביע"
              data-testid={`unit-name-${index}`}
              style={{ ...field, flex: 1 }}
            />
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={unit.grams}
              onChange={(event) => setUnits(replace(units, index, { grams: event.target.value }))}
              placeholder="250"
              data-testid={`unit-grams-${index}`}
              style={{ ...field, width: "6.5rem" }}
            />
            <button
              onClick={() => setUnits(units.filter((_, i) => i !== index))}
              aria-label="הסרת מידה"
              style={{ ...linkButton, color: "var(--ink-faint)" }}
            >
              הסרה
            </button>
          </div>
        ))}
        <button
          onClick={() => setUnits([...units, { name: "", grams: "" }])}
          data-testid="add-unit"
          style={{ ...linkButton, alignSelf: "flex-start" }}
        >
          הוספת מידה
        </button>
      </div>

      {footer}

      {error ? (
        <p role="alert" data-testid="food-error" style={{ color: "var(--ink-soft)", marginTop: "1rem" }}>
          {error}
        </p>
      ) : null}

      <button
        onClick={submit}
        disabled={!valid || saving}
        data-testid="save-food"
        style={{
          font: "inherit",
          marginTop: "auto",
          padding: "0.9rem",
          borderRadius: "2px",
          border: "none",
          background: valid ? "var(--accent)" : "var(--edge)",
          color: valid ? "var(--ground)" : "var(--ink-faint)",
          cursor: valid && !saving ? "pointer" : "default",
        }}
      >
        {saving ? "שומר…" : submitLabel}
      </button>
    </main>
  );
}

// Named NumberField, not Number: shadowing the global made every Number()
// call in this file resolve to the component.
function NumberField({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  testId: string;
}) {
  return (
    <label style={labelStyle}>
      <span style={hint}>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-testid={testId}
        style={field}
      />
    </label>
  );
}

function replace(rows: Row[], index: number, patch: Partial<Row>): Row[] {
  return rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

function numberText(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

const hint: React.CSSProperties = { fontSize: "12.5px", color: "var(--ink-faint)" };

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
};

const linkButton: React.CSSProperties = {
  font: "inherit",
  background: "none",
  border: "none",
  color: "var(--accent)",
  cursor: "pointer",
  padding: 0,
};
