"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { ProvenanceMark } from "~/components/provenance";
import { approximateLabel, uncertaintyFor } from "@arven/nutrition";
import { LTR_NUMBER } from "~/lib/format";
import { api } from "~/lib/trpc";

type Food = Awaited<ReturnType<typeof api.nutrition.search.query>>[number];
type Unit = Food["units"][number];

const SOURCE_LABEL: Record<string, string> = {
  personal: "שלך",
  moh: "משרד הבריאות",
  usda: "USDA",
  off: "Open Food Facts",
};

/**
 * Adding something eaten: search, choose how much, done.
 *
 * Two steps and no more. This is where every tracker dies — v2 put a language
 * model and a confirmation card in front of every log, and logging a coffee
 * became a round trip. Nothing here calls a model; the measures come from a
 * lookup table.
 */
function Add() {
  const router = useRouter();
  const [chosen, setChosen] = useState<Food | null>(null);

  return chosen ? (
    <PortionStep food={chosen} onBack={() => setChosen(null)} onDone={() => router.push("/")} />
  ) : (
    <SearchStep onPick={setChosen} onCancel={() => router.push("/")} />
  );
}

export default function AddPage() {
  // useSearchParams needs a boundary, or the route cannot be prerendered.
  return (
    <Suspense>
      <Add />
    </Suspense>
  );
}

function SearchStep({
  onPick,
  onCancel,
}: {
  onPick: (food: Food) => void;
  onCancel: () => void;
}) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }

    // Wait for a pause in typing rather than querying on every keystroke.
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      api.nutrition.search
        .query({ query: term, limit: 20 })
        .then((found) => {
          if (!cancelled) setResults(found);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <main style={page}>
      <Header title="הוספה" action={{ label: "ביטול", onClick: onCancel }} />

      <input
        ref={input}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="חיפוש מזון"
        aria-label="חיפוש מזון"
        data-testid="food-search"
        enterKeyHint="search"
        style={{
          font: "inherit",
          width: "100%",
          padding: "0.8rem 1rem",
          borderRadius: "2px",
          border: "1px solid var(--edge)",
          background: "var(--surface)",
          color: "var(--ink)",
        }}
      />

      <ul style={{ listStyle: "none", margin: "1.25rem 0 0", padding: 0 }} data-testid="results">
        {results.map((food) => (
          <li key={food.id}>
            <button
              onClick={() => onPick(food)}
              style={{
                ...rowButton,
                borderBottom: "1px solid var(--edge)",
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {food.name}
                </span>
                <span style={{ fontSize: "12.5px", color: "var(--ink-faint)" }}>
                  {SOURCE_LABEL[food.source] ?? food.source} · {Math.round(food.kcalPer100g)} קלוריות
                  ל־100 ג׳
                  {food.units.length > 0 ? ` · ${food.units.length} מידות` : ""}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {query.trim().length >= 2 && !searching && results.length === 0 ? (
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ color: "var(--ink-soft)", margin: 0 }}>לא נמצא מזון בשם הזה.</p>
          {/*
            The Ministry's set has real gaps — סביח and פרגית return nothing at
            all — so the moment a search fails is the moment to offer entering
            it from the packet. The name carries across.
          */}
          <Link
            href={`/foods/new?name=${encodeURIComponent(query.trim())}`}
            data-testid="create-food"
            style={{ color: "var(--accent)" }}
          >
            הוספת {query.trim()} כמזון משלך
          </Link>
        </div>
      ) : null}

      <Link
        href="/foods"
        data-testid="my-foods-link"
        style={{ marginTop: "auto", color: "var(--ink-faint)", fontSize: "var(--step-1)" }}
      >
        המזונות שלי
      </Link>
    </main>
  );
}

function PortionStep({
  food,
  onBack,
  onDone,
}: {
  food: Food;
  onBack: () => void;
  onDone: () => void;
}) {
  // The measure a person is most likely to mean comes first; grams stay
  // available for anything that was actually weighed.
  const [unit, setUnit] = useState<Unit | null>(food.units[0] ?? null);
  const [count, setCount] = useState("1");
  const [gramsText, setGramsText] = useState("100");
  const [roughly, setRoughly] = useState(false);
  const [saving, setSaving] = useState(false);

  const usingGrams = unit === null;
  const amount = Number(usingGrams ? gramsText : count);
  const grams = usingGrams ? amount : amount * (unit?.grams ?? 0);
  const valid = Number.isFinite(amount) && amount > 0;

  // A weighed amount is a measurement. A measure may still be a judgement —
  // "מנה בינונית" is you deciding your portion was medium — and saying "בערך"
  // makes any of them one.
  const uncertainty = usingGrams ? null : uncertaintyFor(unit!.name, roughly);
  const grounded = uncertainty === null;

  const kcal = useMemo(
    () => (valid ? Math.round((food.kcalPer100g * grams) / 100) : 0),
    [food.kcalPer100g, grams, valid],
  );

  async function log() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await api.nutrition.log.mutate({
        foodId: food.id,
        portion: usingGrams
          ? { kind: "grams", grams: amount }
          : grounded
            ? {
                kind: "measure",
                unit: unit!.name,
                gramsPerUnit: unit!.grams,
                count: amount,
              }
            : {
                kind: "estimate",
                label: roughly ? approximateLabel(unit!.name, amount) : unit!.name,
                assumedGrams: grams,
                uncertainty,
              },
      });
      onDone();
    } catch {
      setSaving(false);
    }
  }

  return (
    <main style={page}>
      <Header title={food.name} action={{ label: "חזרה", onClick: onBack }} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {food.units.map((option) => (
          <Chip
            key={option.name}
            selected={unit?.name === option.name}
            onClick={() => setUnit(option)}
          >
            {option.name}
          </Chip>
        ))}
        <Chip selected={usingGrams} onClick={() => setUnit(null)}>
          גרמים
        </Chip>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <span style={{ fontSize: "12.5px", color: "var(--ink-faint)" }}>
          {usingGrams ? "כמה גרמים" : `כמה ${unit?.name}`}
        </span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step={usingGrams ? "1" : "0.5"}
          value={usingGrams ? gramsText : count}
          onChange={(event) =>
            usingGrams ? setGramsText(event.target.value) : setCount(event.target.value)
          }
          data-testid="amount"
          style={{
            font: "inherit",
            width: "100%",
            padding: "0.8rem 1rem",
            borderRadius: "2px",
            border: "1px solid var(--edge)",
            background: "var(--surface)",
            color: "var(--ink)",
          }}
        />
      </label>

      {!usingGrams ? (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginTop: "1.25rem",
            color: "var(--ink-soft)",
            fontSize: "var(--step-1)",
          }}
        >
          <input
            type="checkbox"
            checked={roughly}
            onChange={(event) => setRoughly(event.target.checked)}
            data-testid="roughly"
            style={{ accentColor: "var(--accent)", width: "1.1rem", height: "1.1rem" }}
          />
          בערך, לא נמדד
        </label>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.6rem",
          margin: "1.75rem 0 0",
        }}
        data-testid="preview"
      >
        <ProvenanceMark grounded={grounded} />
        <span
          style={{
            ...LTR_NUMBER,
            fontFamily: "var(--font-wordmark), serif",
            fontSize: "2.25rem",
            lineHeight: 1,
          }}
        >
          {grounded ? "" : "~"}
          {kcal.toLocaleString("en-US")}
        </span>
        <span style={{ color: "var(--ink-soft)" }}>
          קלוריות · {grounded ? "" : "בערך "}
          {Math.round(grams).toLocaleString("en-US")} ג׳
        </span>
      </div>

      <button
        onClick={log}
        disabled={!valid || saving}
        data-testid="log"
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
        {saving ? "רושם…" : "רישום"}
      </button>
    </main>
  );
}

function Header({
  title,
  action,
}: {
  title: string;
  action: { label: string; onClick: () => void };
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "var(--step1)",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </h1>
      <button
        onClick={action.onClick}
        style={{
          font: "inherit",
          background: "none",
          border: "none",
          color: "var(--accent)",
          cursor: "pointer",
          padding: 0,
          flex: "none",
        }}
      >
        {action.label}
      </button>
    </div>
  );
}

function Chip({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        font: "inherit",
        fontSize: "var(--step-1)",
        padding: "0.45rem 0.85rem",
        borderRadius: "2px",
        cursor: "pointer",
        border: `1px solid ${selected ? "var(--accent)" : "var(--edge)"}`,
        background: selected ? "var(--accent)" : "transparent",
        color: selected ? "var(--ground)" : "var(--ink-soft)",
      }}
    >
      {children}
    </button>
  );
}

const page: React.CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  padding:
    "max(1.25rem, env(safe-area-inset-top)) 1.25rem calc(1.25rem + env(safe-area-inset-bottom))",
};

const rowButton: React.CSSProperties = {
  font: "inherit",
  width: "100%",
  textAlign: "start",
  background: "none",
  border: "none",
  borderBottom: "1px solid var(--edge)",
  padding: "0.85rem 0",
  cursor: "pointer",
  color: "var(--ink)",
  display: "flex",
};
