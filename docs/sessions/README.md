# Iteration 1 — the slices

Nine vertical slices of [`../PRD.md`](../PRD.md) §8.

**GitHub Issues are the working surface.** This file is the narrative — why the work is cut this
way, and in what order. Acceptance criteria live on the issues, so they get ticked where the work
happens rather than drifting here.

## How the work is cut

Each slice is a **tracer bullet**: a thin path cutting through every layer at once — schema, domain,
tRPC, Hebrew UI, tests — narrow in scope but complete end to end. Every slice finishes as something
you can open on your phone.

This matters more than it sounds. The obvious way to plan this project is by layer: build the domain
core, then seed the food data, then build a design system, then start on screens. Every one of those
is days of work that demos as nothing, and the food import in particular becomes a large isolated
task that can quietly not finish. **That is exactly how v2 died** — its food table was modelled
correctly and never filled, and nobody noticed until every number in the app turned out to be a
guess.

Cutting vertically means the food data is proven by a screen displaying it, in the second slice, and
stays proven from then on.

## The slices

| # | Slice | Delivers | After |
|---|---|---|---|
| [#1](https://github.com/OmriAchituv/arven/issues/1) | Walking skeleton | A deployed shell on your home screen, and the CI that guards it | — |
| [#2](https://github.com/OmriAchituv/arven/issues/2) | Log a food by weight | MoH data, Hebrew search, grams, Today. The spine. | #1 |
| [#3](https://github.com/OmriAchituv/arven/issues/3) | Household portions | `פיתה אחת` → real grams, by lookup | #2 |
| [#4](https://github.com/OmriAchituv/arven/issues/4) | Estimates & confidence | `○`, the band, and weighing to upgrade | #3 |
| [#5](https://github.com/OmriAchituv/arven/issues/5) | Correct the record | Edit, delete, undo, previous days | #2 |
| [#6](https://github.com/OmriAchituv/arven/issues/6) | Your own foods | The personal tier, ranked first | #2 |
| [#7](https://github.com/OmriAchituv/arven/issues/7) | Dishes | Compose, save, log, scale | #6 |
| [#8](https://github.com/OmriAchituv/arven/issues/8) | USDA fallback | Third tier and the full ranking rule | #6 |
| [#9](https://github.com/OmriAchituv/arven/issues/9) | Ship | Dark mode, PWA, a real day logged | #7, #8 |

Slice 2 is the largest, unavoidably — the first vertical has to establish schema, domain, API and the
first screen at once. Everything after it is narrower because the spine already exists.

Two things deliberately don't get slices of their own, because neither produces anything to look at:
the domain core arrives inside #2, and the design system emerges from the first screen it has to
render rather than preceding it.

## Rules

- **One slice, one PR.** It merges and deploys, or it isn't done.
- **Every slice leaves the app working.** Production is the daily driver.
- **Acceptance criteria are binary.** "Seeded" means an asserted row count, never a ticked box.
- **Read [`../brand-brief.md`](../brand-brief.md)** before any slice that renders a pixel or writes a
  word of Hebrew.
- Don't start a slice whose blockers aren't merged.

## Later iterations

Cut into slices when their iteration begins — the shape of each depends on what iteration 1 teaches.
See [`../PRD.md`](../PRD.md) §9.
