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

A v1 exists at `~/health_hub` — Next.js 14 + Prisma + Vercel, 79 commits, never pushed to a remote,
abandoned 2026-04-05. It covered similar ground (meals, dishes, chat, weight, Telegram intake).
ARVEN is a deliberate from-scratch rebuild, not a port. Read v1 for lessons and pitfalls; do not copy
its structure.

## Working agreements

- `docs/PRD.md` is the source of truth for scope. Code that drifts from it is a bug in one of the two.
- Do not start a session that isn't sliced out in `docs/sessions/`.

## Stack

Not chosen yet — decided during the PRD. This section gets filled in with commands (dev, test,
build, deploy), directory layout and conventions once it is.
