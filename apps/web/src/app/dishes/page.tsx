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

  const load = useCallback(() => {
    api.nutrition.dishes.query().then(setDishes);
  }, []);
  useEffect(load, [load]);

  async function log(dish: Dish, scale: number) {
    setSaving(dish.id);
    try {
      await api.nutrition.logDish.mutate({ dishId: dish.id, scale });
      router.push("/");
    } catch {
      setSaving(null);
      setError("לא הצלחנו לרשום.");
    }
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

                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {SCALES.map((scale) => (
                        <button
                          key={scale.value}
                          onClick={() => log(dish, scale.value)}
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

const link: React.CSSProperties = {
  font: "inherit",
  background: "none",
  border: "none",
  color: "var(--accent)",
  cursor: "pointer",
  padding: 0,
};
