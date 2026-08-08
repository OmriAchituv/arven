# Session 01 — Nutrition domain core

**Depends on:** 00 · **Delivers:** the business rules, pure and tested, with no way to run them yet

## Goal

Write the part of ARVEN that would still be true if the database, the framework and the language
model all changed. This is the ownability mechanism from PRD §3 — if this package can't be read in
one sitting, the session failed.

No database. No Next.js. No tRPC. No model provider. Plain TypeScript and Vitest.

## Scope

**In** — `packages/nutrition/domain`

- `Food` — identity, per-100g values, source
- `Portion` — a quantity in grams, millilitres, or a household unit
- `Provenance` — origin and confidence; the `●` / `○` distinction of PRD §4
- `Dish` — a named composition of Foods with Portions, scalable
- `Entry` — one act of eating, referencing a Food + Portion or a Dish + scale
- `Day` — Entries within the 04:00–04:00 Asia/Jerusalem boundary, with computed totals

Behaviour to pin with tests:

- resolving a Portion to grams, including household units
- computing macros for a Portion of a Food
- computing a Dish's totals from components, at any scale
- computing a Day's totals from Entries
- deriving a Day's confidence band from its estimated components
- assigning a timestamp to the correct Day across the 04:00 boundary, including DST

**Out** — persistence, API, UI, search, seeding.

## Acceptance

- [ ] `packages/nutrition/domain` imports nothing from Next.js, Drizzle, or any provider SDK
- [ ] Tests run in under two seconds with no browser and no database
- [ ] A meal eaten at 01:30 lands on the previous Day; 04:30 lands on the current one
- [ ] A Dish scaled to `×½` yields exactly half, and keeps every component's provenance
- [ ] A Day mixing grounded and estimated items reports a band, not a single figure
- [ ] Every exported type uses a name from the PRD §4 glossary. No `Meal`. No `ארוחה`.

## Verification

Vitest only. There is nothing to look at, and that is the point — this is the layer that stays
verifiable when reviewing from a phone.

## Notes

- Israel observes DST; the 04:00 boundary must be computed in `Asia/Jerusalem`, not by offset
  arithmetic. There is a day each year with a 23-hour span and one with 25.
- Totals are computed, never stored. v2 kept denormalised running totals on `DailyLog` and had to
  hand-maintain their consistency.
- Confidence bands: keep the first version simple and documented. Precision here matters less than
  never presenting an estimate as exact.
