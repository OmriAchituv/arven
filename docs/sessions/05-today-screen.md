# Session 05 — Today

**Depends on:** 03, 04 · **Delivers:** the first screen, read-only

## Goal

The screen ARVEN opens to. Per brief §33 it is not a dashboard — it answers *how am I doing today?*
before it presents data.

Read-only. Adding food is the next session, deliberately: this one is about getting the reading
right without the distraction of input.

## Scope

**In**

- Today's total with its confidence band
- Protein, carbs, fat
- Flat chronological Entry list — no grouping, no categories, per PRD §4
- Per-entry: name, portion, calories, provenance mark
- Empty state that feels considered rather than blank
- Real data from the seeded database via tRPC
- Mobile-first, Hebrew RTL

**Out** — adding, editing, deleting, previous days, goals, charts.

## Acceptance

- [ ] Renders a real day from real seeded data
- [ ] Grounded and estimated items are visually distinct; estimated show `~`
- [ ] The day total shows a band when estimates are present, and doesn't when they aren't
- [ ] Correct on an iPhone viewport, in Hebrew, right-to-left
- [ ] Playwright screenshots — populated, empty, and dark — attached to the PR
- [ ] Copy passes brief §19–22: short, calm, specific, never congratulatory

## Notes

- Understanding before data (§33). The total and its honesty come first; the itemised list is
  secondary.
- No goal or target yet — a bare number, presented well. Progress bars arrive with Identity in
  iteration 4.
- Seed a realistic day into the dev database for screenshots. It's also the fixture Playwright uses.
