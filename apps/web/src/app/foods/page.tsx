"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { page } from "~/lib/styles";
import { api } from "~/lib/trpc";

type Food = Awaited<ReturnType<typeof api.nutrition.myFoods.query>>[number];

/** Everything you have entered yourself. Searched before anything else. */
export default function MyFoodsPage() {
  const router = useRouter();
  const [foods, setFoods] = useState<Food[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.nutrition.myFoods.query().then(setFoods);
  }, []);

  useEffect(load, [load]);

  async function remove(food: Food) {
    setError(null);
    try {
      await api.nutrition.deleteFood.mutate({ foodId: food.id });
      load();
    } catch {
      // Refused while entries still point at it — deleting would either orphan
      // them or take them with it, and silently rewriting what someone ate is
      // worse than being told no.
      setError(`אי אפשר למחוק את ${food.name} — הוא כבר נרשם ביומן.`);
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
        <h1 style={{ margin: 0, fontSize: "var(--step1)", fontWeight: 500 }}>המזונות שלי</h1>
        <button onClick={() => router.push("/")} style={link}>
          סגירה
        </button>
      </div>

      {foods === null ? null : foods.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>עוד לא הוספת מזון משלך.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }} data-testid="my-foods">
          {foods.map((food) => (
            <li
              key={food.id}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.85rem 0",
                borderBottom: "1px solid var(--edge)",
              }}
            >
              <Link
                href={`/foods/${encodeURIComponent(food.id)}`}
                style={{ textDecoration: "none", color: "inherit", minWidth: 0 }}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <span>{food.name}</span>
                  <span style={{ fontSize: "12.5px", color: "var(--ink-faint)" }}>
                    {Math.round(food.kcalPer100g)} קלוריות ל־100 ג׳
                    {food.units.length > 0
                      ? ` · ${food.units.map((unit) => `${unit.name} ${unit.grams}ג׳`).join(" · ")}`
                      : ""}
                  </span>
                </span>
              </Link>
              <button onClick={() => remove(food)} style={{ ...link, color: "var(--ink-faint)" }}>
                מחיקה
              </button>
            </li>
          ))}
        </ul>
      )}

      {error ? (
        <p role="alert" data-testid="delete-error" style={{ color: "var(--ink-soft)", marginTop: "1rem" }}>
          {error}
        </p>
      ) : null}

      <Link
        href="/foods/new"
        style={{
          marginTop: "auto",
          padding: "0.9rem",
          borderRadius: "2px",
          background: "var(--accent)",
          color: "var(--ground)",
          textAlign: "center",
          textDecoration: "none",
        }}
      >
        הוספת מזון
      </Link>
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
  flex: "none",
};
