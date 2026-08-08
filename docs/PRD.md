# ARVEN — Product Requirements

> Source of truth for scope. Governed by [`brand-brief.md`](./brand-brief.md); where this document
> and the brief disagree, the brief wins and this document is wrong.

**Status:** approved, pre-implementation · **Date:** 2026-08-08 · **Author:** Omri, with Claude

---

## 1. What ARVEN is

Personal health intelligence. It brings together the signals that shape a person's health and turns
them into understanding.

The long-term product is the brief's three layers — **Capture → Understand → Guide**. This document
covers the wedge: nutrition capture, done properly, in Hebrew.

**Brand line:** your health, understood.
**Product mantra:** Capture. Understand. Improve.

---

## 2. Why this exists, and why it's the third attempt

Two previous versions were built and abandoned.

| | |
|---|---|
| **v1** | Telegram nutritionist bot. Telegraf on Fly.io. |
| **v2** | `~/health_hub` — Next.js 14 + Prisma + Vercel. Ten phases, all completed 2026-04-03, deployed, 79 commits, never pushed to a remote. |

Both were declared done by feature list. Both were abandoned within months. The stated reasons for
v2's failure, in the owner's words: the numbers weren't trustworthy, logging had too much friction,
chat was the wrong front door, and the codebase became unownable — *"the whole codebase and
architecture was wrong, the model's selections, the product and the brand."*

One root cause is concrete and documented. v2's `FoodReference` table was modelled correctly, with
real per-100g values and pgvector search over it. **The food data was never seeded.** The TODO still
carries the unticked box. So every macro figure in v2 came from a language model guessing, while the
UI presented those guesses with the confidence of measurements.

**Everything below is designed against those four failures.** Features are not the risk. Repeating
these is.

---

## 3. Principles

Non-negotiable. Check any proposal against them.

**1 · The model never touches a number.**
A language model may parse text into candidate items and portions. Every gram, calorie and macro
comes from a food database or from the user. This is what makes small, cheap models sufficient, and
it means the system works with the LLM switched off.

**2 · Trust comes from provenance, not decimals.**
Every logged item records where its number came from and how confident it is. Grounded values are
shown exactly. Estimates are shown as estimates. ARVEN never renders a guess in the costume of a
measurement. Per brief §34, *useful uncertainty is better than fake accuracy*.

**3 · Less input, more inference.**
Never ask for something ARVEN can reasonably derive. Every required tap must earn itself.

**4 · One pipeline.**
Manual entry, natural language and voice all converge on the same resolver producing the same
provenance-tagged items. New input methods are adapters, never parallel implementations.

**5 · A domain core that owns the language.**
Business rules live in pure TypeScript that knows nothing of Next.js, the database, or any model
provider. Names in code match names in reality. Tests pin behaviour. This is the ownability
mechanism — the answer to failure #4.

**6 · Zero fixed cost.**
Free tiers only. LLM tokens are the single accepted variable cost. A design that needs a paid
service must say so explicitly and stop.

---

## 4. Domain

### Ubiquitous language

Code identifiers are English; the product speaks Hebrew. Both refer to the same concept, and no
third word for it is permitted anywhere.

| Code | Product | Meaning |
|---|---|---|
| `Food` | מזון | A single item with per-100g values. From MoH, USDA, Open Food Facts, or created by the user. |
| `Portion` | מנת הגשה | A quantity of a Food — grams, millilitres, or a household unit (`כוס`, `פרוסה`, `יחידה`). |
| `Dish` | מנה | A user-saved composition of Foods with portions. Named, reusable, scalable. |
| `Entry` | רישום | One act of eating, at a time. References a Food + Portion, or a Dish + scale. |
| `Day` | יום | All Entries between 04:00 and 04:00 Asia/Jerusalem, with computed totals. |
| `Provenance` | מקור | Where a number came from, and how sure. |
| `Signal` | סיגנל | A measurement from outside ARVEN — sleep, active energy, steps. |
| `Baseline` | בסיס | A person's normal for a Signal, derived over time. |

Vocabulary is inherited from brief §23. Words from §24 — *cheat meal, clean eating, guilty, crush
it, failure, perfect day* — appear nowhere, in code or interface.

**Deliberately absent:** `Meal` / `ארוחה`. Eating occasions are not modelled. The word is banned in
code so the concept cannot creep back in. Repetition is served by `Dish`, not by meal labels.

### Provenance model

Every value carries its origin:

| Mark | Source | Shown as |
|---|---|---|
| `●` | User-weighed | exact |
| `●` | Barcode match | exact |
| `●` | Database match at a known portion unit | exact |
| `○` | Estimated portion (`חופן`, `בערך`) | range, with `~` |

A Day's total carries a confidence band derived from its estimated components. An `○` item can be
upgraded to `●` by weighing it — the interface always offers this and never demands it.

### The Day

- Runs **04:00 → 04:00, Asia/Jerusalem**. Eating at 01:30 belongs to the previous day.
- Entries are a **flat chronological list**. No meal grouping, no categories, no picker.
- Totals are computed from Entries, never stored denormalised. (v2 stored running totals on
  `DailyLog` and had to keep them in sync by hand.)

### Dishes

A Dish stores **components, not totals**. Totals are computed on every use.

Consequences, all intended: scaling to `×½` stays exact; swapping an ingredient is an edit rather
than a re-entry; provenance survives into history; and a Dish can never silently become a frozen
number whose origin is unrecoverable.

---

## 5. Bounded contexts

Packages are sliced by health domain, not by technical layer. Each owns its own model, language and
storage. This is what stops a `shared` junk drawer forming — v2's `packages/shared` held schema,
types and services for everything, which is why everything reached into everything.

| Context | Owns | Status |
|---|---|---|
| **nutrition** | Food, Portion, Dish, Entry, Day | Iteration 1 |
| **identity** | Person, preferences, goals | Iteration 4 |
| **signals** | Signal, Sample, Baseline — Apple Health ingest | Iteration 3 |
| **insight** | Pattern, Trend, Observation. Reads other contexts, owns no data. | Later |

`Capture`, `Understand` and `Guide` are **verbs each context exposes**, not packages. A `capture`
package would know about food and sleep and weight simultaneously, which is `shared` under a new
name.

---

## 6. Architecture

```
apps/
  web/                    Next.js · Hebrew RTL · PWA
    app/(app)/            screens
    app/api/trpc/         everything the app calls
    app/api/ingest/       REST — Shortcuts cannot speak tRPC
    server/routers/       thin: validate, delegate, return

packages/
  nutrition/
    domain/               pure. no next, no db, no model provider
    app/                  use cases — logEntry, resolvePortion, saveDish
    infra/                drizzle repositories
  signals/                (iteration 3)
  identity/               (iteration 4)
  insight/                (later)
  db/                     drizzle schema + migrations
  ui/                     design system — brand tokens, Hebrew type
```

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Free tier, preview deploys, zero-config CI |
| Monorepo | pnpm workspaces | DDD context boundaries need real package edges |
| API | tRPC | End-to-end types; the compiler is the reviewer when reviewing on a phone |
| Database | Neon Postgres | Free tier, proven in v2 |
| ORM | Drizzle | No codegen, no engine binary, the SQL stays legible |
| Auth | Passphrase in middleware → Google later | Iteration 1 has one user |
| Hosting | Vercel | Free, preview per PR, deploy on merge |
| Tests | Vitest on domain, Playwright on flows | Domain tests need no browser and run in seconds |
| Shell | PWA, installable | Home-screen app for $0; native later is a change of shell |

**The Apple Health ingest is REST, not tRPC** — an iOS Shortcut can only POST plain JSON to a URL.
The endpoint accepts a generic payload so a native app or third-party bridge can post the identical
body later without a schema change.

---

## 7. Food data

The layer v2 skipped. **Seeding is an acceptance criterion of the session that builds it — if the
table is empty, the session is not done.**

Searched in this order:

| Order | Source | Contents | Cost |
|---|---|---|---|
| 1 | **Personal** | Foods you created or verified | — |
| 2 | **מאגר התזונה הישראלי** (MoH) | 4,500+ items, 74 nutrients, per 100g, **Hebrew names**, **household measurement units per product**, recipes | free, open licence |
| 3 | **USDA** SR Legacy + Foundation | ~8,000 whole foods, for gaps | public domain |
| 4 | **Open Food Facts** | Barcode lookup, fetched on scan, **cached permanently** | free API |

Israel's Ministry of Health publishes its national nutrition database as open data on `data.gov.il`
(dataset `nutrition-database`, CSV, last updated March 2023 — composition data ages slowly).

The **יחידות מידה** tables are the reason iteration 1 is both token-free and low-friction: *"פיתה
אחת"* and *"כוס קוטג׳"* resolve to real grams **by lookup, not by language model**.

USDA's Branded Foods set (multiple GB) is out of scope — it does not fit a free-tier database and
Open Food Facts covers branded items better for an Israeli user.

---

## 8. Scope — iteration 1

**In:**

- Today screen: totals with confidence band, flat chronological entry list, provenance marks
- Search: personal library → MoH → USDA
- Portion selection: household units from the MoH tables, or grams
- Add, edit, delete an Entry; navigate to previous days
- Create a personal Food by hand (name, per-100g values)
- Create a Dish from Foods; log it; scale it
- Hebrew RTL interface, brand typography, PWA installable
- Deployed to production, on the home screen, in daily use

**Out — each a later session, with the pipeline already built:**

natural language · voice · Apple Health · barcode scanning · charts and trends · insights ·
goals and TDEE · weight · Google sign-in · multi-user · notifications

**Cost of iteration 1: ₪0.** No model is called. No token is spent.

---

## 9. Roadmap

| # | Iteration | Delivers |
|---|---|---|
| 1 | **Nutrition capture** | Everything above |
| 2 | **Tell ARVEN** | Hebrew free-text → parsed items → same resolver. Model parses; database computes. |
| 3 | **Signals** | Shortcut posts sleep, active energy, steps each morning |
| 4 | **Identity** | Google sign-in, profile, goals; passphrase middleware deleted |
| 5 | **Voice** | Transcription in front of the parser |
| 6 | **Understand** | Baselines, patterns, the daily briefing of brief §33 |
| — | **Native** | Only when Apple Health needs live sync or real users arrive |

Iteration 2 writes the parser behind a provider-agnostic interface:

```ts
interface FoodTextParser { parse(he: string): ParsedItem[] }
```

Gemini, OpenAI and Groq implementations are swappable in one line. The model is chosen at that
session, evaluated against real Hebrew sentences logged during iteration 1. Hebrew accuracy is the
deciding axis. No agent framework — parsing one sentence does not need planning loops. Agentic
reasoning is reserved for the insight context, where multi-step questions over personal data
genuinely need it.

---

## 10. Delivery

```
coding session → PR → CI → preview + screenshots → merge → production → phone
```

- **Every change is a PR.** CI runs typecheck, domain unit tests, and Playwright.
- The PR carries a **Vercel preview URL** (*does this feel right?* — opened on the phone, in Hebrew,
  with a thumb) and **Playwright screenshots** of affected screens (*did anything visually break?*).
- **Merging `main` deploys production.** Production is the daily driver.
- Review and merge happen from the GitHub mobile app.

CI must be the thing that says no. Reviewing a diff properly on a phone is hard, so the gate cannot
depend on the owner catching it by reading.

**Cost:** Actions gives 2,000 minutes/month on private repos; a run here is a couple of minutes.
Preview deploys are free. Total: $0.

---

## 11. Constraints

| | |
|---|---|
| **Zero fixed cost** | Free tiers only. LLM tokens are the one accepted variable cost, minimised. A design needing a paid service must say so and stop. |
| **Phone-first development** | Anything requiring a human at a laptop is a design flaw. |
| **Hebrew-first** | RTL interface, Hebrew food names, Hebrew parsing. Not internationalised — Hebrew is the product. |
| **One user** | Omri, for the foreseeable future. Schema is user-scoped so this doesn't need rewriting. |
| **Ownable** | If the domain core can't be read in one sitting, it has failed. |

**Typography note:** the brief's typefaces (§30 — Canela, Tiempos, Instrument Serif) have **no
Hebrew glyphs**. The Hebrew pairing holding the same editorial-serif-against-precise-sans tension is
**Frank Ruhl Libre** with **Assistant** or **Heebo** — all free on Google Fonts. The brand direction
survives intact; only the font names change. To be confirmed in the design session.

---

## 12. Definition of done

Iteration 1 is done when every item in §8 is built, tested, deployed, and installed on the phone.

> **Recorded risk.** This is a feature-list definition of done — the same definition under which v1
> and v2 were both declared complete and then abandoned. It was raised during the grilling and
> chosen deliberately.
>
> A leading indicator is available for free if it's ever wanted, because provenance is stored on
> every item: **the share of logged grams that were grounded rather than estimated.** A healthy
> figure means search and portion units are working. A low one means the food data isn't being found
> and the numbers are guesses again — visible in week two rather than in month four.

---

## 13. Open questions

| Question | Resolve by |
|---|---|
| Which sample types export cleanly from a Shortcut in bulk? | Spike, iteration 3 |
| MoH CSV encoding, schema and join keys across the four tables | Session 3 — first real contact with the data |
| Hebrew typeface pairing and the brand's dark mode | Design session |
| Whether a passphrase gate is wanted at all before Google sign-in | Owner's call; the data is a food log |
| How the MoH recipes table is used, if at all | After the Dish model is in use |
