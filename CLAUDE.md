# CLAUDE.md

Context for Claude Code working in this repo.

## What ARVEN is

A personal health hub, built to eventually track every aspect of the owner's health and help him
understand what he is actually doing with it.

The vision is conversational: speak to it about what you ate and how you slept, let it read Apple
Health for sleep, workouts and calorie burn, and get a complete picture back.

The go-to-market slice is narrower on purpose: **accurate calorie and macro intake logging, by hand,
on the web.** That has to work well before anything else is built.

Built by one person as a side project. Multi-user comes later, but the data model should not have to
be rewritten when it does.

## Read this first

**`docs/brand-brief.md` governs this project.** Read it before proposing a feature, writing UI copy,
choosing a colour, or naming anything. Every decision should be dictated by it.

**`docs/brand-appendix-hebrew.md` governs everything in Hebrew** — which is the entire product
interface. Read it before writing a single Hebrew string. It is not a translation guide; it defines
how ARVEN behaves for Israeli users. The rules that bite most often:

- **Write gender-neutral Hebrew** (A7). Prefer `הצריכה היום הייתה גבוהה מהרגיל` over `אכלת יותר
  מהרגיל`. This also makes the voice more observational and less judgmental. Direct second person is
  still right for actions — `מה אכלת?`, `מה תרצה להוסיף?` (A8).
- **Use the established microcopy** (A41): `היום`, `השבוע`, `נרשם`, `עריכה`, `מחיקה`, `היסטוריה`,
  `תובנות`, `מגמות`, `טווח רגיל`. Don't invent a second word for something already named.
- `קלוריות`, never `קק"ל`, in consumer copy (A11). `kcal` is acceptable in tight metric UI.
- 24-hour time (A34). Dates as `8 באוגוסט` (A33). Western numerals always (A32).
- The Israeli week starts **Sunday**, with Hebrew day names (A26).
- Time-series charts still run left-to-right even in RTL (A29). Never reverse chronology.
- Mixed-direction strings (`142 גרם`, `2,050 kcal`, `7:42 שעות`) must be QA'd by eye — they are the
  most common RTL rendering bug.
- Israeli food language is the vocabulary: `לאפה`, `סביח`, `בורקס`, `פרגית`, `שניצל`, `חלה`,
  `ארוחת שישי`, `על האש` (A9). Never make the user translate their meal into database English.

**Typography** (A30, A31): Hebrew must not evoke government services, newspapers, religious
publishing or supermarket brands. The ARVEN wordmark stays Latin (A1), so no Hebrew serif is needed
for branding — prefer a single refined, contemporary Hebrew sans with excellent numerals throughout.
Note that Frank Ruhl Libre, despite being the obvious free choice, is the classic Hebrew *newspaper*
face and is therefore ruled out by A31.

`docs/brand-board.png` shows the visual direction and palette in situ. Its mockups depict the
long-term vision, not iteration 1 scope — `docs/PRD.md` §8 defines scope.

The two-part brand test for anything user-facing: *would this feel natural at a world-class longevity
retreat, and inside a world-class technology product?* If only the first, it's too spa-like. If only
the second, it's too technological.

Explicitly forbidden by the brief: gamification, streaks, confetti, sparkle or robot iconography,
purple gradients, visible "AI" labelling, diet-culture language ("cheat meal", "clean eating",
"guilty", "crush it"), and notifications that manufacture engagement. The voice is short, calm,
specific, low-emotion, high-information — never marketing, never congratulatory.

## Hard constraints

These are not preferences. Check any proposal against them.

1. **Zero fixed cost.** Free tiers only — no paid database, no paid hosting, no paid monitoring.
   LLM tokens are the single accepted variable cost and should be minimised (cheap models, small
   prompts, cache aggressively). If a design needs a paid service, say so explicitly and stop.
2. **Phone-first development.** The owner works from a phone via Claude remote. Anything that
   requires a human at a laptop — manual deploy steps, local-only test runs, interactive prompts —
   is a design flaw. CI must deploy to production on merge.
3. **Verifiable from a phone.** Playwright provides a visual check of what changed, so work can be
   reviewed without opening a laptop.
4. **Small, shippable slices.** Each work session in `docs/sessions/` lands independently and leaves
   the app working.

## History worth knowing

ARVEN is the **third** attempt. Both predecessors are readable, and both are worth understanding
before their mistakes get repeated.

**v1** — a Telegram nutritionist bot: Telegraf on Fly.io, Neon, Groq. It lived at `packages/bot`
inside the v2 repo until Phase 10 deleted it, so it survives only in that repo's history:
`git checkout f265b9e^ -- packages/bot`.

**v2** — github.com/OmriAchituv/health-hub (private). Next.js 14 + Prisma + Vercel, 79 commits,
abandoned 2026-04-05. It covered similar ground (meals, dishes, chat, weight, Telegram intake), and
it is the source of the two anti-patterns named later in this file: the `shared` junk drawer, and
food data that was never seeded.

ARVEN is a deliberate from-scratch rebuild, not a port. Read them for lessons and pitfalls; do not
copy their structure.

## Working agreements

- `docs/PRD.md` is the source of truth for scope. Code that drifts from it is a bug in one of the two.
- **GitHub Issues are the working surface.** Work comes from an issue; `docs/sessions/README.md` is
  the narrative explaining how the work is cut and in what order.
- One slice, one PR. It merges and deploys, or it isn't done.
- **Merging is rebase-and-merge, triggered by adding the `merge` label.** A workflow waits for the
  checks on that exact commit and merges only if they are green. It is a label rather than an
  approval because GitHub does not let you approve your own pull request, and on a one-person
  project every pull request is your own.
- Don't start a slice whose blockers are still open.
- Acceptance criteria are binary. "Seeded" means an asserted row count, never a ticked box.
- **Run `pnpm screens` before pushing a change that alters the interface.** It runs the end-to-end
  suite and writes the screenshots into `.github/screens/`, which get committed with the code so
  they render inline in the CI comment and under Files changed. CI cannot produce them itself:
  pushes made with GITHUB_TOKEN do not trigger workflows, so a bot commit would leave the pull
  request head with no check on it at all. CI does compare the set it produced against the set the
  branch carries, so a screen you forgot to commit fails the build.
- Work is sliced **vertically**. Every slice cuts schema → domain → tRPC → Hebrew UI → tests and ends
  as something openable on a phone. A change that builds one layer with nothing to demo is a planning
  error — that shape is how v2's food data went unseeded and unnoticed.

## Product principles

From `docs/PRD.md` §3. Check any proposal against them.

1. **The model never touches a number.** An LLM may parse text into candidate items and portions.
   Every gram, calorie and macro comes from a food database or the user.
2. **Trust comes from provenance, not decimals.** Every value records its origin and confidence.
   Grounded values render exactly; estimates render as estimates, never disguised as measurements.
3. **Less input, more inference.** Every required tap must earn itself.
4. **One pipeline.** Manual, natural language and voice converge on the same resolver. New input
   methods are adapters, never parallel implementations.
5. **A domain core that owns the language.** Pure TypeScript, no framework or provider imports,
   names matching reality, behaviour pinned by tests.

## Domain language

Code is English, the product speaks Hebrew, and no third word for a concept is permitted.

`Food`/מזון · `Portion`/מנת הגשה · `Dish`/מנה · `Entry`/רישום · `Day`/יום · `Provenance`/מקור ·
`Signal`/סיגנל · `Baseline`/בסיס

**`Meal` and `ארוחה` are banned.** Eating occasions are deliberately not modelled — repetition is
served by `Dish`. Keeping the word out of the code stops the concept creeping back in.

A `Day` runs 04:00–04:00 Asia/Jerusalem. Totals are always computed, never stored denormalised.

## Stack

Monorepo, pnpm workspaces. Contexts are sliced by health domain (`nutrition`, `signals`, `identity`,
`insight`), never by technical layer — a package spanning domains recreates v2's `shared` junk drawer.

Next.js App Router · tRPC · Neon Postgres · Drizzle · Tailwind · Vitest on the domain · Playwright on
the flows · Vercel · GitHub Actions. All free tier.

Apple Health ingest is a plain REST route, not tRPC — an iOS Shortcut can only POST JSON to a URL.

Commands, directory detail and conventions get filled in as sessions land (see session 10).
