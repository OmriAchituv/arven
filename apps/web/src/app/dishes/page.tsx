"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ProvenanceMark } from "~/components/provenance";
import { LTR_NUMBER } from "~/lib/format";
import { page } from "~/lib/styles";
import { api } from "~/lib/trpc";

type Dish = Awaited<ReturnType<typeof api.nutrition.dishes.query>>[number];

const SCALES = [
  { label: "¼", value: 0.25 },
  { label: "½", value: 0.5 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
];

/**
 * Your dishes, and logging one.
 *
 * One tap for the whole thing at full size; a scale if you had less of it. The
 * components are shown because a dish that cannot be inspected is the frozen
 * number this model exists to avoid.
 */
export default function DishesPage() {
  const router = useRouter();
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plate, setPlate] = useState("");
  const [pot, setPot] = useState("");

  const load = useCallback(() => {
    api.nutrition.dishes.query().then(setDishes);
  }, []);
  useEffect(load, [load]);

  async function log(dish: Dish, portion: { kind: "scale"; scale: number } | { kind: "grams"; grams: number }) {
    setSaving(dish.id);
    try {
      await api.nutrition.logDish.mutate({ dishId: dish.id, portion });
      router.push("/");
    } catch {
      setSaving(null);
      setError("לא הצלחנו לרשום.");
    }
  }

  async function weigh(dish: Dish) {
    const grams = Number(pot);
    if (!Number.isFinite(grams) || grams <= 0) return;
    await api.nutrition.weighDish.mutate({ dishId: dish.id, grams });
    setPot("");
    load();
  }

  async function remove(dish: Dish) {
    setError(null);
    try {
      await api.nutrition.deleteDish.mutate({ dishId: dish.id });
      load();
    } catch {
      setError(`אי אפשר למחוק את ${dish.name} — היא כבר נרשמה ביומן.`);
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
        <h1 style={{ margin: 0, fontSize: "var(--step1)", fontWeight: 500 }}>המנות שלי</h1>
        <button onClick={() => router.push("/")} style={link}>
          סגירה
        </button>
      </div>

      {dishes === null ? null : dishes.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>
          עוד לא שמרת מנה. אחרי שרושמים כמה פריטים ביום, אפשר לשמור אותם יחד.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }} data-testid="dishes">
          {dishes.map((dish) => {
            const grounded = dish.nourishment.provenance.kind !== "estimate";
            const open = expanded === dish.id;

            return (
              <li key={dish.id} style={{ borderBottom: "1px solid var(--edge)", padding: "0.85rem 0" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                  <ProvenanceMark grounded={grounded} />
                  <button
                    onClick={() => setExpanded(open ? null : dish.id)}
                    style={{ ...link, color: "var(--ink)", flex: 1, textAlign: "start" }}
                  >
                    {dish.name}
                  </button>
                  <span style={{ ...LTR_NUMBER, fontSize: "14.5px" }}>
                    {grounded ? "" : "~"}
                    {Math.round(dish.nourishment.nutrients.kcal).toLocaleString("en-US")}
                  </span>
                </div>

                {open ? (
                  <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {dish.nourishment.parts.map((part, index) => (
                        <li
                          key={index}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "13px",
                            color: "var(--ink-faint)",
                            padding: "0.2rem 0",
                          }}
                        >
                          <span>{part.foodName}</span>
                          <span style={LTR_NUMBER}>{Math.round(part.nourishment.grams)} ג׳</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        fontSize: "var(--step-1)",
                        color: "var(--ink-faint)",
                      }}
                    >
                      <span>
                        {dish.yield.measured ? "אחרי בישול" : "גולמי"} {Math.round(dish.yield.grams)} ג׳
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={pot}
                        onChange={(event) => setPot(event.target.value)}
                        placeholder="שקילת הסיר"
                        data-testid="pot-weight"
                        style={{ ...smallField, width: "7.5rem" }}
                      />
                      <button onClick={() => weigh(dish)} data-testid="save-yield" style={link}>
                        שמירה
                      </button>
                    </div>

                    {!dish.yield.measured ? (
                      // Rice roughly triples; a roast loses water. Dividing by
                      // the raw sum is an assumption, so it is stated rather
                      // than hidden behind a confident number.
                      <p style={{ margin: 0, fontSize: "12.5px", color: "var(--ink-faint)" }}>
                        המשקל הגולמי משמש כברירת מחדל. שקילת הסיר אחרי הבישול תדייק מנה לפי משקל.
                      </p>
                    ) : null}

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={plate}
                        onChange={(event) => setPlate(event.target.value)}
                        placeholder="כמה גרם אכלת"
                        data-testid="plate-weight"
                        style={{ ...smallField, width: "9rem" }}
                      />
                      <button
                        onClick={() => log(dish, { kind: "grams", grams: Number(plate) })}
                        disabled={!(Number(plate) > 0) || saving === dish.id}
                        data-testid="log-dish-grams"
                        style={{
                          font: "inherit",
                          fontSize: "var(--step-1)",
                          padding: "0.45rem 0.9rem",
                          borderRadius: "2px",
                          border: "1px solid var(--accent)",
                          background: Number(plate) > 0 ? "var(--accent)" : "transparent",
                          color: Number(plate) > 0 ? "var(--ground)" : "var(--accent)",
                          cursor: Number(plate) > 0 ? "pointer" : "default",
                        }}
                      >
                        רישום לפי משקל
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {SCALES.map((scale) => (
                        <button
                          key={scale.value}
                          onClick={() => log(dish, { kind: "scale", scale: scale.value })}
                          disabled={saving === dish.id}
                          data-testid={`log-dish-${scale.value}`}
                          style={{
                            font: "inherit",
                            fontSize: "var(--step-1)",
                            padding: "0.45rem 0.9rem",
                            borderRadius: "2px",
                            cursor: "pointer",
                            border: "1px solid var(--accent)",
                            background: scale.value === 1 ? "var(--accent)" : "transparent",
                            color: scale.value === 1 ? "var(--ground)" : "var(--accent)",
                          }}
                        >
                          {scale.value === 1 ? "רישום" : `× ${scale.label}`}
                        </button>
                      ))}
                      <button onClick={() => remove(dish)} style={{ ...link, color: "var(--ink-faint)" }}>
                        מחיקה
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p role="alert" data-testid="dish-error" style={{ color: "var(--ink-soft)", marginTop: "1rem" }}>
          {error}
        </p>
      ) : null}
    </main>
  );
}

const smallField: React.CSSProperties = {
  font: "inherit",
  fontSize: "var(--step-1)",
  padding: "0.4rem 0.6rem",
  borderRadius: "2px",
  border: "1px solid var(--edge)",
  background: "var(--surface)",
  color: "var(--ink)",
};

const link: React.CSSProperties = {
  font: "inherit",
  background: "none",
  border: "none",
  color: "var(--accent)",
  cursor: "pointer",
  padding: 0,
};
