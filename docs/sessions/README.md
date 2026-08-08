# Sessions

Iteration 1 of [`../PRD.md`](../PRD.md), sliced into individually shippable units of work.

## Rules

- **One session, one PR.** It merges and deploys, or it isn't done.
- **Every session leaves the app working.** No session ends with production broken.
- **Acceptance criteria are binary.** "Seeded" means a row count you can assert, not a checkbox
  someone ticks. This is the specific rock v2 died on.
- **Read [`../brand-brief.md`](../brand-brief.md) before any session that renders a pixel or writes
  a word of Hebrew.**
- Don't start a session whose dependencies aren't merged.

## Iteration 1 — nutrition capture

| # | Session | Delivers | Depends on |
|---|---|---|---|
| [00](./00-foundation.md) | Foundation & delivery | Monorepo, CI, preview deploys, production URL | — |
| [01](./01-nutrition-domain.md) | Nutrition domain core | Pure, tested business rules. No UI, no DB. | 00 |
| [02](./02-food-data.md) | Food data | MoH + USDA seeded and queryable | 00, 01 |
| [03](./03-search-and-portions.md) | Search & portions | tRPC search, household units → grams | 01, 02 |
| [04](./04-design-foundations.md) | Design foundations | Brand tokens, Hebrew type, RTL, PWA shell | 00 |
| [05](./05-today-screen.md) | Today | Totals, entries, provenance — read-only | 03, 04 |
| [06](./06-add-entry.md) | Add an entry | Search → portion → logged | 05 |
| [07](./07-edit-and-history.md) | Edit & history | Change, remove, previous days | 06 |
| [08](./08-personal-foods.md) | Personal foods | Create and verify your own Food | 06 |
| [09](./09-dishes.md) | Dishes | Compose, save, log, scale | 08 |
| [10](./10-ship.md) | Ship | Installed, in daily use | 09 |

## Later iterations

Written when their iteration begins — the shape of each depends on what iteration 1 teaches.

| Iteration | Sessions |
|---|---|
| 2 · Tell ARVEN | Parser interface · model evaluation · resolve & confirm UI |
| 3 · Signals | Ingest endpoint · Shortcut spike · signals context · display |
| 4 · Identity | Google sign-in · profile · goals · delete the passphrase gate |
| 5 · Voice | Transcription in front of the parser |
| 6 · Understand | Baselines · patterns · the daily briefing |
