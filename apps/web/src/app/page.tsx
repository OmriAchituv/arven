import Link from "next/link";

import { dayKeyOf, dayOfEating, isGrounded } from "@arven/nutrition";

import { ProvenanceMark } from "~/components/provenance";
import { WeighButton } from "~/components/weigh";
import { Wordmark } from "~/components/wordmark";
import { LTR_NUMBER, kcal, longDate, macro, time } from "~/lib/format";
import { db } from "~/server/db";

// The day is read per request; there is nothing here to cache.
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const now = new Date();
  const day = await dayOfEating(db(), dayKeyOf(now));
  const hasEntries = day.entries.length > 0;

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        padding:
          "max(1.25rem, env(safe-area-inset-top)) 1.25rem calc(5.5rem + env(safe-area-inset-bottom))",
      }}
    >
      <header style={{ marginBottom: "2.5rem" }}>
        <Wordmark size="1.1rem" />
      </header>

      {/*
        Understanding before data, per brief §33. The figure and how sure it is
        come first; the itemised list is secondary.
      */}
      <section style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <p
          style={{
            margin: 0,
            fontSize: "var(--step-1)",
            color: "var(--ink-faint)",
            letterSpacing: "0.02em",
          }}
        >
          {longDate(now)}
        </p>

        <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
          <span
            style={{
              fontFamily: "var(--font-wordmark), serif",
              fontSize: "clamp(3rem, 16vw, 4rem)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {kcal(day.total.kcal)}
          </span>
          {/*
            A band only when something was estimated. "1,740 ± 0" is a stranger
            claim than "1,740".
          */}
          {day.band > 0 ? (
            <span style={{ ...LTR_NUMBER, color: "var(--ink-faint)", fontSize: "var(--step0)" }}>
              ± {kcal(day.band)}
            </span>
          ) : null}
        </div>

        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "var(--step-1)" }}>
          קלוריות
        </p>
      </section>

      {hasEntries ? (
        <>
          <section
            style={{
              display: "flex",
              gap: "1.75rem",
              margin: "1.75rem 0",
              paddingBottom: "1.5rem",
              borderBottom: "1px solid var(--edge)",
            }}
          >
            {[
              ["חלבון", day.total.protein],
              ["פחמימות", day.total.carbs],
              ["שומן", day.total.fat],
            ].map(([label, value]) => (
              <div key={label as string} style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                <span style={{ fontSize: "11.5px", color: "var(--ink-faint)", letterSpacing: "0.05em" }}>
                  {label as string}
                </span>
                <span style={{ fontSize: "var(--step1)", fontWeight: 500 }}>
                  {macro(value as number)}
                </span>
              </div>
            ))}
          </section>

          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {day.entries.map((entry) => {
              const grounded = isGrounded(entry.nourishment.provenance);

              const row = (
                <>
                  <span style={{ fontSize: "12.5px", color: "var(--ink-faint)" }}>
                    {time(entry.eatenAt)}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      minWidth: 0,
                    }}
                  >
                    <ProvenanceMark grounded={grounded} />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.foodName}
                    </span>
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--ink-faint)" }}>
                    {entry.nourishment.portionLabel}
                  </span>
                  <span
                    style={{ ...LTR_NUMBER, fontSize: "14.5px", minWidth: "3.2rem", textAlign: "left" }}
                  >
                    {grounded ? "" : "~"}
                    {kcal(entry.nourishment.nutrients.kcal)}
                  </span>
                </>
              );

              return (
                <li
                  key={entry.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto",
                    alignItems: "baseline",
                    gap: "0.75rem",
                    padding: "0.7rem 0",
                    borderBottom: "1px solid var(--edge)",
                  }}
                >
                  {grounded ? (
                    row
                  ) : (
                    // Only an estimate is tappable. There is nothing to correct
                    // about a weight that was already measured.
                    <WeighButton
                      entryId={entry.id}
                      name={entry.foodName}
                      assumedGrams={entry.nourishment.grams}
                    >
                      {row}
                    </WeighButton>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        // Considered rather than blank. No encouragement, no exclamation — it
        // simply states where things are.
        <p style={{ margin: "2.5rem 0 0", color: "var(--ink-soft)" }}>עוד לא נרשם דבר היום.</p>
      )}

      <Link
        href="/add"
        style={{
          position: "fixed",
          insetInline: "1.25rem",
          bottom: "calc(1.25rem + env(safe-area-inset-bottom))",
          padding: "0.9rem",
          borderRadius: "2px",
          background: "var(--accent)",
          color: "var(--ground)",
          textAlign: "center",
          textDecoration: "none",
          fontSize: "var(--step0)",
        }}
      >
        הוספה
      </Link>
    </main>
  );
}
